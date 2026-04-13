import mongoose from 'mongoose';

/**
 * Immutable audit trail for security-sensitive admin + auth actions.
 * Documents are never updated — only created.
 */
const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for unauthenticated attempts
    },
    userEmail: { type: String, default: '' },
    userRole: { type: String, default: '' },

    // What happened
    action: {
      type: String,
      required: true,
      enum: [
        // Auth
        'AUTH_LOGIN',
        'AUTH_LOGOUT',
        'AUTH_REFRESH',
        'AUTH_REGISTER',
        'AUTH_GOOGLE_LOGIN',
        'AUTH_TOKEN_REUSE_DETECTED',
        // Products
        'PRODUCT_CREATE',
        'PRODUCT_UPDATE',
        'PRODUCT_DELETE',
        // Orders
        'ORDER_CREATE',
        'ORDER_STATUS_CHANGE',
        // Admin
        'ADMIN_LOGIN',
        'ADMIN_STOCK_UPDATE',
        'ADMIN_COUPON_CREATE',
        'ADMIN_COUPON_DELETE',
        'ADMIN_REVIEW_DELETE',
      ],
    },

    // Context
    resourceType: { type: String, default: '' }, // 'Order', 'Product', etc.
    resourceId: { type: String, default: '' },   // ObjectId as string

    // Request metadata
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },

    // Arbitrary extra data (status changes, old→new values, etc.)
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Outcome
    success: { type: Boolean, default: true },
    errorMessage: { type: String, default: '' },
  },
  {
    timestamps: true,
    // Prevent accidental updates to audit records
    strict: true,
  }
);

// Index for efficient admin queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
