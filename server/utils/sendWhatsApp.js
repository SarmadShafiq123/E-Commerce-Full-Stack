/**
 * Generates a WhatsApp wa.me link with a pre-filled message.
 * In production you'd call the WhatsApp Business API here.
 * For now we log the link so the admin can send it manually,
 * or you can integrate Twilio / Meta Cloud API by replacing the body.
 */

const fmt = (amount) => `Rs. ${Number(amount).toLocaleString('en-PK')}`;

export const buildShippedMessage = (order) => {
  const lines = [
    `Hello ${order.shippingAddress?.name || 'there'} 👋`,
    ``,
    `Your *Luxe Bags* order has been shipped!`,
    ``,
    `🆔 Order: #${String(order._id).slice(-8).toUpperCase()}`,
    order.courierName ? `🚚 Courier: ${order.courierName}` : null,
    order.trackingNumber ? `📦 Tracking: ${order.trackingNumber}` : null,
    ``,
    `You should receive your order within 3–5 business days.`,
    ``,
    `Thank you for shopping with Luxe Bags ✨`,
  ].filter((l) => l !== null).join('\n');

  return lines;
};

export const buildDeliveredMessage = (order) => {
  const lines = [
    `Hello ${order.shippingAddress?.name || 'there'} 👋`,
    ``,
    `Your *Luxe Bags* order has been delivered! 🎉`,
    ``,
    `🆔 Order: #${String(order._id).slice(-8).toUpperCase()}`,
    `💰 Total: ${fmt(order.totalPrice)}`,
    ``,
    `We hope you love your new piece. If you have any questions, just reply to this message.`,
    ``,
    `Thank you for shopping with Luxe Bags ✨`,
  ].join('\n');

  return lines;
};

/**
 * Logs the WhatsApp link to console (admin can click it).
 * Replace this with a real API call (Twilio, Meta) for production.
 */
export const sendWhatsAppNotification = (phone, message) => {
  if (!phone) return;
  // Normalize Pakistani numbers: strip leading 0, add country code
  const normalized = phone.replace(/^0/, '92').replace(/\D/g, '');
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  console.log(`[WhatsApp] Notification link for ${phone}:\n${url}`);
  // TODO: replace with Twilio / Meta Cloud API call
};
