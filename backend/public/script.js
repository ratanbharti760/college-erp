const apiBase = '/api'

function setTheme(theme) {
  document.documentElement.dataset.theme = theme
  const toggle = document.getElementById('themeToggle')
  if (toggle) {
    toggle.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode'
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem('erp-theme') || 'light'
  setTheme(savedTheme)
}

function initThemeToggle() {
  const toggle = document.getElementById('themeToggle')
  if (!toggle) return
  toggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('erp-theme', nextTheme)
  })
}

function showMessage(element, text, success = false) {
  if (!element) return
  element.textContent = text
  element.classList.remove('d-none', 'text-danger', 'text-success')
  element.classList.add(success ? 'text-success' : 'text-danger')
}

function clearMessage(element) {
  if (!element) return
  element.textContent = ''
  element.classList.add('d-none')
}

function buildProgressBar(value) {
  return `<div class="progress" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${value}%"></div></div>`
}

async function fetchJson(url, options) {
  const response = await fetch(url, options)
  const data = await response.json()
  if (!response.ok) {
    const message = data.message || 'Server error'
    throw new Error(message)
  }
  return data
}

function initStudentPage() {
  const regNoInput = document.getElementById('regNoInput')
  const searchButton = document.getElementById('studentSearchButton')
  const studentStatus = document.getElementById('studentStatus')
  const studentResult = document.getElementById('studentResult')

  const studentName = document.getElementById('studentName')
  const studentReg = document.getElementById('studentReg')
  const studentSemester = document.getElementById('studentSemester')
  const studentBranch = document.getElementById('studentBranch')
  const marksTableBody = document.getElementById('marksTableBody')
  const attendanceGrid = document.getElementById('attendanceGrid')
  const syllabusProgress = document.getElementById('syllabusProgress')
  const noticeList = document.getElementById('noticeList')

  const renderResult = (payload) => {
    const { student, marks, attendance, syllabus, notices } = payload
    studentResult.classList.remove('d-none')
    studentName.textContent = student.name
    studentReg.textContent = student.reg_no
    studentSemester.textContent = student.semester
    studentBranch.textContent = student.branch

    marksTableBody.innerHTML = marks.length
      ? marks
          .map(
            (row) => `<tr><td>${row.subject}</td><td>${row.internal_marks}</td><td>${row.external_marks}</td><td>${row.total_marks}</td><td>${row.teacher_name}</td></tr>`
          )
          .join('')
      : '<tr><td colspan="5" class="text-center py-3">No marks available.</td></tr>'

    attendanceGrid.innerHTML = attendance.length
      ? attendance
          .map(
            (row) => `<div class="col-md-6"><div class="p-3 rounded-4 bg-white shadow-sm"><h6>${row.subject}</h6><p class="mb-2 text-muted">Teacher: ${row.teacher_name}</p>${buildProgressBar(row.attendance_percentage)}<div class="mt-2 text-muted">${row.attendance_percentage}% attendance</div></div></div>`
          )
          .join('')
      : '<div class="col-12"><p class="text-muted">Attendance data is not available.</p></div>'

    syllabusProgress.innerHTML = syllabus.length
      ? syllabus
          .map(
            (row) => `<div class="col-md-6"><div class="p-3 rounded-4 bg-white shadow-sm"><h6>${row.subject}</h6><p class="mb-2 text-muted">Teacher: ${row.teacher_name}</p>${buildProgressBar(row.completed_percentage)}<div class="mt-2 text-muted">${row.completed_percentage}% syllabus complete</div></div></div>`
          )
          .join('')
      : '<div class="col-12"><p class="text-muted">Syllabus progress is not available.</p></div>'

    noticeList.innerHTML = notices.length
      ? notices
          .map(
            (notice) => `<div class="list-group-item rounded-4 mb-2"><div class="d-flex justify-content-between"><strong>${notice.title}</strong><span class="text-muted">${notice.date}</span></div><p class="mb-1 mt-2">${notice.description}</p></div>`
          )
          .join('')
      : '<div class="list-group-item rounded-4">No notices to display.</div>'
  }

  const search = async () => {
    const regNo = regNoInput.value.trim()
    studentResult.classList.add('d-none')
    if (!regNo) {
      showMessage(studentStatus, 'Enter registration number to search.', false)
      return
    }
    try {
      clearMessage(studentStatus)
      const data = await fetchJson(`${apiBase}/student/${encodeURIComponent(regNo)}`)
      renderResult(data)
    } catch (error) {
      showMessage(studentStatus, error.message || 'Student not found.', false)
    }
  }

  searchButton.addEventListener('click', search)
  regNoInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') search()
  })
}

