const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateInvoice(order, user, res) {
  const doc = new PDFDocument({ margin: 50 });

  // Set headers so the browser knows it's a PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Invoice_${order._id}.pdf`);

  // Pipe the PDF into the response
  doc.pipe(res);

  // ---------- LOGO ----------
  const logoPath = path.join(__dirname, '..', 'public', 'asset-front', 'imgs', 'themelogo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 45, { width: 100 });
  }

  // ---------- INVOICE HEADER ----------
  doc.fontSize(20).text('INVOICE', 400, 50);
  doc.moveDown();

  // ---------- COMPANY INFO ----------
  doc
    .fontSize(10)
    .text('CubeCraze', 50, 150)
    .text('123 Street, City', 50, 165)
    .text('Email: cubecrazee@gmail.com', 50, 180)
    .text('Phone: +1234567890', 50, 195);

  // ---------- CUSTOMER INFO ----------
  doc
    .text(`Invoice Number: ${order._id}`, 400, 150)
    .text(`Invoice Date: ${order.invoiceDate.toDateString()}`, 400, 165)
    .text(`Status: ${order.status}`, 400, 180)
    .moveDown();

  doc
    .fontSize(12)
    .text('Billing Address:', 50, 240)
    .fontSize(10)
    .text(`${order.address.fullname}`, 50, 255)
    .text(`${order.address.street}, ${order.address.village_city}`, 50, 270)
    .text(`${order.address.district}, ${order.address.state} - ${order.address.pincode}`, 50, 285)
    .text(`Mobile: ${order.address.mobile}`, 50, 300);

  // ---------- PAYMENT DETAILS ----------
  doc
    .fontSize(12)
    .text('Payment Details:', 400, 240)
    .fontSize(10)
    .text(`Payment Method: ${order.paymentMethod}`, 400, 255)
    .text(`Transaction ID: ${order.paymentDetails.transactionId || 'N/A'}`, 400, 270)
    .text(`Order ID: ${order.paymentDetails.orderId || 'N/A'}`, 400, 285);

  // ---------- PRODUCT TABLE HEADER ----------
  const tableTop = 350;
  const itemCodeX = 50;
  const descX = 100;
  const qtyX = 300;
  const priceX = 350;
  const totalX = 450;

  doc.fontSize(12).text('Products', 50, tableTop - 30);

  doc
    .fontSize(10)
    .text('No.', itemCodeX, tableTop)
    .text('Product', descX, tableTop)
    .text('Qty', qtyX, tableTop)
    .text('Price', priceX, tableTop)
    .text('Total', totalX, tableTop);

 // let i = 0;
  let productY = tableTop + 25;

  order.orderedItems.forEach((item,i) => {
    const productTotal = item.quantity * item.price;
    i++;
    doc
      .fontSize(10)
      .text(i, itemCodeX, productY)
      .text(item.productName, descX, productY)
      .text(item.quantity, qtyX, productY)
      .text(`Rs. ${item.price} `, priceX, productY)
      .text(`Rs. ${productTotal} `, totalX, productY);

    productY += 20;
  });

  // ---------- TOTALS ----------
  doc
    .fontSize(10)
    .text(`Total Quantity: ${order.totalQuantity}`, 350, productY + 20)
    .text(`Subtotal: Rs. ${order.totalPrice} `, 350, productY + 35)
    .text(`Shipping: Rs. ${order.shippingCharge} `, 350, productY + 50)
    .text(`Grand Total: Rs. ${order.finalAmount} `, 350, productY + 65)
    .font('Helvetica-Bold')
    .text(`Amount Paid: Rs. ${order.finalAmount} `, 350, productY + 80);

  // ---------- FOOTER ----------
  doc
    .fontSize(10)
    .text('Thank you for shopping with CubeCraze!', 50, productY + 120)
    .text('Return Policy: Returns are accepted within 7 days of delivery in original condition.', 50, productY + 135, { width: 500 });

  doc.end();
}

module.exports = generateInvoice;
