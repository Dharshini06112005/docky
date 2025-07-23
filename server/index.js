import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import nodemailer from 'nodemailer';
import archiver from 'archiver';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
    return;
  }
  console.log('Connected to PostgreSQL database!');
});

const app = express();
const PORT = process.env.PORT || 5000;

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Rate limiting: 5 requests per minute per IP for login and signup
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many attempts, please try again later.' }
});

// Allow cross-origin requests
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://docky-frontend.onrender.com', 'http://localhost:3000']
    : 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json());

const uploadsDir = path.resolve('./uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'image/jpeg',
  'image/png'
];

// Multer for multiple files and type check
const uploadMulti = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'), false);
  }
});

// Protect sensitive routes with JWT middleware
app.post('/api/submit', requireAuth, uploadMulti.array('documents', 10), async (req, res) => {
  const { name, email } = req.body;
  // Fetch the current deadline from the database
  pool.query('SELECT deadline FROM deadlines ORDER BY id DESC LIMIT 1', (err, results) => {
    if (err) {
      console.error('Error fetching deadline from PostgreSQL:', err);
      return res.status(500).json({ error: 'Failed to fetch deadline.' });
    }
    const deadline = results.rows.length > 0 ? results.rows[0].deadline : null;

    if (deadline && new Date() > new Date(deadline)) {
      return res.status(403).json({ error: "Deadline is over, you can’t upload now." });
    }
    if (!name || !req.files || req.files.length === 0) return res.status(400).json({ error: 'Name and at least one document required.' });

    // Insert each file submission into PostgreSQL
    const entries = req.files.map(file => [
      name,
      email,
      file.filename,
      file.originalname,
      new Date()
    ]);

    const sql = 'INSERT INTO submissions (name, email, filename, originalname, time) VALUES ?';
    pool.query(sql, [entries], (err, result) => {
      if (err) {
        console.error('Error inserting submissions:', err);
        return res.status(500).json({ error: 'Failed to save submissions.' });
      }
      res.json({ success: true, files: entries.map(e => ({ filename: e[2], originalname: e[3] })) });
    });
  });
});

app.get('/api/submissions', requireAuth, (req, res) => {
  const { search, filetype, sort } = req.query;
  let sql = 'SELECT * FROM submissions';
  let params = [];
  let conditions = [];

  if (search) {
    conditions.push('LOWER(name) LIKE $1');
    params.push(`%${search.toLowerCase()}%`);
  }
  if (filetype && filetype.toLowerCase() !== 'all') {
    conditions.push('LOWER(SUBSTRING(originalname from \'\\.(\\w+)$)\') = $' + (params.length + 1));
    params.push(filetype.toLowerCase());
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  if (sort === 'latest') {
    sql += ' ORDER BY time DESC';
  } else if (sort === 'oldest') {
    sql += ' ORDER BY time ASC';
  }

  pool.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching submissions:', err);
      return res.status(500).json({ error: 'Failed to fetch submissions.' });
    }
    res.json(results.rows);
  });
});

app.get('/api/download/:filename', requireAuth, (req, res) => {
  const file = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(file)) res.download(file);
  else res.status(404).send('File not found');
});

app.delete('/api/delete-file/:filename', requireAuth, (req, res) => {
  const { filename } = req.params;
  const file = path.join(uploadsDir, filename);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'File not found' });
  fs.unlinkSync(file);
  // Remove the submission from PostgreSQL
  pool.query('DELETE FROM submissions WHERE filename = $1', [filename], (err, result) => {
    if (err) {
      console.error('Error deleting submission from PostgreSQL:', err);
      return res.status(500).json({ error: 'Failed to delete submission from database.' });
    }
    res.json({ success: true });
  });
});

app.get('/api/download-all', requireAuth, (req, res) => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  res.attachment('all_submissions.zip');
  archive.pipe(res);
  fs.readdirSync(uploadsDir).forEach(file => {
    archive.file(path.join(uploadsDir, file), { name: file });
  });
  archive.finalize();
});

app.get('/api/deadline', requireAuth, (req, res) => {
  pool.query('SELECT deadline FROM deadlines ORDER BY id DESC LIMIT 1', (err, results) => {
    if (err) {
      console.error('Error fetching deadline from PostgreSQL:', err);
      return res.status(500).json({ error: 'Failed to fetch deadline.' });
    }
    const deadline = results.rows.length > 0 ? results.rows[0].deadline : null;
    res.json({ deadline });
  });
});

app.post('/api/deadline', requireAuth, (req, res) => {
  const { deadline } = req.body;
  if (!deadline) return res.status(400).json({ error: 'Deadline required.' });
  pool.query('INSERT INTO deadlines (deadline) VALUES ($1)', [deadline], (err, result) => {
    if (err) {
      console.error('Error saving deadline to PostgreSQL:', err);
      return res.status(500).json({ error: 'Failed to save deadline.' });
    }
    res.json({ success: true });
  });
});

app.get('/api/analytics', requireAuth, (req, res) => {
  pool.query('SELECT name, time FROM submissions', (err, results) => {
    if (err) {
      console.error('Error fetching analytics:', err);
      return res.status(500).json({ error: 'Failed to fetch analytics.' });
    }
    const users = new Set(results.rows.map(sub => sub.name));
    const totalFiles = results.rows.length;
    let mostRecent = null;
    if (results.rows.length > 0) {
      mostRecent = results.rows.reduce((a, b) => new Date(a.time) > new Date(b.time) ? a : b);
    }
    res.json({
      totalUsers: users.size,
      totalFiles,
      mostRecent
    });
  });
});

// User/Admin Sign Up with validation
app.post('/api/signup', authLimiter, [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters.'),
  body('email').isEmail().withMessage('Invalid email.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role').isIn(['User', 'Admin'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (!['User', 'Admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }
  // Check for unique username
  pool.query('SELECT id FROM users WHERE username = $1', [username], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (results.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists.' });
    }
    // Check for unique email+role
    pool.query('SELECT id FROM users WHERE email = $1 AND role = $2', [email, role], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error.' });
      if (results.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered for this role.' });
      }
      // Check for same email+password in other role
      pool.query('SELECT password FROM users WHERE email = $1 AND role != $2', [email, role], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        for (const user of results.rows) {
          if (await bcrypt.compare(password, user.password)) {
            return res.status(400).json({ error: 'This email and password combination is already used for another role.' });
          }
        }
        // Hash password and insert
        const hashedPassword = await bcrypt.hash(password, 10);
        pool.query('INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)', [username, email, hashedPassword, role], (err, result) => {
          if (err) return res.status(500).json({ error: 'Database error.' });
          res.json({ success: true });
        });
      });
    });
  });
});

// User/Admin Login with validation and JWT
app.post('/api/login', authLimiter, [
  body('email').isEmail().withMessage('Invalid email.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role').isIn(['User', 'Admin'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  const { email, password, role } = req.body;

  // Restrict admin login to fixed credentials
  if (role === 'Admin') {
    if (email !== 'admin@gmail.com' || password !== 'Admin$123') {
      return res.status(403).json({ error: 'You are not authorized to access the admin panel.' });
    }
    // Optionally, you can return a hardcoded admin user object
    const token = jwt.sign({ id: 0, username: 'admin', email, role }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ success: true, token, user: { id: 0, username: 'admin', email, role } });
  }

  pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error.' });
    if (results.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid login – check your email, password, or role.' });
    }
    const user = results.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid login – check your email, password, or role.' });
    }
    // Issue JWT
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  });
});

// JWT middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token.' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

app.listen(PORT, () => console.log(`Docky server running on port ${PORT}`));
