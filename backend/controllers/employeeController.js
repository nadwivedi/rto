const Employee = require('../models/Employee')

// Create a new employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, mobile, password, permissions, sections } = req.body

    // Basic validation
    if (!name || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, mobile, and password are required'
      })
    }

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ mobile })
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this mobile number already exists'
      })
    }

    const newEmployee = new Employee({
      name,
      mobile,
      password,
      permissions: permissions || { view: true, add: false, edit: false },
      sections: sections || undefined,
      adminId: req.user.id
    })

    await newEmployee.save()

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        id: newEmployee._id,
        name: newEmployee.name,
        mobile: newEmployee.mobile,
        permissions: newEmployee.permissions,
        sections: newEmployee.sections
      }
    })
  } catch (error) {
    console.error('Error creating employee:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create employee',
      error: error.message
    })
  }
}

// Get all employees for the logged-in admin
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ adminId: req.user.id }).select('-password').sort({ createdAt: -1 })
    
    res.json({
      success: true,
      data: employees
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees'
    })
  }
}

// Update employee permissions or details
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params
    const { name, mobile, password, permissions, sections, isActive } = req.body

    const employee = await Employee.findOne({ _id: id, adminId: req.user.id })
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or unauthorized'
      })
    }

    if (name) employee.name = name
    if (mobile) employee.mobile = mobile
    if (password) employee.password = password // Will be hashed by pre-save hook
    if (permissions) employee.permissions = permissions
    if (sections) employee.sections = sections
    if (isActive !== undefined) employee.isActive = isActive

    await employee.save()

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        id: employee._id,
        name: employee.name,
        mobile: employee.mobile,
        permissions: employee.permissions,
        sections: employee.sections,
        isActive: employee.isActive
      }
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update employee',
      error: error.message
    })
  }
}

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await Employee.findOneAndDelete({ _id: id, adminId: req.user.id })
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found or unauthorized'
      })
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting employee:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete employee'
    })
  }
}
