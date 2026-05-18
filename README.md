# College ERP / Student Portal

This repository contains a complete full-stack College ERP website for the CSE Department.

## Folder structure

college-erp/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   ├── .env.example
│   ├── routes/
│   │   └── api.js
│   ├── uploads/
│   │   └── .gitkeep
│   └── public/
│       ├── index.html
│       ├── hod.html
│       ├── teacher.html
│       ├── student.html
│       ├── style.css
│       └── script.js
└── database.sql

## Features

- Student search by registration number
- HOD dashboard analytics and teacher management
- Teacher Excel uploads for marks, attendance, and syllabus
- Notice publishing for students/teachers/HOD
- Responsive Bootstrap frontend
- Node.js + Express backend
- MySQL database support
- XLSX Excel parsing with Multer
- API endpoints for student data and dashboard analytics

## Setup Instructions

### 1. Install backend packages

Open a terminal inside `college-erp/backend` and run:

```bash
npm install
```

### 2. Create the MySQL database

If you have MySQL installed, run the SQL script:

```bash
mysql -u root -p < ../database.sql
```

If using XAMPP, use phpMyAdmin to import `college-erp/database.sql`.

### 3. Configure environment variables

Copy `.env.example` to `.env` and update values if required:

```bash
cp .env.example .env
```

### 4. Start the server

```bash
npm start
```

By default the app runs on `http://localhost:5000`.

### 5. Open the portal

- Landing page: `http://localhost:5000/`
- Student portal: `http://localhost:5000/student`
- Teacher panel: `http://localhost:5000/teacher`
- HOD dashboard: `http://localhost:5000/hod`

## Default credentials

- HOD: `hod@collegeerp.local` / `hodpassword`
- Teacher: `priya@collegeerp.local` / `teacherpassword`

## Database setup details

The SQL file creates the following tables:

- `students`
- `teachers`
- `marks`
- `attendance`
- `syllabus`
- `notices`
- `users`

## Deployment guide

### Deploy to Railway

1. Create a Railway project.
2. Link the GitHub repo.
3. Add environment variables:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_DATABASE`
   - `PORT`
4. Deploy and connect the Railway MySQL database.

### Deploy to Render

1. Create a new Web Service.
2. Set root directory to `college-erp/backend`.
3. Add `PORT` environment variable.
4. Use a managed MySQL database and add the database credentials.

### Deploy to Vercel

Vercel supports static frontends well, but the Node backend should be deployed separately on Railway/Render. Use Vercel to host only `backend/public` if desired.

## GitHub upload commands

```bash
git init
git add .
git commit -m "Add college ERP full-stack portal"
git branch -M main
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```

## XAMPP setup

1. Start Apache and MySQL in XAMPP.
2. Open phpMyAdmin at `http://localhost/phpmyadmin`.
3. Create database `college_erp`.
4. Import `database.sql`.
5. Update `.env` with XAMPP MySQL credentials.
6. Run `npm start` in `college-erp/backend`.

## Notes

- The backend serves static HTML pages and exposes REST APIs under `/api`.
- Uploads are handled by Multer and stored in memory for XLSX parsing.
- The SQL seed file includes sample students, teachers, syllabus progress, attendance, marks, and notices.
- The frontend includes responsive Bootstrap layouts and charts for analytics.
