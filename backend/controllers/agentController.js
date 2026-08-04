const Agent = require('../models/Agent')
const Insurance = require('../models/Insurance')
const { logError, getUserFriendlyError } = require('../utils/errorLogger')

// Get all agents (with optional ?all=true for dropdowns, search, and pagination)
exports.getAllAgents = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, all } = req.query
    const query = { userId: req.user.id }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } }
      ]
    }

    // If 'all' parameter is true, return all agents without pagination (for dropdowns)
    if (all === 'true') {
      const agents = await Agent.find(query)
        .sort({ name: 1 })
        .select('_id name contact')
        .lean()

      return res.json({
        success: true,
        data: agents,
        count: agents.length
      })
    }

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum

    const totalRecords = await Agent.countDocuments(query)
    const totalPages = Math.ceil(totalRecords / limitNum)

    const agents = await Agent.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean()

    res.json({
      success: true,
      count: agents.length,
      data: agents,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRecords,
        limit: limitNum
      }
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Get single agent by ID
exports.getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      })
    }

    res.json({
      success: true,
      data: agent
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Create new agent
exports.createAgent = async (req, res) => {
  try {
    const { name, contact } = req.body

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Agent name is required'
      })
    }

    const normalizedName = name.trim().replace(/\s+/g, ' ')
    const existingAgent = await Agent.findOne({
      userId: req.user.id,
      name: normalizedName
    })

    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: 'Already exists this agent. Please choose it from the dropdown.'
      })
    }

    const agent = await Agent.create({
      userId: req.user.id,
      name: normalizedName,
      contact: contact ? String(contact).trim() : ''
    })

    res.status(201).json({
      success: true,
      message: 'Agent created successfully',
      data: agent
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(400).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Update agent
exports.updateAgent = async (req, res) => {
  try {
    const { name, contact } = req.body

    const agent = await Agent.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      })
    }

    if (name !== undefined) agent.name = name
    if (contact !== undefined) agent.contact = contact

    await agent.save()

    res.json({
      success: true,
      message: 'Agent updated successfully',
      data: agent
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(400).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Delete agent
exports.deleteAgent = async (req, res) => {
  try {
    const linkedInsurances = await Insurance.countDocuments({
      agentId: req.params.id,
      userId: req.user.id
    })

    if (linkedInsurances > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete agent. ${linkedInsurances} insurance record(s) are linked to this agent.`
      })
    }

    const agent = await Agent.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      })
    }

    res.json({
      success: true,
      message: 'Agent deleted successfully'
    })
  } catch (error) {
    logError(error, req)
    const userError = getUserFriendlyError(error)
    res.status(500).json({
      success: false,
      message: userError.message,
      errors: userError.details,
      errorCount: userError.errorCount,
      timestamp: new Date().toISOString()
    })
  }
}
