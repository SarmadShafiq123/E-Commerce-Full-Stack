import AuditLog from '../models/AuditLog.js';

/**
 * Fire-and-forget audit log writer.
 * Never throws — logging must never break the main request flow.
 *
 * @param {object} params
 * @param {string}   params.action       - AuditLog.action enum value
 * @param {object}   [params.user]       - req.user or null
 * @param {Request}  [params.req]        - Express request (for ip/userAgent)
 * @param {string}   [params.resourceType]
 * @param {string}   [params.resourceId]
 * @param {object}   [params.metadata]
 * @param {boolean}  [params.success]
 * @param {string}   [params.errorMessage]
 */
const audit = ({
  action,
  user = null,
  req = null,
  resourceType = '',
  resourceId = '',
  metadata = {},
  success = true,
  errorMessage = '',
}) => {
  const ip = req
    ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
    : '';
  const userAgent = req ? (req.headers['user-agent'] || '') : '';

  AuditLog.create({
    action,
    userId: user?._id || null,
    userEmail: user?.email || '',
    userRole: user?.role || '',
    resourceType,
    resourceId: resourceId ? String(resourceId) : '',
    ip,
    userAgent,
    metadata,
    success,
    errorMessage,
  }).catch((err) => {
    // Log to console but never propagate
    console.error('[AuditLog] Failed to write audit entry:', err.message);
  });
};

export default audit;