function initTeacherPage() {
  const loginEmail = document.getElementById('teacherEmail')
  const loginPassword = document.getElementById('teacherPassword')
  const loginButton = document.getElementById('teacherLoginButton')
  const loginStatus = document.getElementById('teacherLoginStatus')
  const panel = document.getElementById('teacherPanel')
  const welcome = document.getElementById('teacherWelcome')
  const marksFile = document.getElementById('marksFile')
  const attendanceFile = document.getElementById('attendanceFile')
  const syllabusFile = document.getElementById('syllabusFile')
  const marksUploadButton = document.getElementById('marksUploadButton')
  const attendanceUploadButton = document.getElementById('attendanceUploadButton')
  const syllabusUploadButton = document.getElementById('syllabusUploadButton')
  const noticeTitle = document.getElementById('noticeTitle')
  const noticeDescription = document.getElementById('noticeDescription')
  const noticeUploadButton = document.getElementById('noticeUploadButton')
  const teacherUploadStatus = document.getElementById('teacherUploadStatus')
  const storageKey = 'erp-teacher-session'

  const updatePanel = (user) => {
    panel.classList.remove('d-none')
    welcome.textContent = `Logged in as ${user.name}. You can now upload Excel files and notices.`
  }

  const clearStatus = () => {
    teacherUploadStatus.textContent = ''
    teacherUploadStatus.className = 'mt-4'
  }

  const showTeacherStatus = (message, success = false) => {
    teacherUploadStatus.className = success ? 'mt-4 text-success' : 'mt-4 text-danger'
    teacherUploadStatus.textContent = message
  }

  const trySession = () => {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    try {
      const user = JSON.parse(raw)
      if (user?.role === 'teacher') updatePanel(user)
    } catch (error) {
      localStorage.removeItem(storageKey)
    }
  }

  const login = async () => {
    const email = loginEmail.value.trim()
    const password = loginPassword.value.trim()
    if (!email || !password) {
      showMessage(loginStatus, 'Email and password are required.', false)
      return
    }
    try {
      clearMessage(loginStatus)
      const result = await fetchJson(`${apiBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (result.role !== 'teacher') {
        showMessage(loginStatus, 'Only teacher accounts may login here.', false)
        return
      }
      localStorage.setItem(storageKey, JSON.stringify(result))
      updatePanel(result)
      showTeacherStatus('Login successful. Ready for uploads.', true)
    } catch (error) {
      showMessage(loginStatus, error.message, false)
    }
  }

  const uploadFile = async (input, endpoint, successText) => {
    clearStatus()
    if (!input.files.length) {
      showTeacherStatus('Select a valid Excel file first.')
      return
    }
    const formData = new FormData()
    formData.append('file', input.files[0])
    try {
      const result = await fetchJson(`${apiBase}/${endpoint}`, {
        method: 'POST',
        body: formData,
      })
      showTeacherStatus(`${successText} ${result.message}`, true)
      input.value = ''
    } catch (error) {
      showTeacherStatus(error.message, false)
    }
  }

  const uploadNotice = async () => {
    clearStatus()
    const title = noticeTitle.value.trim()
    const description = noticeDescription.value.trim()
    if (!title || !description) {
      showTeacherStatus('Notice title and description are required.')
      return
    }
    try {
      const result = await fetchJson(`${apiBase}/upload-notice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, target_role: 'teacher' }),
      })
      showTeacherStatus(result.message, true)
      noticeTitle.value = ''
      noticeDescription.value = ''
    } catch (error) {
      showTeacherStatus(error.message, false)
    }
  }

  loginButton.addEventListener('click', login)
  marksUploadButton.addEventListener('click', () => uploadFile(marksFile, 'upload-marks', 'Marks uploaded successfully.'))
  attendanceUploadButton.addEventListener('click', () => uploadFile(attendanceFile, 'upload-attendance', 'Attendance uploaded successfully.'))
  syllabusUploadButton.addEventListener('click', () => uploadFile(syllabusFile, 'upload-syllabus', 'Syllabus uploaded successfully.'))
  noticeUploadButton.addEventListener('click', uploadNotice)

  trySession()
}

