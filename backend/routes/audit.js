const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { auth, adminAuth } = require('../middleware/auth');
const { logCustomEvent } = require('../middleware/audit');

// Get audit logs with filtering and pagination (Admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      user,
      action,
      resource,
      status,
      ipAddress,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build filters
    const filters = {};
    if (user) filters.user = user;
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (status) filters.status = status;
    if (ipAddress) filters.ipAddress = ipAddress;
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    // Get logs with pagination
    const result = await AuditLog.getLogs(filters, parseInt(page), parseInt(limit));

    // Log the audit log access
    await logCustomEvent(req, 'admin_audit_log_access', 'system', {
      filters,
      page: parseInt(page),
      limit: parseInt(limit),
      resultsCount: result.logs.length
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

// Get audit log summary/statistics (Admin only)
router.get('/summary', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const summary = await AuditLog.getSummary(startDate, endDate);

    // Log the summary access
    await logCustomEvent(req, 'admin_audit_summary_access', 'system', {
      startDate,
      endDate,
      summaryCount: summary.length
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching audit summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit summary',
      error: error.message
    });
  }
});

// Get specific audit log by ID (Admin only)
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const auditLog = await AuditLog.findById(req.params.id)
      .populate('user', 'firstName lastName email');

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    // Log the specific log access
    await logCustomEvent(req, 'admin_audit_log_detail_access', 'system', {
      auditLogId: req.params.id
    });

    res.json({
      success: true,
      data: auditLog
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
});

// Get audit logs for a specific user (Admin only)
router.get('/user/:userId', auth, adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      resource,
      status,
      startDate,
      endDate
    } = req.query;

    const filters = {
      user: req.params.userId,
      ...(action && { action }),
      ...(resource && { resource }),
      ...(status && { status }),
      ...(startDate && endDate && { startDate, endDate })
    };

    const result = await AuditLog.getLogs(filters, parseInt(page), parseInt(limit));

    // Log the user audit log access
    await logCustomEvent(req, 'admin_user_audit_access', 'system', {
      targetUserId: req.params.userId,
      filters,
      resultsCount: result.logs.length
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user audit logs',
      error: error.message
    });
  }
});

// Get audit logs for a specific resource (Admin only)
router.get('/resource/:resource/:resourceId', auth, adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      status,
      startDate,
      endDate
    } = req.query;

    const filters = {
      resource: req.params.resource,
      resourceId: req.params.resourceId,
      ...(action && { action }),
      ...(status && { status }),
      ...(startDate && endDate && { startDate, endDate })
    };

    const result = await AuditLog.getLogs(filters, parseInt(page), parseInt(limit));

    // Log the resource audit log access
    await logCustomEvent(req, 'admin_resource_audit_access', 'system', {
      resource: req.params.resource,
      resourceId: req.params.resourceId,
      resultsCount: result.logs.length
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching resource audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resource audit logs',
      error: error.message
    });
  }
});

// Export audit logs to CSV (Admin only)
router.get('/export/csv', auth, adminAuth, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      user,
      action,
      resource,
      status
    } = req.query;

    // Build filters
    const filters = {};
    if (user) filters.user = user;
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (status) filters.status = status;
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    // Get all logs for export (no pagination)
    const result = await AuditLog.getLogs(filters, 1, 10000); // Large limit for export

    // Generate CSV content
    const csvHeaders = [
      'Timestamp',
      'User',
      'Action',
      'Resource',
      'Resource ID',
      'Status',
      'IP Address',
      'User Agent',
      'Details'
    ];

    const csvRows = result.logs.map(log => [
      log.formattedTimestamp,
      log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})` : 'System',
      log.action,
      log.resource,
      log.resourceId || '',
      log.status,
      log.ipAddress,
      log.userAgent || '',
      JSON.stringify(log.details)
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Log the export action
    await logCustomEvent(req, 'admin_audit_export', 'system', {
      filters,
      exportFormat: 'csv',
      recordsExported: result.logs.length
    });

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
      error: error.message
    });
  }
});

// Clean old audit logs (Admin only)
router.delete('/cleanup', auth, adminAuth, async (req, res) => {
  try {
    const { retentionDays = 365 } = req.body;

    const result = await AuditLog.cleanOldLogs(parseInt(retentionDays));

    // Log the cleanup action
    await logCustomEvent(req, 'admin_audit_cleanup', 'system', {
      retentionDays: parseInt(retentionDays),
      deletedCount: result.deletedCount
    });

    res.json({
      success: true,
      message: `Successfully cleaned ${result.deletedCount} old audit logs`,
      data: {
        deletedCount: result.deletedCount,
        retentionDays: parseInt(retentionDays)
      }
    });
  } catch (error) {
    console.error('Error cleaning audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean audit logs',
      error: error.message
    });
  }
});

// Get audit log statistics dashboard (Admin only)
router.get('/dashboard/stats', auth, adminAuth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    endDate = now;

    // Get summary for the period
    const summary = await AuditLog.getSummary(startDate, endDate);

    // Get top actions
    const topActions = summary.slice(0, 10);

    // Get success/failure ratio
    const totalLogs = summary.reduce((sum, item) => sum + item.totalCount, 0);
    const successLogs = summary.reduce((sum, item) => {
      const successStatus = item.statuses.find(s => s.status === 'success');
      return sum + (successStatus ? successStatus.count : 0);
    }, 0);
    const failureLogs = totalLogs - successLogs;

    // Get recent activity (last 10 logs)
    const recentLogs = await AuditLog.find({
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .populate('user', 'firstName lastName email')
    .sort({ timestamp: -1 })
    .limit(10);

    const stats = {
      period,
      totalLogs,
      successLogs,
      failureLogs,
      successRate: totalLogs > 0 ? ((successLogs / totalLogs) * 100).toFixed(2) : 0,
      topActions,
      recentLogs
    };

    // Log the dashboard access
    await logCustomEvent(req, 'admin_audit_dashboard_access', 'system', {
      period,
      statsGenerated: true
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching audit dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit dashboard stats',
      error: error.message
    });
  }
});

module.exports = router; 