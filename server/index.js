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
app.use(cors());

// Body parser middlewareAdd to ChatCtrl+L
Ctrl+K to generate a command
Starting the deployment process
Load older messages
package-lock.json
but i need a  db in render without any other platform

Absolutely! You can use Render just for your database and host your server (backend) on any other platform you like. This is a common and supported setup.
How it works:
Your PostgreSQL database lives on Render.
Your backend (Node.js/Express) is deployed elsewhere (Heroku, Railway, AWS, DigitalOcean, etc.).
Your backend connects to the Render database using the "External Connection" string.
How to Do This
1. Create and Set Up Your Database on Render
You’ve already created your PostgreSQL database on Render.
You’ve set up the tables using DBeaver (or will do so).
2. Get the External Connection String
Go to your Render PostgreSQL service.
Find the "External Connection" string (looks like postgres://username:password@host:port/dbname).
This string is what you’ll use in your backend’s DATABASE_URL environment variable.
3. Deploy Your Server Anywhere
Deploy your backend on any platform you like (Heroku, Railway, AWS, etc.).
In your backend’s environment variables, set:
DATABASE_URL = (the Render external connection string)
JWT_SECRET = (your secret)
Your backend will connect to the Render database over the internet.
4. (Optional) Deploy Your Frontend Anywhere
Your frontend can be on Render, Vercel, Netlify, etc.
Just make sure it points to your backend’s URL.
Important Notes
Security: The Render database is protected by username/password and SSL. Only those with the connection string can access it.
Performance: For most apps, connecting to a database over the internet is fast enough. For very high-traffic or latency-sensitive apps, try to keep backend and database in the same region.
Cost: Render’s free database tier is great for development and small projects.
Summary
You can use Render for your database only.
Deploy your backend anywhere, just use the Render connection string.
This is a standard, supported, and safe approach.
If you want a step-by-step for a specific backend platform (like Heroku or Railway) using your Render database, let me know!
package-lock.json
i need to setup all deployment in render front back and db, so what i can do

Great! You can absolutely deploy your entire stack (frontend, backend, and database) on Render. Here’s a clear, step-by-step guide for deploying everything on Render:
1. Deploy the Database (PostgreSQL) on Render
Go to your Render Dashboard.
Click New + → PostgreSQL.
Fill in the details (name, region, free plan is fine).
Wait for the database to be provisioned.
Once ready, copy the Internal Connection String (for backend) and External Connection String (for local setup/testing).
Set up your tables using DBeaver as previously described.
2. Deploy the Backend (Node.js/Express) as a Web Service
Go to Render Dashboard.
Click New + → Web Service.
Connect your GitHub repo.
Fill in:
Name: e.g., docky-server
Root Directory: server
Build Command: npm install
Start Command: npm start
Region: (same as your database)
Under Environment Variables, add:
DATABASE_URL = (Render’s Internal Connection String for your PostgreSQL DB)
JWT_SECRET = (your secret)
Click Create Web Service.
Wait for the build and deploy to finish.
Note the URL Render gives you (e.g., https://docky-server.onrender.com).
3. Deploy the Frontend (React) as a Static Site
Go to Render Dashboard.
Click New + → Static Site.
Connect your GitHub repo.
Fill in:
Name: e.g., docky-client
Root Directory: client
Build Command: npm install && npm run build
Publish Directory: build
Under Environment Variables, add:
REACT_APP_API_URL = (the URL of your backend, e.g., https://docky-server.onrender.com)
Click Create Static Site.
Wait for the build and deploy to finish.
Note the URL Render gives you for your frontend.
4. Test Your App
Open your frontend URL in a browser.
Try signing up, logging in, uploading files, etc.
Everything should work, with the backend and database both on Render.
Summary Table
Part	Render Service Type	Directory	Build Command	Publish/Start Command	Important Env Vars
Database	PostgreSQL	—	—	—	—
Backend	Web Service	server	npm install	npm start	DATABASE_URL, JWT_SECRET
Frontend	Static Site	client	npm install && npm run build	—	REACT_APP_API_URL
Tips
Always use the Internal Connection String for DATABASE_URL in your backend’s Render environment.
If you make code changes, just push to GitHub—Render will auto-deploy.
You can view logs for each service in the Render dashboard for debugging.
If you want, I can provide screenshots or more detailed step-by-step for any of these parts—just let me know which!
package-lock.json
but you we can create table in dbeaver,  

Yes, you are absolutely correct!
You can (and should) use DBeaver to create your tables in your Render PostgreSQL database. This is the standard and recommended way to set up your database schema on Render.
Here’s how it fits into the all-Render deployment:
How DBeaver Fits Into Render-Only Deployment
Database (PostgreSQL) is hosted on Render.
You use DBeaver (on your computer) to connect to the Render database using the "External Connection" string.
You create the tables in DBeaver by running the SQL script I provided.
Your backend (on Render) connects to the same database using the "Internal Connection" string.
Why Use DBeaver?
Render does not provide a built-in SQL editor for you to run CREATE TABLE commands.
DBeaver (or any SQL client) lets you connect securely to your Render database and manage tables, data, etc.
Recap: Steps to Create Tables in DBeaver for Render
Get the "External Connection" string from your Render PostgreSQL dashboard.
Open DBeaver and create a new PostgreSQL connection using those details (host, port, db, user, password, SSL required).
Connect and open a new SQL script tab.
Paste and run the CREATE TABLE SQL script.
Verify the tables are created.
After That
Your backend (on Render) will use the "Internal Connection" string in its DATABASE_URL environment variable.
Your frontend and backend will both be on Render, and your database will be ready to use.
Summary:
DBeaver is just your tool for managing the database. The database itself is always on Render, and your backend and frontend are also on Render.
You do not need any other platform!
If you need a step-by-step for any part of this, just ask!
package-lock.json
so give me guide to complete this process for deployment

Absolutely! Here’s a complete, step-by-step guide to deploy your full stack (frontend, backend, and database) on Render, using DBeaver to set up your database tables.
🚀 Full Deployment Guide: Render + DBeaver
Step 1: Create Your PostgreSQL Database on Render
Go to your Render Dashboard.
Click New + → PostgreSQL.
Fill in the details (name, region, free plan is fine).
Click Create Database.
Wait for the database to be provisioned (a few minutes).
Once ready, go to your database’s page and find:
Internal Connection String (for backend on Render)
External Connection String (for DBeaver on your computer)
Step 2: Set Up Your Tables Using DBeaver
Open DBeaver on your computer.
Click the plug icon with a plus (New Database Connection).
Search for and select PostgreSQL.
Click Next.
Fill in the connection details from Render’s External Connection:
Host: (from Render, e.g., dpg-xxxxxx)
Port: (from Render, usually 5432)
Database: (from Render)
Username: (from Render)
Password: (from Render)
Click the SSL tab and set Use SSL to require.
Click Test Connection. If successful, click Finish.
In the left panel, right-click your database and choose SQL Editor → New SQL Script.
Paste this SQL and run it (lightning bolt icon):
sql
Apply to index.js
￼
￼
￼Add to ChatCtrl+L
Ctrl+K to generate a command
Starting the deployment process
Load older messages
package-lock.json
so give me guide to complete this process for deployment

Absolutely! Here’s a complete, step-by-step guide to deploy your full stack (frontend, backend, and database) on Render, using DBeaver to set up your database tables.
🚀 Full Deployment Guide: Render + DBeaver
Step 1: Create Your PostgreSQL Database on Render
Go to your Render Dashboard.
Click New + → PostgreSQL.
Fill in the details (name, region, free plan is fine).
Click Create Database.
Wait for the database to be provisioned (a few minutes).
Once ready, go to your database’s page and find:
Internal Connection String (for backend on Render)
External Connection String (for DBeaver on your computer)
Step 2: Set Up Your Tables Using DBeaver
Open DBeaver on your computer.
Click the plug icon with a plus (New Database Connection).
Search for and select PostgreSQL.
Click Next.
Fill in the connection details from Render’s External Connection:
Host: (from Render, e.g., dpg-xxxxxx)
Port: (from Render, usually 5432)
Database: (from Render)
Username: (from Render)
Password: (from Render)
Click the SSL tab and set Use SSL to require.
Click Test Connection. If successful, click Finish.
In the left panel, right-click your database and choose SQL Editor → New SQL Script.
Paste this SQL and run it (lightning bolt icon):
sql
Apply to index.js
￼
CREATE TABLE users (  id SERIAL PRIMARY KEY,  username VARCHAR(255) NOT NULL UNIQUE,  email VARCHAR(255) NOT NULL,  password VARCHAR(255) NOT NULL,  role VARCHAR(50) NOT NULL,  UNIQUE (email, role));CREATE TABLE submissions (  id SERIAL PRIMARY KEY,  name VARCHAR(255) NOT NULL,  email VARCHAR(255),  filename VARCHAR(255) NOT NULL,  originalname VARCHAR(255) NOT NULL,  time TIMESTAMPTZ NOT NULL);CREATE TABLE deadlines (  id SERIAL PRIMARY KEY,  deadline TIMESTAMPTZ NOT NULL);
Refresh the tables list to confirm users, submissions, and deadlines exist.
Step 3: Deploy Your Backend (Node.js/Express) as a Web Service
Go to Render Dashboard.
Click New + → Web Service.
Connect your GitHub repo.
Fill in:
Name: e.g., docky-server
Root Directory: server
Build Command: npm install
Start Command: npm start
Region: (same as your database)
Under Environment Variables, add:
DATABASE_URL = (Render’s Internal Connection String)
JWT_SECRET = (your secret, e.g., aP7B!v9z$E&H)MbQeThWmZq4t7w!z%C*)
Click Create Web Service.
Wait for the build and deploy to finish.
Note the URL Render gives you (e.g., https://docky-server.onrender.com).
Step 4: Deploy Your Frontend (React) as a Static Site
Go to Render Dashboard.
Click New + → Static Site.
Connect your GitHub repo.
Fill in:
Name: e.g., docky-client
Root Directory: client
Build Command: npm install && npm run build
Publish Directory: build
Under Environment Variables, add:
REACT_APP_API_URL = (the URL of your backend, e.g., https://docky-server.onrender.com)
Click Create Static Site.
Wait for the build and deploy to finish.
Note the URL Render gives you for your frontend.
Step 5: Test Your App
Open your frontend URL in a browser.
Try signing up, logging in, uploading files, etc.
Everything should work, with the backend and database both on Render.
Summary Table
Part	Render Service Type	Directory	Build Command	Publish/Start Command	Important Env Vars
Database	PostgreSQL	—	—	—	—
Backend	Web Service	server	npm install	npm start	DATABASE_URL, JWT_SECRET
Frontend	Static Site	client	npm install && npm run build	—	REACT_APP_API_URL
If you need screenshots or run into any errors at any step, just let me know which step and I’ll help you immediately!
package-lock.json
install  and setup the dbeaver in cmd, complete that give me sql and i create a table for it

￼
sudo snap install dbeaver-ce
Output
￼
Auto-run
Move to background
DBeaver Community Edition has been successfully installed on your system!
Next Steps
Open DBeaver:
You can launch it from your application menu or by running this command in your terminal:
text
Apply to index.js
￼
   dbeaver-ce
Connect to your Render PostgreSQL database using the "External Connection" details from your Render dashboard (host, port, database, username, password, SSL required).
Create your tables:
Here is the SQL you need to paste and run in DBeaver’s SQL editor:
sql
Apply to index.js
￼
CREATE TABLE users (  id SERIAL PRIMARY KEY,  username VARCHAR(255) NOT NULL UNIQUE,  email VARCHAR(255) NOT NULL,  password VARCHAR(255) NOT NULL,  role VARCHAR(50) NOT NULL,  UNIQUE (email, role));CREATE TABLE submissions (  id SERIAL PRIMARY KEY,  name VARCHAR(255) NOT NULL,  email VARCHAR(255),  filename VARCHAR(255) NOT NULL,  originalname VARCHAR(255) NOT NULL,  time TIMESTAMPTZ NOT NULL);CREATE TABLE deadlines (  id SERIAL PRIMARY KEY,  deadline TIMESTAMPTZ NOT NULL);
If you need step-by-step help connecting DBeaver to your Render database or running the SQL, just let me know!
package-lock.json
Step 2: Set Up Your Tables Using DBeaver
Open DBeaver on your computer.
Click the plug icon with a plus (New Database Connection).
Search for and select PostgreSQL.
Click Next.
Fill in the connection details from Render’s External Connection:
Host: (from Render, e.g., dpg-xxxxxx)
Port: (from Render, usually 5432)
Database: (from Render)
Username: (from Render)
Password: (from Render)
Click the SSL tab and set Use SSL to require.
Click Test Connection. If successful, click Finish.

explian step 6, i can't find in the bdeaver app

Absolutely! Here’s how to set SSL to "require" in DBeaver when connecting to a PostgreSQL database:
Step 6: Set SSL to "require" in DBeaver
After you fill in the Host, Port, Database, Username, and Password on the main connection screen,
look for a list of tabs on the left side of the connection window.
These tabs are usually: Main, Driver Properties, SSL, etc.
Click on the tab labeled “SSL” (sometimes you may need to scroll or expand the window to see it).
In the SSL tab:
Check the box that says “Use SSL” (or sometimes just “Enable SSL”).
For SSL Mode, select require from the dropdown menu.
You do not need to fill in any certificate/key fields for Render.
Just setting SSL to "require" is enough.
Click “Test Connection” at the bottom to make sure it works.
If you don’t see the SSL tab:
Make sure you selected PostgreSQL as the database type.
If the window is small, try maximizing it or scrolling the tabs on the left.
In some DBeaver versions, the SSL options may be under the Driver Properties tab:
Search for a property called ssl and set it to true.
Search for a property called sslmode and set it to require.
Visual Guide
!DBeaver SSL Tab Example
The important part is to check "Use SSL" and set "SSL Mode" to "require".
If you still can’t find it, let me know your DBeaver version and I’ll give you a screenshot or more specific instructions!
package-lock.json
there is connection error while test connection , so ensure that activities and how to process that

If you’re getting a connection error when testing your connection in DBeaver, here’s a checklist and troubleshooting guide to help you connect to your Render PostgreSQL database:
1. Double-Check Your Connection Details
Host: Should match the “External Connection” host from Render (e.g., dpg-xxxxxx).
Port: Usually 5432 (unless Render says otherwise).
Database: The database name from Render.
Username: The username from Render.
Password: The password from Render (be careful of extra spaces when copying).
SSL: Must be enabled and set to require.
2. SSL Settings in DBeaver
Go to the SSL tab in the connection window.
Check “Use SSL”.
Set SSL Mode to require.
Leave all certificate/key fields blank.
3. Common Issues and Fixes
A. Typo in Credentials
Double-check for typos or extra spaces in host, username, password, or database name.
B. Network Issues
Make sure your internet connection is working.
Some networks (corporate, school, public WiFi) may block database ports. Try from a different network if possible.
C. Render Database Not Ready
Make sure your Render PostgreSQL instance status is “Live” and not “Provisioning” or “Failed”.
D. Render Free Tier Limits
If you’ve created and deleted many databases, you may have hit a Render free tier limit. Check your Render dashboard for warnings.
E. DBeaver Version
Make sure you’re using a recent version of DBeaver (old versions may have SSL bugs).
4. How to See the Exact Error
When you click Test Connection, DBeaver will show a popup with the error message.
Copy the exact error message and paste it here.
I can give you a precise fix based on the error.
5. Example: Correct Settings
Field	Value (example)
Host	dpg-xxxxxxx.rendb.io
Port	5432
Database	docky_db
Username	docky_user
Password	(your password)
SSL	Use SSL: checked
SSL Mode	require
6. If You Still Get an Error
Please copy and paste the full error message you see in DBeaver’s popup.
Let me know which step you’re on and what you see.
Once you’re connected, you’ll be able to run the SQL to create your tables!
Let me know the error and I’ll help you fix it right away.
package-lock.json
but their is an internal host only, what i can do

Great question! Here’s how Render’s database connection works:
Render PostgreSQL: Internal vs. External Connection
Internal Connection String:
Used by services running on Render (your backend server).
Not accessible from your local computer (for security).
External Connection String:
Used to connect from your local computer (e.g., DBeaver, psql, etc.).
This is what you need for DBeaver!
What If You Only See an Internal Host?
If you only see an "Internal Connection" string on your Render database dashboard, it usually means:
The database is still provisioning (wait a few minutes and refresh).
You’re on a paid plan that restricts external access (rare).
There’s a temporary Render UI issue.
What To Do
1. Wait a Few Minutes and Refresh
Sometimes, the "External Connection" string appears after the database is fully provisioned.
2. Check the Render Dashboard
Go to your database’s page on Render.
Look for a section labeled "Connections".
You should see both Internal and External connection strings.
3. If You Still Don’t See It
Make sure you’re using a PostgreSQL database, not MySQL or another type.
If you’re on a free plan, you should have external access.
If you’re on a team or paid plan, check if external access is disabled in your database settings.
4. Contact Render Support
If you still don’t see an external connection string after 10–15 minutes, contact Render Support or check their status page.
What the External Connection String Looks Like
It should look like this:
text
Apply to index.js
￼
postgres://username:password@host:port/dbname
host will be something like dpg-xxxxxxx.rendb.io
port is usually 5432
Summary
You need the External Connection string for DBeaver.
If you only see "Internal", wait a bit and refresh.
If it never appears, contact Render support.
If you get the external string, let me know and I’ll walk you through the next steps!
If you’re stuck, tell me exactly what you see on the Render dashboard and I’ll help you further.
package-lock.json
which code we can copy this internal or external url ot not, i mean there is an internal host name, their is no external host name, so what we can do

Great question! Here’s the key point:
You can only use the "Internal Connection" string/host from services running on Render itself (like your backend server).
You cannot use the "Internal Connection" string from your own computer (DBeaver, psql, etc.).
What to Do If You Only See "Internal Hostname" on Render
1. For DBeaver (Your Local Computer):
You need the External Connection string/host.
If you do not see an "External Connection" string or host, you will NOT be able to connect from your local computer or DBeaver.
This is a limitation of your current Render database setup (sometimes on certain paid plans, or if external access is disabled).
2. For Your Backend on Render:
Use the Internal Connection string/host in your backend’s DATABASE_URL environment variable.
This will work perfectly for your deployed backend.
What Are Your Options?
A. Wait and Refresh
Sometimes, the "External Connection" string appears after a few minutes when the database is fully provisioned.
B. Check Database Settings
Go to your Render database dashboard.
Look for any settings about "Allow external connections" or "Public access".
If you see an option to enable external access
CREATE TABLE users (  id SERIAL PRIMARY KEY,  username VARCHAR(255) NOT NULL UNIQUE,  email VARCHAR(255) NOT NULL,  password VARCHAR(255) NOT NULL,  role VARCHAR(50) NOT NULL,  UNIQUE (email, role));CREATE TABLE submissions (  id SERIAL PRIMARY KEY,  name VARCHAR(255) NOT NULL,  email VARCHAR(255),  filename VARCHAR(255) NOT NULL,  originalname VARCHAR(255) NOT NULL,  time TIMESTAMPTZ NOT NULL);CREATE TABLE deadlines (  id SERIAL PRIMARY KEY,  deadline TIMESTAMPTZ NOT NULL);
Refresh the tables list to confirm users, submissions, and deadlines exist.
Step 3: Deploy Your Backend (Node.js/Express) as a Web Service
Go to Render Dashboard.
Click New + → Web Service.
Connect your GitHub repo.
Fill in:
Name: e.g., docky-server
Root Directory: server
Build Command: npm install
Start Command: npm start
Region: (same as your database)
Under Environment Variables, add:
DATABASE_URL = (Render’s Internal Connection String)
JWT_SECRET = (your secret, e.g., aP7B!v9z$E&H)MbQeThWmZq4t7w!z%C*)
Click Create Web Service.
Wait for the build and deploy to finish.
Note the URL Render gives you (e.g., https://docky-server.onrender.com).
Step 4: Deploy Your Frontend (React) as a Static Site
Go to Render Dashboard.
Click New + → Static Site.
Connect your GitHub repo.
Fill in:
Name: e.g., docky-client
Root Directory: client
Build Command: npm install && npm run build
Publish Directory: build
Under Environment Variables, add:
REACT_APP_API_URL = (the URL of your backend, e.g., https://docky-server.onrender.com)
Click Create Static Site.
Wait for the build and deploy to finish.
Note the URL Render gives you for your frontend.
Step 5: Test Your App
Open your frontend URL in a browser.
Try signing up, logging in, uploading files, etc.
Everything should work, with the backend and database both on Render.
Summary Table
Part	Render Service Type	Directory	Build Command	Publish/Start Command	Important Env Vars
Database	PostgreSQL	—	—	—	—
Backend	Web Service	server	npm install	npm start	DATABASE_URL, JWT_SECRET
Frontend	Static Site	client	npm install && npm run build	—	REACT_APP_API_URL
If you need screenshots or run into any errors at any step, just let me know which step and I’ll help you immediately!
package-lock.json
install  and setup the dbeaver in cmd, complete that give me sql and i create a table for it

￼
sudo snap install dbeaver-ce
Output
￼
Auto-run
Move to background
DBeaver Community Edition has been successfully installed on your system!
Next Steps
Open DBeaver:
You can launch it from your application menu or by running this command in your terminal:
text
Apply to index.js
￼
   dbeaver-ce
Connect to your Render PostgreSQL database using the "External Connection" details from your Render dashboard (host, port, database, username, password, SSL required).
Create your tables:
Here is the SQL you need to paste and run in DBeaver’s SQL editor:
sql
Apply to index.js
￼
CREATE TABLE users (  id SERIAL PRIMARY KEY,  username VARCHAR(255) NOT NULL UNIQUE,  email VARCHAR(255) NOT NULL,  password VARCHAR(255) NOT NULL,  role VARCHAR(50) NOT NULL,  UNIQUE (email, role));CREATE TABLE submissions (  id SERIAL PRIMARY KEY,  name VARCHAR(255) NOT NULL,  email VARCHAR(255),  filename VARCHAR(255) NOT NULL,  originalname VARCHAR(255) NOT NULL,  time TIMESTAMPTZ NOT NULL);CREATE TABLE deadlines (  id SERIAL PRIMARY KEY,  deadline TIMESTAMPTZ NOT NULL);
If you need step-by-step help connecting DBeaver to your Render database or running the SQL, just let me know!
package-lock.json
Step 2: Set Up Your Tables Using DBeaver
Open DBeaver on your computer.
Click the plug icon with a plus (New Database Connection).
Search for and select PostgreSQL.
Click Next.
Fill in the connection details from Render’s External Connection:
Host: (from Render, e.g., dpg-xxxxxx)
Port: (from Render, usually 5432)
Database: (from Render)
Username: (from Render)
Password: (from Render)
Click the SSL tab and set Use SSL to require.
Click Test Connection. If successful, click Finish.

explian step 6, i can't find in the bdeaver app

Absolutely! Here’s how to set SSL to "require" in DBeaver when connecting to a PostgreSQL database:
Step 6: Set SSL to "require" in DBeaver
After you fill in the Host, Port, Database, Username, and Password on the main connection screen,
look for a list of tabs on the left side of the connection window.

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
