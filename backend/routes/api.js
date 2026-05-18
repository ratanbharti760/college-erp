const express = require('express')
const multer = require('multer')
const xlsx = require('xlsx')
const crypto = require('crypto')
const db = require('../db')

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
})

const hashPassword = (password, salt) =>
  crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex')

const parseNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeKey = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const buildUploadRows = (rows, columns) => {
  const normalizedColumns = columns.map((field) => normalizeKey(field))
  return rows
    .map((row) => {
      const normalizedRow = {}
      const rowMap = {}
      Object.keys(row).forEach((key) => {
        rowMap[normalizeKey(key)] = row[key]
      })

      columns.forEach((field, index) => {
        const baseKey = normalizedColumns[index]
        normalizedRow[field] = String(rowMap[baseKey] ?? rowMap[baseKey.replace(/_/g, '')] ?? '').trim()
      })

      return normalizedRow
    })
    .filter((row) => Object.values(row).some((value) => value !== ''))
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const [rows] = await db.query(
      'SELECT id, name, email, password_hash, password_salt, role FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    )

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    const user = rows[0]
    const candidateHash = hashPassword(password, user.password_salt)
    if (candidateHash !== user.password_hash) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    return res.json({ role: user.role, name: user.name })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Login failed.', error: String(error) })
  }
})

router.post('/upload-marks', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Marks Excel file is required.' })
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' })

    const cleanRows = buildUploadRows(rows, ['reg_no', 'subject', 'internal_marks', 'external_marks'])
    if (!cleanRows.length) {
      return res.status(400).json({ message: 'No valid mark rows found.' })
    }

    const values = cleanRows.map((row) => {
      const total = parseNumber(row.internal_marks) + parseNumber(row.external_marks)
      return [row.reg_no, row.subject, parseNumber(row.internal_marks), parseNumber(row.external_marks), total]
    })

    await db.query(
      'INSERT INTO marks (reg_no, subject, internal_marks, external_marks, total_marks) VALUES ? ON DUPLICATE KEY UPDATE internal_marks = VALUES(internal_marks), external_marks = VALUES(external_marks), total_marks = VALUES(total_marks)',
      [values]
    )

    return res.json({ message: 'Marks uploaded successfully.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Marks upload failed.', error: String(error) })
  }
})

router.post('/upload-attendance', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Attendance Excel file is required.' })
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' })

    const cleanRows = buildUploadRows(rows, ['reg_no', 'subject', 'attendance_percentage'])
    if (!cleanRows.length) {
      return res.status(400).json({ message: 'No valid attendance rows found.' })
    }

    const values = cleanRows.map((row) => [row.reg_no, row.subject, parseNumber(row.attendance_percentage)])

    await db.query(
      'INSERT INTO attendance (reg_no, subject, attendance_percentage) VALUES ? ON DUPLICATE KEY UPDATE attendance_percentage = VALUES(attendance_percentage)',
      [values]
    )

    return res.json({ message: 'Attendance uploaded successfully.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Attendance upload failed.', error: String(error) })
  }
})

router.post('/upload-syllabus', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Syllabus Excel file is required.' })
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' })

    const cleanRows = buildUploadRows(rows, ['subject', 'teacher_name', 'total_units', 'completed_units'])
    if (!cleanRows.length) {
      return res.status(400).json({ message: 'No valid syllabus rows found.' })
    }

    const values = cleanRows.map((row) => {
      const totalUnits = parseNumber(row.total_units)
      const completedUnits = parseNumber(row.completed_units)
      const percent = totalUnits > 0 ? Math.min(100, Math.round((completedUnits / totalUnits) * 100)) : 0
      return [row.subject, row.teacher_name, totalUnits, completedUnits, percent]
    })

    await db.query(
      'INSERT INTO syllabus (subject, teacher_name, total_units, completed_units, completed_percentage) VALUES ? ON DUPLICATE KEY UPDATE teacher_name = VALUES(teacher_name), total_units = VALUES(total_units), completed_units = VALUES(completed_units), completed_percentage = VALUES(completed_percentage)',
      [values]
    )

    return res.json({ message: 'Syllabus uploaded successfully.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Syllabus upload failed.', error: String(error) })
  }
})

router.post('/upload-notice', async (req, res) => {
  try {
    const { title, description, target_role = 'all' } = req.body
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' })
    }

    const date = new Date().toISOString().slice(0, 10)
    await db.query('INSERT INTO notices (title, description, date, target_role) VALUES (?, ?, ?, ?)', [
      title.trim(),
      description.trim(),
      date,
      target_role,
    ])

    return res.json({ message: 'Notice uploaded successfully.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Notice upload failed.', error: String(error) })
  }
})