function initHodPage() {
  const loginEmail = document.getElementById('hodEmail')
  const loginPassword = document.getElementById('hodPassword')
  const loginButton = document.getElementById('hodLoginButton')
  const loginStatus = document.getElementById('hodLoginStatus')
  const panel = document.getElementById('hodPanel')
  const welcome = document.getElementById('hodWelcome')
  const analyticsCards = document.getElementById('analyticsCards')
  const teacherTableBody = document.getElementById('teacherTableBody')
  const addTeacherButton = document.getElementById('addTeacherButton')
  const teacherNameInput = document.getElementById('teacherName')
  const teacherSubjectInput = document.getElementById('teacherSubject')
  const teacherEmailInput = document.getElementById('teacherEmail')
  const teacherPasswordInput = document.getElementById('teacherPassword')
  const hodNoticeTitle = document.getElementById('hodNoticeTitle')
  const hodNoticeDescription = document.getElementById('hodNoticeDescription')
  const hodNoticeTarget = document.getElementById('hodNoticeTarget')
  const hodNoticeButton = document.getElementById('hodNoticeButton')
  const hodPanelStatus = document.getElementById('hodPanelStatus')
  const subjectChartCanvas = document.getElementById('subjectChart')
  const topSubjectChartCanvas = document.getElementById('topSubjectChart')
  const storageKey = 'erp-hod-session'
  let editingTeacherId = null
  let subjectChart = null
  let topSubjectChart = null

  const updatePanel = (user) => {
    panel.classList.remove('d-none')
    welcome.textContent = `Welcome back, ${user.name}. Use the dashboard to manage the department.`
    loadDashboard()
  }

  const clearStatus = () => {
    hodPanelStatus.textContent = ''
    hodPanelStatus.className = 'mt-4'
  }

  const showStatus = (message, success = false) => {
    hodPanelStatus.textContent = message
    hodPanelStatus.className = success ? 'mt-4 text-success' : 'mt-4 text-danger'
  }

  const trySession = () => {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    try {
      const user = JSON.parse(raw)
      if (user?.role === 'hod') updatePanel(user)
    } catch (error) {
      localStorage.removeItem(storageKey)
    }
  }

  const login = async () => {
    const email = loginEmail.value.trim()
    const password = loginPassword.value.trim()
    if (!email || !password) {
      showMessage(loginStatus, 'Email and password are required.', false)
      return
    }
    try {
      clearMessage(loginStatus)
      const result = await fetchJson(`${apiBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (result.role !== 'hod') {
        showMessage(loginStatus, 'Only HOD accounts may login here.', false)
        return
      }
      localStorage.setItem(storageKey, JSON.stringify(result))
      updatePanel(result)
      showStatus('Login successful. Dashboard loaded.', true)
    } catch (error) {
      showMessage(loginStatus, error.message, false)
    }
  }

  const loadDashboard = async () => {
    try {
      clearStatus()
      const data = await fetchJson(`${apiBase}/dashboard-analytics`)
      renderAnalytics(data)
      renderTeacherTable(data.teachers)
    } catch (error) {
      showStatus(error.message, false)
    }
  }

  const renderAnalytics = (data) => {
    analyticsCards.innerHTML = `
      <div class="col-md-3">
        <div class="card shadow-sm rounded-4 p-4 bg-white">
          <h6>Total Students</h6>
          <p class="display-6 fw-bold">${data.total_students}</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card shadow-sm rounded-4 p-4 bg-white">
          <h6>Total Teachers</h6>
          <p class="display-6 fw-bold">${data.total_teachers}</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card shadow-sm rounded-4 p-4 bg-white">
          <h6>Average Attendance</h6>
          <p class="display-6 fw-bold">${data.avg_attendance}%</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card shadow-sm rounded-4 p-4 bg-white">
          <h6>Published Notices</h6>
          <p class="display-6 fw-bold">${data.total_notices}</p>
        </div>
      </div>
    `

    const subjectLabels = data.subjectProgress.map((row) => row.subject)
    const subjectValues = data.subjectProgress.map((row) => row.completed_percentage)
    const topLabels = data.topSubjects.map((row) => row.subject)
    const topValues = data.topSubjects.map((row) => Number(row.average_total.toFixed(1)))

    if (subjectChart) subjectChart.destroy()
    subjectChart = new Chart(subjectChartCanvas, {
      type: 'bar',
      data: {
        labels: subjectLabels,
        datasets: [
          {
            label: 'Syllabus Completion %',
            data: subjectValues,
            backgroundColor: '#0d6efd',
            borderRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 100 },
        },
      },
    })

    if (topSubjectChart) topSubjectChart.destroy()
    topSubjectChart = new Chart(topSubjectChartCanvas, {
      type: 'line',
      data: {
        labels: topLabels,
        datasets: [
          {
            label: 'Average Total Marks',
            data: topValues,
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.2)',
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 100 },
        },
      },
    })
  }

  const renderTeacherTable = (teachers) => {
    teacherTableBody.innerHTML = teachers
      .map(
        (teacher) => `<tr><td>${teacher.teacher_name}</td><td>${teacher.subject}</td><td>${teacher.email || 'Not assigned'}</td><td><button class="btn btn-sm btn-outline-primary me-2" data-action="edit" data-id="${teacher.id}">Edit</button><button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${teacher.id}">Delete</button></td></tr>`
      )
      .join('')
  }

  const loadTeachers = async () => {
    try {
      const teachers = await fetchJson(`${apiBase}/teachers`)
      renderTeacherTable(teachers)
    } catch (error) {
      showStatus(error.message, false)
    }
  }

  const saveTeacher = async () => {
    const teacherName = teacherNameInput.value.trim()
    const subject = teacherSubjectInput.value.trim()
    const email = teacherEmailInput.value.trim()
    const password = teacherPasswordInput.value.trim()

    if (!teacherName || !subject) {
      showStatus('Teacher name and subject are required.', false)
      return
    }

    try {
      const payload = { teacher_name: teacherName, subject, email, password }
      const method = editingTeacherId ? 'PUT' : 'POST'
      const url = editingTeacherId ? `${apiBase}/teachers/${editingTeacherId}` : `${apiBase}/teachers`
      await fetchJson(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      showStatus(editingTeacherId ? 'Teacher updated successfully.' : 'Teacher added successfully.', true)
      editingTeacherId = null
      addTeacherButton.textContent = 'Add Teacher'
      teacherNameInput.value = ''
      teacherSubjectInput.value = ''
      teacherEmailInput.value = ''
      teacherPasswordInput.value = ''
      await loadDashboard()
    } catch (error) {
      showStatus(error.message, false)
    }
  }

  const deleteTeacher = async (id) => {
    if (!confirm('Delete this teacher from the department?')) return
    try {
      await fetchJson(`${apiBase}/teachers/${id}`, { method: 'DELETE' })
      showStatus('Teacher deleted successfully.', true)
      await loadDashboard()
    } catch (error) {
      showStatus(error.message, false)
    }
  }

  const handleTeacherTableClick = async (event) => {
    const button = event.target.closest('button')
    if (!button) return
    const action = button.dataset.action
    const id = button.dataset.id
    const row = button.closest('tr')
    if (action === 'delete') {
      await deleteTeacher(id)
    }
    if (action === 'edit' && row) {
      const cells = row.querySelectorAll('td')
      teacherNameInput.value = cells[0].textContent.trim()
      teacherSubjectInput.value = cells[1].textContent.trim()
      teacherEmailInput.value = cells[2].textContent.trim() === 'Not assigned' ? '' : cells[2].textContent.trim()
      teacherPasswordInput.value = ''
      editingTeacherId = id
      addTeacherButton.textContent = 'Update Teacher'
      showStatus('Edit teacher details and save. Leave password blank to retain existing login.', true)
    }
  }

  const publishNotice = async () => {
    const title = hodNoticeTitle.value.trim()
    const description = hodNoticeDescription.value.trim()
    const target_role = hodNoticeTarget.value
    if (!title || !description) {
      showStatus('Notice title and description are required.', false)
      return
    }
    try {
      await fetchJson(`${apiBase}/upload-notice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, target_role }),
      })
      showStatus('Notice published successfully.', true)
      hodNoticeTitle.value = ''
      hodNoticeDescription.value = ''
      hodNoticeTarget.value = 'all'
    } catch (error) {
      showStatus(error.message, false)
    }
  }

  loginButton.addEventListener('click', login)
  addTeacherButton.addEventListener('click', saveTeacher)
  teacherTableBody.addEventListener('click', handleTeacherTableClick)
  hodNoticeButton.addEventListener('click', publishNotice)

  trySession()
}

window.addEventListener('DOMContentLoaded', () => {
  initTheme()
  initThemeToggle()
  const body = document.body
  if (body.classList.contains('page-student')) initStudentPage()
  if (body.classList.contains('page-teacher')) initTeacherPage()
  if (body.classList.contains('page-hod')) initHodPage()
})
