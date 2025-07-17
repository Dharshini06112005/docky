# Docky: Document Submission System

Docky is a simple, full-stack web app for document submission and management. Built with Node.js/Express (backend) and React (frontend), it features:

- User Dashboard: Enter name, upload PDF/Word, preview, submit
- Admin Dashboard: View all submissions (name, download link, timestamp), search/filter
- Local file storage for uploads
- Email confirmation (optional, demo credentials)

## Quick Start

### Backend
```
cd server
npm install
npm start
```

### Frontend
```
cd client
npm install
npm run dev
```

- Backend runs on port 5000 by default
- Frontend runs on port 5173 by default

## Deployment
- Suitable for Render (backend) and Vercel (frontend)

---

**Note:** For email confirmation, configure real SMTP credentials in `server/index.js`.
