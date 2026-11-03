const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const recordAudit = async ({
  req,
  action,
  module,
  targetEntity = null,
  targetId = null,
  details = {},
}) => {
  try {
    const user = req?.user?._id || null;
    const userRole = req?.user?.role || 'SYSTEM';
    const ipAddress = req?.headers ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null) : null;
    const userAgent = req?.headers ? (req.headers['user-agent'] || null) : null;

    await AuditLog.create({
      user,
      userRole,
      action,
      module,
      targetEntity,
      targetId,
      ipAddress,
      userAgent,
      details,
    });
  } catch (error) {
    logger.error(`Failed to record audit log: ${error.message}`);
  }
};

module.exports = { recordAudit };
