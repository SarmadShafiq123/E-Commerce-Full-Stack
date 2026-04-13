const formatPrice = (amount) =>
  `Rs. ${Number(amount).toLocaleString('en-PK')}`;

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const baseTemplate = ({ heading, statusLine, statusColor, order, extraNote = '' }) => {
  const { _id, createdAt, items, totalPrice, shippingAddress, paymentMethod } = order;

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #E8E0D8; font-family:Georgia,serif; font-size:14px; color:#1A1A1A;">
            ${item.name}
          </td>
          <td style="padding:10px 0; border-bottom:1px solid #E8E0D8; font-family:Georgia,serif; font-size:14px; color:#1A1A1A; text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:10px 0; border-bottom:1px solid #E8E0D8; font-family:Georgia,serif; font-size:14px; color:#1A1A1A; text-align:right;">
            ${formatPrice(item.price)}
          </td>
        </tr>`
    )
    .join('');

  const paymentLabels = {
    'cod': 'Cash on Delivery',
    'bank-transfer': 'Bank Transfer',
    'easypaisa': 'Easypaisa',
    'jazzcash': 'JazzCash',
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAFAF8; font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8; padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border:1px solid #E8E0D8;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px; border-bottom:1px solid #E8E0D8; text-align:center;">
              <p style="margin:0; font-family:Georgia,serif; font-size:11px; letter-spacing:4px; text-transform:uppercase; color:#8A8078;">LUXE BAGS</p>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="padding:28px 40px 20px; text-align:center;">
              <h1 style="margin:0 0 8px; font-family:Georgia,serif; font-size:24px; font-weight:normal; color:#1A1A1A;">${heading}</h1>
              <p style="margin:0; font-size:13px; color:${statusColor}; letter-spacing:1px; text-transform:uppercase;">${statusLine}</p>
              ${extraNote ? `<p style="margin:16px 0 0; font-size:13px; color:#8A8078; line-height:1.6;">${extraNote}</p>` : ''}
            </td>
          </tr>

          <!-- Order Meta -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8; border:1px solid #E8E0D8; padding:20px;">
                <tr>
                  <td style="font-family:Georgia,serif; font-size:12px; color:#8A8078; text-transform:uppercase; letter-spacing:1px; padding-bottom:8px;">Order ID</td>
                  <td style="font-family:Georgia,serif; font-size:12px; color:#1A1A1A; text-align:right; padding-bottom:8px;">#${_id}</td>
                </tr>
                <tr>
                  <td style="font-family:Georgia,serif; font-size:12px; color:#8A8078; text-transform:uppercase; letter-spacing:1px;">Order Date</td>
                  <td style="font-family:Georgia,serif; font-size:12px; color:#1A1A1A; text-align:right;">${formatDate(createdAt)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 12px; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#8A8078;">Items Ordered</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th style="text-align:left; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#8A8078; font-weight:normal; padding-bottom:8px; border-bottom:1px solid #E8E0D8;">Product</th>
                    <th style="text-align:center; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#8A8078; font-weight:normal; padding-bottom:8px; border-bottom:1px solid #E8E0D8;">Qty</th>
                    <th style="text-align:right; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#8A8078; font-weight:normal; padding-bottom:8px; border-bottom:1px solid #E8E0D8;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding-top:14px; font-family:Georgia,serif; font-size:14px; font-weight:bold; color:#1A1A1A; text-transform:uppercase; letter-spacing:1px;">Total</td>
                    <td style="padding-top:14px; font-family:Georgia,serif; font-size:14px; font-weight:bold; color:#1A1A1A; text-align:right;">${formatPrice(totalPrice)}</td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Shipping & Payment -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="vertical-align:top; padding-right:16px;">
                    <p style="margin:0 0 10px; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#8A8078;">Ship To</p>
                    <p style="margin:0; font-family:Georgia,serif; font-size:13px; color:#1A1A1A; line-height:1.8;">
                      ${shippingAddress.name}<br/>
                      ${shippingAddress.street}<br/>
                      ${shippingAddress.city}, ${shippingAddress.province} ${shippingAddress.postalCode}<br/>
                      <span style="color:#8A8078;">${shippingAddress.phone}</span>
                    </p>
                  </td>
                  <td width="50%" style="vertical-align:top; padding-left:16px; border-left:1px solid #E8E0D8;">
                    <p style="margin:0 0 10px; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#8A8078;">Payment</p>
                    <p style="margin:0; font-family:Georgia,serif; font-size:13px; color:#1A1A1A;">${paymentLabels[paymentMethod] || paymentMethod}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; border-top:1px solid #E8E0D8; text-align:center; background-color:#FAFAF8;">
              <p style="margin:0; font-family:Georgia,serif; font-size:12px; color:#8A8078; letter-spacing:1px;">Thank you for shopping with Luxe Bags</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const orderPlacedTemplate = (order) =>
  baseTemplate({
    heading: 'Order Confirmed',
    statusLine: 'We have received your order',
    statusColor: '#2D7A4F',
    order,
    extraNote: 'We are preparing your order and will notify you once it ships.',
  });

export const orderShippedTemplate = (order) => {
  const trackingBlock = (order.trackingNumber || order.courierName)
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F4FF; border:1px solid #C7D7F5; padding:20px; margin-bottom:24px;">
        <tr>
          <td style="font-family:Georgia,serif; font-size:12px; color:#2D6A9F; text-transform:uppercase; letter-spacing:1px; padding-bottom:10px; font-weight:bold;">
            📦 Tracking Information
          </td>
        </tr>
        ${order.courierName ? `<tr><td style="font-family:Georgia,serif; font-size:12px; color:#8A8078; text-transform:uppercase; letter-spacing:1px; padding-bottom:4px;">Courier</td></tr>
        <tr><td style="font-family:Georgia,serif; font-size:14px; color:#1A1A1A; padding-bottom:10px;">${order.courierName}</td></tr>` : ''}
        ${order.trackingNumber ? `<tr><td style="font-family:Georgia,serif; font-size:12px; color:#8A8078; text-transform:uppercase; letter-spacing:1px; padding-bottom:4px;">Tracking Number</td></tr>
        <tr><td style="font-family:Georgia,serif; font-size:16px; color:#1A1A1A; font-weight:bold; letter-spacing:2px;">${order.trackingNumber}</td></tr>` : ''}
      </table>`
    : '';

  return baseTemplate({
    heading: 'Your Order Is On Its Way',
    statusLine: 'Shipped',
    statusColor: '#2D6A9F',
    order,
    extraNote: `Your order has been handed to the courier. You should receive it within 3–5 business days.${trackingBlock ? '<br/><br/>' + trackingBlock : ''}`,
  });
};

