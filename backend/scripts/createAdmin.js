require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const readline = require('readline')
const Admin = require('../models/Admin')
const connectDB = require('../utils/mongodb')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function createAdmin() {
  try {
    await connectDB()
    console.log('Connected to MongoDB.')

    const email = await question('Enter Admin Email: ')
    const password = await question('Enter Admin Password: ')

    if (!email || !password) {
      console.log('Email and password are required')
      process.exit(1)
    }

    let admin = await Admin.findOne({ email: email.toLowerCase() })
    if (admin) {
      console.log('Admin already exists')
      process.exit(1)
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    admin = new Admin({
      email: email.toLowerCase(),
      password: hashedPassword
    })

    await admin.save()
    console.log('Admin created successfully')
  } catch (err) {
    console.error(err.message)
  } finally {
    mongoose.disconnect()
    rl.close()
  }
}

createAdmin()