const CustomBill = require('../models/CustomBill')
const User = require('../models/User')
const { generateCustomBillPDF, generateCustomBillNumber } = require('../utils/customBillGenerator')

// Create new custom bill
exports.createCustomBill = async (req, res) => {
  try {
    const { customerName, billDate, items, totalAmount, notes } = req.body

    // Validate required fields
    if (!customerName || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, items, and total amount are required'
      })
    }

    // Generate bill number first (to ensure uniqueness per user)
    const billNumber = await generateCustomBillNumber(CustomBill, req.user.id)

    // Fetch user information
    const user = await User.findById(req.user.id).select('name email mobile1 mobile2 address billName billDescription profileImage')

    // Create custom bill object
    const customBill = new CustomBill({
      customerName,
      billDate,
      items,
      totalAmount,
      notes,
      billNumber,
      userId: req.user.id
    })

    // Generate PDF with user info
    const pdfPath = await generateCustomBillPDF(customBill, user)
    customBill.billPdfPath = pdfPath

    // Save to database
    await customBill.save()

    res.status(201).json({
      success: true,
      message: 'Custom bill created successfully',
      data: customBill
    })
  } catch (error) {
    console.error('Error creating custom bill:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create custom bill',
      error: error.message
    })
  }
}

// Get all custom bills with pagination and search
exports.getAllCustomBills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const search = req.query.search || ''
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1

    // Build search query
    let query = { userId: req.user.id }
    if (search) {
      const searchConditions = [
        { customerName: { $regex: search, $options: 'i' } }
      ]

      // If search is a valid number, also search by billNumber
      const searchAsNumber = parseInt(search)
      if (!isNaN(searchAsNumber)) {
        searchConditions.push({ billNumber: searchAsNumber })
      }

      query = {
        userId: req.user.id,
        $or: searchConditions
      }
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit

    // Get total count for pagination
    const totalItems = await CustomBill.countDocuments(query)
    const totalPages = Math.ceil(totalItems / limit)

    // Fetch custom bills with pagination and sorting
    const customBills = await CustomBill.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)

    res.status(200).json({
      success: true,
      data: customBills,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit
      }
    })
  } catch (error) {
    console.error('Error fetching custom bills:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch custom bills',
      error: error.message
    })
  }
}

// Get custom bill by ID
exports.getCustomBillById = async (req, res) => {
  try {
    const customBill = await CustomBill.findOne({ _id: req.params.id, userId: req.user.id })

    if (!customBill) {
      return res.status(404).json({
        success: false,
        message: 'Custom bill not found'
      })
    }

    res.status(200).json({
      success: true,
      data: customBill
    })
  } catch (error) {
    console.error('Error fetching custom bill:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch custom bill',
      error: error.message
    })
  }
}

// Update custom bill
exports.updateCustomBill = async (req, res) => {
  try {
    const { customerName, billDate, items, totalAmount, notes } = req.body

    // Validate required fields
    if (!customerName || !items || items.length === 0 || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, items, and total amount are required'
      })
    }

    // Find existing bill
    const existingBill = await CustomBill.findOne({ _id: req.params.id, userId: req.user.id })

    if (!existingBill) {
      return res.status(404).json({
        success: false,
        message: 'Custom bill not found'
      })
    }

    // Delete old PDF file if it exists
    const path = require('path')
    const fs = require('fs')

    if (existingBill.billPdfPath) {
      const oldPdfPath = path.join(__dirname, '..', existingBill.billPdfPath)

      if (fs.existsSync(oldPdfPath)) {
        fs.unlinkSync(oldPdfPath)
        console.log('Old PDF deleted:', oldPdfPath)
      }
    }

    // Fetch user information
    const user = await User.findById(req.user.id).select('name email mobile1 mobile2 address billName billDescription profileImage')

    // Update bill data
    existingBill.customerName = customerName
    existingBill.billDate = billDate
    existingBill.items = items
    existingBill.totalAmount = totalAmount
    existingBill.notes = notes

    // Regenerate PDF with updated data and user info
    const newPdfPath = await generateCustomBillPDF(existingBill, user)
    existingBill.billPdfPath = newPdfPath

    // Save updated bill
    await existingBill.save()

    res.status(200).json({
      success: true,
      message: 'Custom bill updated successfully',
      data: existingBill
    })
  } catch (error) {
    console.error('Error updating custom bill:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update custom bill',
      error: error.message
    })
  }
}

// Delete custom bill
exports.deleteCustomBill = async (req, res) => {
  try {
    const customBill = await CustomBill.findOneAndDelete({ _id: req.params.id, userId: req.user.id })

    if (!customBill) {
      return res.status(404).json({
        success: false,
        message: 'Custom bill not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Custom bill deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting custom bill:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete custom bill',
      error: error.message
    })
  }
}

// Download custom bill PDF
exports.downloadCustomBillPDF = async (req, res) => {
  try {
    const customBill = await CustomBill.findOne({ _id: req.params.id, userId: req.user.id })

    if (!customBill) {
      return res.status(404).json({
        success: false,
        message: 'Custom bill not found'
      })
    }

    if (!customBill.billPdfPath) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found for this bill'
      })
    }

    // Construct file path
    const path = require('path')
    const fs = require('fs')
    const filePath = path.join(__dirname, '..', customBill.billPdfPath)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found on server'
      })
    }

    // Send file
    res.download(filePath, `BILL-${String(customBill.billNumber).padStart(2, '0')}.pdf`, (err) => {
      if (err) {
        console.error('Error downloading file:', err)
        res.status(500).json({
          success: false,
          message: 'Error downloading file'
        })
      }
    })
  } catch (error) {
    console.error('Error downloading custom bill PDF:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to download custom bill PDF',
      error: error.message
    })
  }
}