export const orderDeliveredTemplate = (order) =>
  baseTemplate({
    heading: 'Order Delivered',
    statusLine: 'Successfully Delivered',
    statusColor: '#2D7A4F',
    order,
    extraNote: 'We hope you love your new piece. If you have any questions, feel free to reach out.',
  });

export const verifyEmailTemplate = (verifyUrl) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email — Luxe Bags</title>
</head>
<body style="margin:0; padding:0; background-color:#FAFAF8; font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFAF8; padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border:1px solid #E8E0D8;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px; border-bottom:1px solid #E8E0D8; text-align:center;">
              <p style="margin:0; font-family:Georgia,serif; font-size:11px; letter-spacing:4px; text-transform:uppercase; color:#8A8078;">LUXE BAGS</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 20px; text-align:center;">
              <h1 style="margin:0 0 16px; font-family:Georgia,serif; font-size:24px; font-weight:normal; color:#1A1A1A;">Confirm your email address</h1>
              <p style="margin:0 0 32px; font-size:14px; color:#1A1A1A; line-height:1.6;">Click the button below to verify your email. This link expires in 24 hours.</p>
              
              <a href="${verifyUrl}" style="display:inline-block; padding:16px 32px; background-color:#1A1A1A; color:#ffffff; text-decoration:none; font-family:Georgia,serif; font-size:13px; letter-spacing:2px; text-transform:uppercase;">Verify Email</a>
              
              <p style="margin:40px 0 0; font-size:12px; color:#8A8078; word-break:break-all;">
                If the button doesn't work, copy and paste this link:<br/>
                <a href="${verifyUrl}" style="color:#1A1A1A; text-decoration:underline;">${verifyUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px; border-top:1px solid #E8E0D8; text-align:center; background-color:#FAFAF8;">
              <p style="margin:0; font-family:Georgia,serif; font-size:12px; color:#8A8078; letter-spacing:1px;">If you didn't create an account, ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
