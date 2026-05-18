const path = require('path')
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const connection = require("./db")
const apiRouter = require('./routes/api')

const app = express()
const port = process.env.PORT || 5000

// Middleware
app.use(cors())

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
})

app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }))

// API Routes
app.use('/api', apiRouter)

// Test Route
app.get('/test', (req, res) => {
  res.json({ message: 'Server Working Successfully' })
})

// Static Files
app.use(express.static(path.join(__dirname, 'public')))

// Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student.html'))
})

app.get('/teacher', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teacher.html'))
})

app.get('/hod', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'hod.html'))
})

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' })
})

// Start Server
app.listen(port, () => {
  console.log(`College ERP server running on port ${port}`)
  console.log('Database Connected')
})