router.get('/student/:reg_no', async (req, res) => {
  try {
    const { reg_no } = req.params
    const [studentRows] = await db.query('SELECT id, reg_no, name, semester, branch FROM students WHERE reg_no = ?', [reg_no])
    if (!studentRows.length) {
      return res.status(404).json({ message: 'Student not found.' })
    }

    const student = studentRows[0]
    const [marks] = await db.query(
      'SELECT m.subject, m.internal_marks, m.external_marks, m.total_marks, COALESCE(t.teacher_name, "N/A") AS teacher_name FROM marks m LEFT JOIN teachers t ON m.subject = t.subject WHERE m.reg_no = ?',
      [reg_no]
    )
    const [attendance] = await db.query(
      'SELECT a.subject, a.attendance_percentage, COALESCE(t.teacher_name, "N/A") AS teacher_name FROM attendance a LEFT JOIN teachers t ON a.subject = t.subject WHERE a.reg_no = ?',
      [reg_no]
    )
    const [syllabus] = await db.query('SELECT subject, teacher_name, total_units, completed_units, completed_percentage FROM syllabus ORDER BY subject')
    const [notices] = await db.query('SELECT id, title, description, date, target_role FROM notices ORDER BY date DESC LIMIT 10')

    return res.json({ student, marks, attendance, syllabus, notices })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to load student data.', error: String(error) })
  }
})

router.get('/notices', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, title, description, date, target_role FROM notices ORDER BY date DESC LIMIT 20')
    return res.json(rows)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to fetch notices.', error: String(error) })
  }
})

router.get('/dashboard-analytics', async (req, res) => {
  try {
    const [[{ total_students }]] = await db.query('SELECT COUNT(*) AS total_students FROM students')
    const [[{ total_teachers }]] = await db.query('SELECT COUNT(*) AS total_teachers FROM teachers')
    const [[{ avg_attendance }]] = await db.query('SELECT ROUND(AVG(attendance_percentage), 2) AS avg_attendance FROM attendance')
    const [subjectProgress] = await db.query(
      'SELECT subject, teacher_name, total_units, completed_units, completed_percentage FROM syllabus ORDER BY completed_percentage DESC'
    )
    const [topSubjects] = await db.query(
      'SELECT subject, AVG(total_marks) AS average_total FROM marks GROUP BY subject ORDER BY average_total DESC LIMIT 5'
    )
    const [[{ total_notices }]] = await db.query('SELECT COUNT(*) AS total_notices FROM notices')
    const [teacherList] = await db.query('SELECT id, teacher_name, subject, email FROM teachers ORDER BY teacher_name')

    return res.json({
      total_students,
      total_teachers,
      avg_attendance: Number(avg_attendance) || 0,
      total_notices,
      subjectProgress,
      topSubjects,
      teachers: teacherList,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to load dashboard analytics.', error: String(error) })
  }
})

router.get('/teachers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, teacher_name, subject, email FROM teachers ORDER BY teacher_name')
    return res.json(rows)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to fetch teachers.', error: String(error) })
  }
})

router.post('/teachers', async (req, res) => {
  try {
    const { teacher_name, subject, email, password } = req.body
    if (!teacher_name || !subject) {
      return res.status(400).json({ message: 'Teacher name and subject are required.' })
    }

    const [result] = await db.query('INSERT INTO teachers (teacher_name, subject, email) VALUES (?, ?, ?)', [
      teacher_name.trim(),
      subject.trim(),
      email ? email.trim().toLowerCase() : null,
    ])

    if (email && password) {
      const salt = crypto.randomBytes(16).toString('hex')
      const password_hash = hashPassword(password, salt)
      await db.query(
        'INSERT INTO users (name, email, password_hash, password_salt, role) VALUES (?, ?, ?, ?, ?)',
        [teacher_name.trim(), email.trim().toLowerCase(), password_hash, salt, 'teacher']
      )
    }

    return res.json({ message: 'Teacher created successfully.', teacherId: result.insertId })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to create teacher.', error: String(error) })
  }
})

router.put('/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { teacher_name, subject, email } = req.body
    await db.query('UPDATE teachers SET teacher_name = ?, subject = ?, email = ? WHERE id = ?', [
      teacher_name.trim(),
      subject.trim(),
      email ? email.trim().toLowerCase() : null,
      id,
    ])
    return res.json({ message: 'Teacher information updated.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to update teacher.', error: String(error) })
  }
})

router.delete('/teachers/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.query('DELETE FROM teachers WHERE id = ?', [id])
    return res.json({ message: 'Teacher removed successfully.' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to delete teacher.', error: String(error) })
  }
})
router.get('/test', (req, res) => {
  res.json({ message: 'API Working' })
})
module.exports = router
