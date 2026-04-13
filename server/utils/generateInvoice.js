import PDFDocument from 'pdfkit';

const BRAND = 'LUXE BAGS';
const TAGLINE = 'Timeless elegance, handcrafted with care';
const CONTACT = 'luxebags.store | support@luxebags.store';

const COLOR_BLACK = '#1A1A1A';
const COLOR_MUTED = '#6B7280';
const COLOR_BORDER = '#EAEAEA';
const COLOR_BG = '#FAFAFA';

const fmt = (amount) => `Rs. ${Number(amount).toLocaleString('en-PK')}`;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });

const PAYMENT_LABELS = {
  cod: 'Cash on Delivery',
  'bank-transfer': 'Bank Transfer',
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
};

/**
 * Streams a premium PDF invoice into the provided writable stream.
 * @param {object} order  - Mongoose order document (populated with user)
 * @param {Stream} stream - Writable stream (res or file)
 */
const generateInvoice = (order, stream) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    info: {
      Title: `Invoice #${order._id}`,
      Author: BRAND,
      Subject: 'Order Invoice',
    },
  });

  doc.pipe(stream);

  const PW = doc.page.width;   // 595
  const PH = doc.page.height;  // 842
  const ML = 48;               // margin left
  const MR = 48;               // margin right
  const CW = PW - ML - MR;    // content width

  // ── helpers ──────────────────────────────────────────────────────────────

  const hline = (y, x1 = ML, x2 = PW - MR, color = COLOR_BORDER, w = 0.5) => {
    doc.save().strokeColor(color).lineWidth(w).moveTo(x1, y).lineTo(x2, y).stroke().restore();
  };

  const label = (text, x, y, opts = {}) => {
    doc.save()
      .font('Helvetica')
      .fontSize(7)
      .fillColor(COLOR_MUTED)
      .text(text.toUpperCase(), x, y, { characterSpacing: 1.5, ...opts })
      .restore();
  };

  const body = (text, x, y, opts = {}) => {
    doc.save()
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(COLOR_BLACK)
      .text(text, x, y, opts)
      .restore();
  };

  const bodyMuted = (text, x, y, opts = {}) => {
    doc.save()
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLOR_MUTED)
      .text(text, x, y, opts)
      .restore();
  };

  // ── HEADER BAND ──────────────────────────────────────────────────────────
  doc.rect(0, 0, PW, 90).fill(COLOR_BLACK);

  // Brand name
  doc.save()
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#FFFFFF')
    .text(BRAND, ML, 28, { characterSpacing: 5 })
    .restore();

  // Tagline
  doc.save()
    .font('Helvetica')
    .fontSize(8)
    .fillColor('rgba(255,255,255,0.5)')
    .text(TAGLINE, ML, 46, { characterSpacing: 0.5 })
    .restore();

  // "INVOICE" label top-right
  doc.save()
    .font('Helvetica')
    .fontSize(20)
    .fillColor('rgba(255,255,255,0.12)')
    .text('INVOICE', PW - MR - 110, 22, { characterSpacing: 6 })
    .restore();

  // ── ORDER META ROW ───────────────────────────────────────────────────────
  const metaY = 110;

  label('Invoice No.', ML, metaY);
  body(`#${String(order._id).slice(-10).toUpperCase()}`, ML, metaY + 12);

  label('Date', ML + 160, metaY);
  body(fmtDate(order.createdAt), ML + 160, metaY + 12);

  label('Order Status', ML + 320, metaY);
  const statusText = (order.orderStatus || 'pending').toUpperCase();
  doc.save()
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(order.orderStatus === 'delivered' ? '#10B981' : order.orderStatus === 'cancelled' ? '#EF4444' : COLOR_BLACK)
    .text(statusText, ML + 320, metaY + 12, { characterSpacing: 1 })
    .restore();

  label('Payment', ML + 440, metaY);
  const payText = (PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || '').toUpperCase();
  body(payText, ML + 440, metaY + 12);

  hline(metaY + 32);

  // ── CUSTOMER + SHIPPING ──────────────────────────────────────────────────
  const infoY = metaY + 46;
  const col2X = ML + CW / 2 + 10;

  label('Bill To', ML, infoY);
  const customer = order.user || {};
  body(customer.name || order.shippingAddress?.name || '—', ML, infoY + 13);
  bodyMuted(customer.email || '—', ML, infoY + 27);
  bodyMuted(order.shippingAddress?.phone || '—', ML, infoY + 40);

  label('Ship To', col2X, infoY);
  const addr = order.shippingAddress || {};
  body(addr.name || '—', col2X, infoY + 13);
  bodyMuted(`${addr.street || ''}`, col2X, infoY + 27);
  bodyMuted(`${addr.city || ''}, ${addr.province || ''} ${addr.postalCode || ''}`, col2X, infoY + 40);

  hline(infoY + 60);

  // ── ITEMS TABLE ──────────────────────────────────────────────────────────
  const tableY = infoY + 76;

  // Table header bg
  doc.rect(ML, tableY - 6, CW, 22).fill(COLOR_BG);

  const COL = {
    no:    { x: ML,           w: 24  },
    name:  { x: ML + 28,      w: 230 },
    qty:   { x: ML + 268,     w: 60  },
    unit:  { x: ML + 338,     w: 90  },
    total: { x: ML + 438,     w: CW - 438 },
  };

  // Header labels
  label('No.',     COL.no.x,    tableY + 2);
  label('Product', COL.name.x,  tableY + 2);
  label('Qty',     COL.qty.x,   tableY + 2);
  label('Unit Price', COL.unit.x, tableY + 2);
  label('Total',   COL.total.x, tableY + 2, { align: 'right', width: COL.total.w });

  hline(tableY + 18, ML, PW - MR, COLOR_BORDER, 0.5);

  // Rows
  let rowY = tableY + 28;
  const ROW_H = 28;

  order.items.forEach((item, i) => {
    // Alternate row tint
    if (i % 2 === 0) {
      doc.rect(ML, rowY - 6, CW, ROW_H).fill('#FDFDFD');
    }

    body(String(i + 1), COL.no.x, rowY, { width: COL.no.w });
    body(item.name, COL.name.x, rowY, { width: COL.name.w, ellipsis: true });
    body(String(item.quantity), COL.qty.x, rowY, { width: COL.qty.w });
    body(fmt(item.price), COL.unit.x, rowY, { width: COL.unit.w });
    body(fmt(item.price * item.quantity), COL.total.x, rowY, { width: COL.total.w, align: 'right' });

    hline(rowY + ROW_H - 8, ML, PW - MR, '#F5F5F5', 0.3);
    rowY += ROW_H;
  });

  hline(rowY - 2, ML, PW - MR, COLOR_BORDER, 0.5);

  // ── TOTALS ───────────────────────────────────────────────────────────────
  const totY = rowY + 14;
  const totLabelX = PW - MR - 200;
  const totValX   = PW - MR - 100;

  // Subtotal
  label('Subtotal', totLabelX, totY);
  bodyMuted(fmt(order.totalPrice), totValX, totY, { align: 'right', width: 100 });

  label('Shipping', totLabelX, totY + 18);
  bodyMuted('Included', totValX, totY + 18, { align: 'right', width: 100 });

  // Total box
  const totalBoxY = totY + 38;
  doc.rect(totLabelX - 8, totalBoxY - 6, 200 + 8, 28).fill(COLOR_BLACK);
  doc.save()
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#FFFFFF')
    .text('TOTAL', totLabelX, totalBoxY + 2, { characterSpacing: 1.5 })
    .restore();
  doc.save()
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#FFFFFF')
    .text(fmt(order.totalPrice), totValX, totalBoxY, { align: 'right', width: 100 })
    .restore();

  // Payment status badge
  const paidY = totalBoxY + 38;
  const paidColor = order.paymentStatus === 'verified' ? '#10B981' : '#F59E0B';
  const paidText = order.paymentStatus === 'verified' ? '✓  PAYMENT VERIFIED' : '⏳  PAYMENT PENDING';
  doc.save()
    .font('Helvetica')
    .fontSize(8)
    .fillColor(paidColor)
    .text(paidText, totLabelX, paidY, { characterSpacing: 1 })
    .restore();

  // ── ADMIN NOTE ───────────────────────────────────────────────────────────
  if (order.adminNote && order.adminNote.trim()) {
    const noteY = paidY + 28;
    doc.rect(ML, noteY, CW, 1).fill(COLOR_BORDER);
    label('Admin Note', ML, noteY + 10);
    bodyMuted(order.adminNote, ML, noteY + 24, { width: CW });
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const footerY = PH - 60;
  hline(footerY, ML, PW - MR, COLOR_BORDER, 0.5);

  doc.save()
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLOR_MUTED)
    .text(BRAND, ML, footerY + 14, { characterSpacing: 2 })
    .restore();

  doc.save()
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(COLOR_MUTED)
    .text(CONTACT, 0, footerY + 14, { align: 'center', width: PW })
    .restore();

  doc.save()
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(COLOR_MUTED)
    .text(`Generated ${fmtDate(new Date())}`, PW - MR - 120, footerY + 14, { width: 120, align: 'right' })
    .restore();

  doc.end();
};

export default generateInvoice;
