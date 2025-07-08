const express = require('express');
const router = express.Router();
const Support = require('../models/Support');
const { auth, adminAuth } = require('../middleware/auth');
const { logCustomEvent } = require('../middleware/audit');

// Get all support tickets (admin)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const {
      status,
      priority,
      type,
      category,
      assignedTo,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const tickets = await Support.find(query)
      .populate('customer', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('relatedOrder', 'orderNumber total')
      .populate('relatedProduct', 'name sku')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Support.countDocuments(query);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting support tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get support tickets',
      error: error.message
    });
  }
});

// Get customer's own tickets
router.get('/my-tickets', auth, async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { customer: req.user._id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const tickets = await Support.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('relatedOrder', 'orderNumber total')
      .populate('relatedProduct', 'name sku')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Support.countDocuments(query);

    res.json({
      success: true,
      data: tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting customer tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer tickets',
      error: error.message
    });
  }
});

// Create new support ticket
router.post('/', auth, async (req, res) => {
  try {
    const {
      type,
      priority,
      subject,
      description,
      category,
      relatedOrder,
      relatedProduct,
      attachments
    } = req.body;

    const ticketData = {
      customer: req.user._id,
      customerInfo: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        phone: req.user.phone
      },
      type,
      priority,
      subject,
      description,
      category,
      relatedOrder,
      relatedProduct,
      attachments,
      source: 'web',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const ticket = new Support(ticketData);
    await ticket.save();

    // Log the ticket creation
    await logCustomEvent(req, 'support_ticket_create', 'support', {
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      type,
      priority,
      category
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status
      }
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      error: error.message
    });
  }
});

// Get ticket details
router.get('/:ticketId', auth, async (req, res) => {
  try {
    const ticket = await Support.findById(req.params.ticketId)
      .populate('customer', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('relatedOrder', 'orderNumber total status')
      .populate('relatedProduct', 'name sku images')
      .populate('messages.sender', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if user has access to this ticket
    if (req.user.role !== 'admin' && ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Error getting ticket details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ticket details',
      error: error.message
    });
  }
});

// Update ticket status (admin)
router.put('/:ticketId/status', auth, adminAuth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const userId = req.user._id;

    const ticket = await Support.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.updateStatus(status, note, userId);

    // Log the status update
    await logCustomEvent(req, 'support_ticket_status_update', 'support', {
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      oldStatus: ticket.status,
      newStatus: status
    });

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status
      }
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket status',
      error: error.message
    });
  }
});

// Assign ticket (admin)
router.put('/:ticketId/assign', auth, adminAuth, async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const userId = req.user._id;

    const ticket = await Support.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.assignTicket(assignedTo, userId);

    res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        assignedTo: ticket.assignedTo
      }
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign ticket',
      error: error.message
    });
  }
});

// Add message to ticket
router.post('/:ticketId/messages', auth, async (req, res) => {
  try {
    const { message, isInternal = false, attachments = [] } = req.body;
    const userId = req.user._id;

    const ticket = await Support.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if user has access to this ticket
    if (req.user.role !== 'admin' && ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const senderType = req.user.role === 'admin' ? 'admin' : 'customer';
    await ticket.addMessage(userId, message, senderType, isInternal, attachments);

    res.json({
      success: true,
      message: 'Message added successfully',
      data: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        messageCount: ticket.messages.length
      }
    });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: error.message
    });
  }
});

// Escalate ticket (admin)
router.put('/:ticketId/escalate', auth, adminAuth, async (req, res) => {
  try {
    const { level, reason } = req.body;
    const userId = req.user._id;

    const ticket = await Support.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.escalateTicket(level, reason, userId);

    res.json({
      success: true,
      message: 'Ticket escalated successfully',
      data: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        escalationLevel: ticket.escalationLevel
      }
    });
  } catch (error) {
    console.error('Error escalating ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to escalate ticket',
      error: error.message
    });
  }
});

// Add customer satisfaction rating
router.post('/:ticketId/satisfaction', auth, async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    const ticket = await Support.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check if user owns this ticket
    if (ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await ticket.addSatisfaction(rating, feedback);

    res.json({
      success: true,
      message: 'Satisfaction rating submitted successfully',
      data: {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        rating: ticket.customerSatisfaction.rating
      }
    });
  } catch (error) {
    console.error('Error submitting satisfaction rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit satisfaction rating',
      error: error.message
    });
  }
});

// Get overdue tickets (admin)
router.get('/overdue/list', auth, adminAuth, async (req, res) => {
  try {
    const tickets = await Support.getOverdueTickets();

    res.json({
      success: true,
      data: tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('Error getting overdue tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get overdue tickets',
      error: error.message
    });
  }
});

// Get support statistics (admin)
router.get('/stats/overview', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const stats = await Support.getSupportStats(
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting support statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get support statistics',
      error: error.message
    });
  }
});

// Get tickets by status (admin)
router.get('/status/:status', auth, adminAuth, async (req, res) => {
  try {
    const tickets = await Support.getTicketsByStatus(req.params.status);

    res.json({
      success: true,
      data: tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('Error getting tickets by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tickets by status',
      error: error.message
    });
  }
});

// Get tickets by priority (admin)
router.get('/priority/:priority', auth, adminAuth, async (req, res) => {
  try {
    const tickets = await Support.getTicketsByPriority(req.params.priority);

    res.json({
      success: true,
      data: tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('Error getting tickets by priority:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tickets by priority',
      error: error.message
    });
  }
});

// Contact form submission (public)
router.post('/contact', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
      category = 'general'
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Create a guest ticket (no user account required)
    const ticketData = {
      customer: null, // Will be null for guest submissions
      customerInfo: {
        firstName,
        lastName,
        email,
        phone
      },
      type: 'general',
      priority: 'medium',
      subject,
      description: message,
      category,
      source: 'web',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    const ticket = new Support(ticketData);
    await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully. We will get back to you soon.',
      data: {
        ticketNumber: ticket.ticketNumber
      }
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form',
      error: error.message
    });
  }
});

// Export tickets to CSV (admin)
router.get('/export/csv', auth, adminAuth, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const tickets = await Support.find(query)
      .populate('customer', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10000);

    // Generate CSV content
    const csvHeaders = [
      'Ticket Number',
      'Customer',
      'Email',
      'Subject',
      'Type',
      'Priority',
      'Status',
      'Category',
      'Assigned To',
      'Created At',
      'Resolved At'
    ];

    const csvRows = tickets.map(ticket => [
      ticket.ticketNumber,
      `${ticket.customerInfo.firstName} ${ticket.customerInfo.lastName}`,
      ticket.customerInfo.email,
      ticket.subject,
      ticket.type,
      ticket.priority,
      ticket.status,
      ticket.category,
      ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : '',
      new Date(ticket.createdAt).toLocaleDateString(),
      ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString() : ''
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="support-tickets-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export tickets',
      error: error.message
    });
  }
});

module.exports = router; 