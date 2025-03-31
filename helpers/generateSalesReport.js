const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Order = require('../models/orderSchema'); // Ensure the correct path to your Order model
const PDFDocument= require('pdfkit')
const generateExcelReport = async (fromDate, toDate, res) => {
    try {
        let filter = {};

        // Apply date filter only if fromDate and toDate are provided
        if (fromDate && toDate) {
            filter.createdOn = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }

        // Fetch sales data
        const orders = await Order.find(filter).populate('orderedItems.product');

        if (orders.length === 0) {
            return res.status(404).json({ error: "No sales data found for the selected period." });
        }

        // Prepare data for the sales report
        let totalSales = 0;
        let totalDiscount = 0;
        let totalOrders = orders.length;

        const reportData = orders.map(order => {
            totalSales += order.finalAmount || 0;
            totalDiscount += order.discount || 0;

            return {
                OrderID: order.orderId,
                Date: new Date(order.createdOn).toLocaleString('en-IN'),
                Customer: order.userData?.name || "N/A",
                Email: order.userData?.email || "N/A",
                Phone: order.userData?.phone || "N/A",
                PaymentMethod: order.paymentMethod || "Unknown",
                TotalAmount: order.finalAmount || 0,
                Discount: order.discount || 0,
                Profit: (order.finalAmount || 0) - (order.discount || 0),
                Status: order.status || "Unknown"
            };
        });

        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Create Sales Report Sheet
        const salesSheet = XLSX.utils.json_to_sheet(reportData);
        XLSX.utils.book_append_sheet(workbook, salesSheet, 'Sales Report');

        // Create Summary Sheet
        const summaryData = [
            ["Sales Summary"],
            ["Total Orders", totalOrders],
            ["Total Sales Amount", `₹${totalSales.toFixed(2)}`],
            ["Total Discount Applied", `₹${totalDiscount.toFixed(2)}`],
            ["Net Sales (After Discount)", `₹${(totalSales - totalDiscount).toFixed(2)}`]
        ];
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Sales Summary');

        // Convert workbook to a buffer (in-memory file)
        const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="Sales_Report_${Date.now()}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Send file as response
        return res.send(excelBuffer);

    } catch (error) {
        console.error("Excel Report Generation Error:", error);
        return res.status(500).json({ error: "Error generating Excel report" });
    }
};

const generatePDFReport = async (fromDate, toDate, res) => {
    try {
        let filter = {};

        if (fromDate && toDate) {
            filter.createdOn = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            };
        }

        const orders = await Order.find(filter).populate('orderedItems.product');

        if (orders.length === 0) {
            return res.status(404).json({ error: "No sales data found for the selected period." });
        }

        let totalSales = 0;
        let totalDiscount = 0;
        let totalOrders = orders.length;

        const doc = new PDFDocument();
        res.setHeader('Content-Disposition', `attachment; filename="Sales_Report_${Date.now()}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        doc.fontSize(20).text('Sales Report', { align: 'center' });
        doc.moveDown();

        orders.forEach(order => {
            totalSales += order.finalAmount || 0;
            totalDiscount += order.discount || 0;

            doc.fontSize(12).text(`Order ID: ${order.orderId}`);
            doc.text(`Date: ${new Date(order.createdOn).toLocaleString('en-IN')}`);
            doc.text(`Customer: ${order.userData?.name || "N/A"}`);
            doc.text(`Email: ${order.userData?.email || "N/A"}`);
            doc.text(`Phone: ${order.userData?.phone || "N/A"}`);
            doc.text(`Payment Method: ${order.paymentMethod || "Unknown"}`);
            doc.text(`Total Amount: ₹${order.finalAmount || 0}`);
            doc.text(`Discount: ₹${order.discount || 0}`);
            doc.text(`Profit: ₹${(order.finalAmount || 0) - (order.discount || 0)}`);
            doc.text(`Status: ${order.status || "Unknown"}`);
            doc.moveDown();
        });

        doc.moveDown();
        doc.fontSize(16).text('Sales Summary', { underline: true });
        doc.moveDown();
        doc.text(`Total Orders: ${totalOrders}`);
        doc.text(`Total Sales Amount: ₹${totalSales.toFixed(2)}`);
        doc.text(`Total Discount Applied: ₹${totalDiscount.toFixed(2)}`);
        doc.text(`Net Sales (After Discount): ₹${(totalSales - totalDiscount).toFixed(2)}`);

        doc.end();
    } catch (error) {
        console.error("PDF Report Generation Error:", error);
        return res.status(500).json({ error: "Error generating PDF report" });
    }
};


module.exports = {generateExcelReport,generatePDFReport};
