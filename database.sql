-- SQL schema for College ERP
DROP DATABASE IF EXISTS college_erp;
CREATE DATABASE college_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE college_erp;

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reg_no VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL DEFAULT '',
  semester VARCHAR(50) NOT NULL DEFAULT '1',
  branch VARCHAR(100) NOT NULL DEFAULT 'CSE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_name VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reg_no VARCHAR(50) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  internal_marks INT NOT NULL DEFAULT 0,
  external_marks INT NOT NULL DEFAULT 0,
  total_marks INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_student_subject (reg_no, subject),
  CONSTRAINT fk_marks_student FOREIGN KEY (reg_no) REFERENCES students(reg_no) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reg_no VARCHAR(50) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  attendance_percentage INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_attendance_student_subject (reg_no, subject),
  CONSTRAINT fk_attendance_student FOREIGN KEY (reg_no) REFERENCES students(reg_no) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE syllabus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject VARCHAR(100) NOT NULL UNIQUE,
  teacher_name VARCHAR(255) NOT NULL,
  total_units INT NOT NULL DEFAULT 0,
  completed_units INT NOT NULL DEFAULT 0,
  completed_percentage INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  target_role ENUM('all', 'student', 'teacher', 'hod') NOT NULL DEFAULT 'all',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  password_salt VARCHAR(100) NOT NULL,
  role ENUM('hod', 'teacher') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO students (reg_no, name, semester, branch) VALUES
('CSE2023001', 'Aarav Jain', '5', 'CSE'),
('CSE2023002', 'Sanya Patel', '5', 'CSE'),
('CSE2023003', 'Nisha Sharma', '5', 'CSE');

INSERT INTO teachers (teacher_name, subject, email) VALUES
('Priya Sharma', 'Data Structures', 'priya@collegeerp.local'),
('Rohan Verma', 'Operating Systems', 'rohan@collegeerp.local');

INSERT INTO marks (reg_no, subject, internal_marks, external_marks, total_marks) VALUES
('CSE2023001', 'Data Structures', 34, 48, 82),
('CSE2023001', 'Operating Systems', 30, 46, 76),
('CSE2023002', 'Data Structures', 31, 45, 76),
('CSE2023002', 'Operating Systems', 29, 44, 73);

INSERT INTO attendance (reg_no, subject, attendance_percentage) VALUES
('CSE2023001', 'Data Structures', 92),
('CSE2023001', 'Operating Systems', 88),
('CSE2023002', 'Data Structures', 95),
('CSE2023002', 'Operating Systems', 90);

INSERT INTO syllabus (subject, teacher_name, total_units, completed_units, completed_percentage) VALUES
('Data Structures', 'Priya Sharma', 12, 9, 75),
('Operating Systems', 'Rohan Verma', 10, 8, 80);

INSERT INTO notices (title, description, date, target_role) VALUES
('Midterm exam schedule released', 'The midterm exam schedule is available for all CSE students. Check the department notice board for details.', '2026-05-10', 'all'),
('Project demo instructions', 'Project demo will be held in the lab block next week. Students must bring a printed report and presentation slides.', '2026-05-12', 'student');

INSERT INTO users (name, email, password_hash, password_salt, role) VALUES
('HOD CSE', 'hod@collegeerp.local', '281e14cb339fa171f2d8f01e49a6bcded58095e360d5b7cfd7d1ecccce5b1651aa0a1545c3a37cd8a1b144395e5fb38070347fbdf97a6ec9b62a8d553eed4306', 'hod-salt-2026', 'hod'),
('Priya Sharma', 'priya@collegeerp.local', 'a7469e09a4fb1cace1c244f74e219e6b3008d8d0a26f3a1021d922a944afbf1dc5256f8d7823c7a14c0791ec0fae10c6a44384619653d9d4099c5732f2d60625', 'teacher-salt-2026', 'teacher');
