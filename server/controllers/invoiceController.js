import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import generateInvoice from '../utils/generateInvoice.js';
import nodemailer from 'nodemailer';
import { PassThrough } from 'stream';

/**
 * GET /api/admin/orders/:id/invoice
 * Streams a PDF invoice directly to the browser (download or inline).
 */
export const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const filename = `invoice-${String(order._id).slice(-10).toUpperCase()}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  generateInvoice(order, res);
});

/**
 * POST /api/admin/orders/:id/invoice/email
 * Generates the PDF in memory and emails it to the customer.
 */
export const emailInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const customerEmail = order.user?.email;
  if (!customerEmail) {
    res.status(400);
    throw new Error('No customer email on this order');
  }

  // Buffer the PDF in memory via PassThrough
  const chunks = [];
  const pass = new PassThrough();
  pass.on('data', (chunk) => chunks.push(chunk));

  await new Promise((resolve, reject) => {
    pass.on('end', resolve);
    pass.on('error', reject);
    generateInvoice(order, pass);
  });

  const pdfBuffer = Buffer.concat(chunks);
  const filename = `invoice-${String(order._id).slice(-10).toUpperCase()}.pdf`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: customerEmail,
    subject: `Your Invoice — Luxe Bags Order #${String(order._id).slice(-8).toUpperCase()}`,
    html: `
      <div style="font-family:Georgia,serif;background:#FAFAFA;padding:40px 16px;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #EAEAEA;padding:40px;">
          <p style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#6B7280;margin:0 0 24px;">LUXE BAGS</p>
          <h2 style="font-size:20px;font-weight:normal;color:#1A1A1A;margin:0 0 12px;">Your Invoice is Attached</h2>
          <p style="font-size:13px;color:#6B7280;line-height:1.7;margin:0 0 24px;">
            Please find your invoice for order <strong style="color:#1A1A1A;">#${String(order._id).slice(-8).toUpperCase()}</strong> attached to this email.
          </p>
          <p style="font-size:12px;color:#6B7280;margin:0;">Thank you for shopping with Luxe Bags.</p>
        </div>
      </div>
    `,
    attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
  });

  res.json({ success: true, message: `Invoice emailed to ${customerEmail}` });
});
