import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import archiver from 'archiver';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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

const submissionsFile = path.resolve('./submissions.json');
if (!fs.existsSync(submissionsFile)) fs.writeFileSync(submissionsFile, '[]');

// Deadline storage
const deadlineFile = path.resolve('./deadline.json');
if (!fs.existsSync(deadlineFile)) fs.writeFileSync(deadlineFile, 'null');

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

app.post('/api/submit', uploadMulti.array('documents', 10), async (req, res) => {
  const { name, email } = req.body;
  const deadline = JSON.parse(fs.readFileSync(deadlineFile));
  if (deadline && new Date() > new Date(deadline)) {
    return res.status(403).json({ error: "Deadline is over, you can’t upload now." });
  }
  if (!name || !req.files || req.files.length === 0) return res.status(400).json({ error: 'Name and at least one document required.' });
  const submissions = JSON.parse(fs.readFileSync(submissionsFile));
  const entries = req.files.map(file => ({
    name,
    email,
    filename: file.filename,
    originalname: file.originalname,
    time: new Date().toISOString()
  }));
  submissions.push(...entries);
  fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2));
  res.json({ success: true, files: entries.map(e => ({ filename: e.filename, originalname: e.originalname })) });
});

app.get('/api/submissions', (req, res) => {
  let submissions = JSON.parse(fs.readFileSync(submissionsFile));
  const { search, filetype, sort } = req.query;
  if (search) {
    submissions = submissions.filter(sub => sub.name.toLowerCase().includes(search.toLowerCase()));
  }
  if (filetype) {
    submissions = submissions.filter(sub => {
      const ext = path.extname(sub.originalname).toLowerCase();
      return ext === `.${filetype.toLowerCase()}`;
    });
  }
  if (sort === 'latest') {
    submissions = submissions.sort((a, b) => new Date(b.time) - new Date(a.time));
  } else if (sort === 'oldest') {
    submissions = submissions.sort((a, b) => new Date(a.time) - new Date(b.time));
  }
  res.json(submissions);
});

app.get('/api/download/:filename', (req, res) => {
  const file = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(file)) res.download(file);
  else res.status(404).send('File not found');
});

app.delete('/api/delete-file/:filename', (req, res) => {
  const { filename } = req.params;
  const file = path.join(uploadsDir, filename);
  let submissions = JSON.parse(fs.readFileSync(submissionsFile));
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'File not found' });
  fs.unlinkSync(file);
  submissions = submissions.filter(sub => sub.filename !== filename);
  fs.writeFileSync(submissionsFile, JSON.stringify(submissions, null, 2));
  res.json({ success: true });
});

app.get('/api/download-all', (req, res) => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  res.attachment('all_submissions.zip');
  archive.pipe(res);
  fs.readdirSync(uploadsDir).forEach(file => {
    archive.file(path.join(uploadsDir, file), { name: file });
  });
  archive.finalize();
});

app.get('/api/deadline', (req, res) => {
  const deadline = JSON.parse(fs.readFileSync(deadlineFile));
  res.json({ deadline });
});

app.post('/api/deadline', (req, res) => {
  const { deadline } = req.body;
  if (!deadline) return res.status(400).json({ error: 'Deadline required.' });
  fs.writeFileSync(deadlineFile, JSON.stringify(deadline));
  res.json({ success: true });
});

app.get('/api/analytics', (req, res) => {
  const submissions = JSON.parse(fs.readFileSync(submissionsFile));
  const users = new Set(submissions.map(sub => sub.name));
  const totalFiles = submissions.length;
  let mostRecent = null;
  if (submissions.length > 0) {
    mostRecent = submissions.reduce((a, b) => new Date(a.time) > new Date(b.time) ? a : b);
  }
  res.json({
    totalUsers: users.size,
    totalFiles,
    mostRecent
  });
});

app.listen(PORT, () => console.log(`Docky server running on port ${PORT}`));
