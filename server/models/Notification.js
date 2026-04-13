import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['low_stock', 'new_review', 'new_order', 'order_status'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    // Optional references
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    order:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order',   default: null },
    review:  { type: mongoose.Schema.Types.ObjectId, ref: 'Review',  default: null },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
