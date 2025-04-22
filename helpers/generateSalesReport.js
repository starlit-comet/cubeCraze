const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Order = require('../models/orderSchema');
const RESPONSE_CODES = require('../utils/StatusCodes');
const PDFDocument = require('pdfkit')

const generateExcelReport = async (fromDate, toDate, res) => {
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
            return res.status(RESPONSE_CODES.NOT_FOUND).json({ error: "No sales data found for the selected period." });
        }

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

        const workbook = XLSX.utils.book_new();

        // Create Sales Report Sheet
        const salesSheetData = [
            // Title row
            [`Sales Report - Generated on ${new Date().toLocaleString('en-IN')}`],
            [], // Empty row for spacing
            // Headers
            ['Order ID', 'Date', 'Customer', 'Email', 'Phone', 'Payment Method', 'Total Amount (Rs. )', 'Profit (Rs. )', 'Status']
        ].concat(reportData.map(row => [
            row.OrderID,
            row.Date,
            row.Customer,
            row.Email,
            row.Phone,
            row.PaymentMethod,
            row.TotalAmount,
          //  row.Discount,
            row.Profit,
            row.Status
        ]));

        const salesSheet = XLSX.utils.aoa_to_sheet(salesSheetData);

        // Apply styling to Sales Report Sheet
        const salesRange = XLSX.utils.decode_range(salesSheet['!ref']);
        for (let row = salesRange.s.r; row <= salesRange.e.r; row++) {
            for (let col = salesRange.s.c; col <= salesRange.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (!salesSheet[cellAddress]) continue;

                // Initialize cell style
                salesSheet[cellAddress].s = {
                    font: { name: 'Calibri', sz: 11 },
                    alignment: { vertical: 'center', horizontal: 'left', wrapText: true },
                    border: {
                        top: { style: 'thin' },
                        bottom: { style: 'thin' },
                        left: { style: 'thin' },
                        right: { style: 'thin' }
                    }
                };

                // Title row styling
                if (row === 0) {
                    salesSheet[cellAddress].s = {
                        font: { name: 'Calibri', sz: 14, bold: true },
                        alignment: { vertical: 'center', horizontal: 'center' },
                        fill: { fgColor: { rgb: 'eeeeef' } }
                    };
                }

                // Header row styling
                if (row === 2) {
                    salesSheet[cellAddress].s = {
                        font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '000000' } },
                        fill: { fgColor: { rgb: '1976D2' } },
                        alignment: { vertical: 'center', horizontal: 'center' },
                        border: {
                            top: { style: 'medium' },
                            bottom: { style: 'medium' },
                            left: { style: 'thin' },
                            right: { style: 'thin' }
                        }
                    };
                }

                // Alternating row colors
                if (row > 2) {
                    salesSheet[cellAddress].s.fill = {
                        fgColor: { rgb: row % 2 === 0 ? 'F5F5F5' : 'FFFFFF' }
                    };

                    // Currency formatting for TotalAmount, Discount, and Profit
                    if (col === 6 || col === 7 || col === 8) {
                        salesSheet[cellAddress].z = 'Rs. #,##0.00';
                    }
                }
            }
        }

        // Set column widths
        salesSheet['!cols'] = [
            { wch: 15 }, // Order ID
            { wch: 20 }, // Date
            { wch: 20 }, // Customer
            { wch: 25 }, // Email
            { wch: 15 }, // Phone
            { wch: 15 }, // Payment Method
            { wch: 15 }, // Total Amount
        //    { wch: 15 }, // Discount
            { wch: 15 }, // Profit
            { wch: 15 }  // Status
        ];

        // Freeze header row
        salesSheet['!freeze'] = 'A4';

        XLSX.utils.book_append_sheet(workbook, salesSheet, 'Sales Report');
        
        // Create Summary Sheet
        const summaryData = [
            ['Sales Summary Report'],
            [`Generated on ${new Date().toLocaleString('en-IN')}`],
            [],
            ['Metric', 'Value'],
            ['Total Orders', totalOrders],
            ['Total Sales Amount', `Rs. ${totalSales.toFixed(2)}`],
//['Total Discount Applied', `Rs. ${takenDiscount.toFixed(2)}`],
            ['Net Sales (After Discount)', `Rs. ${(totalSales - totalDiscount).toFixed(2)}`]
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

        // Apply styling to Summary Sheet
        const summaryRange = XLSX.utils.decode_range(summarySheet['!ref']);
        for (let row = summaryRange.s.r; row <= summaryRange.e.r; row++) {
            for (let col = summaryRange.s.c; col <= summaryRange.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (!summarySheet[cellAddress]) continue;

                summarySheet[cellAddress].s = {
                    font: { name: 'Calibri', sz: 11 },
                    alignment: { vertical: 'center', horizontal: col === 0 ? 'left' : 'right' },
                    border: {
                        top: { style: 'thin' },
                        bottom: { style: 'thin' },
                        left: { style: 'thin' },
                        right: { style: 'thin' }
                    }
                };

                // Title styling
                if (row === 0) {
                    summarySheet[cellAddress].s = {
                        font: { name: 'Calibri', sz: 14, bold: true },
                        alignment: { vertical: 'center', horizontal: 'center' },
                        fill: { fgColor: { rgb: 'FFC107' } }
                    };
                }

                // Header row styling
                if (row === 3) {
                    summarySheet[cellAddress].s = {
                        font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
                        fill: { fgColor: { rgb: '1976D2' } },
                        alignment: { vertical: 'center', horizontal: 'center' }
                    };
                }

                // Currency formatting
                if (row >= 5 && col === 1) {
                    summarySheet[cellAddress].z = 'Rs. #,##0.00';
                }
            }
        }

        // Set column widths for summary
        summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];

        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Sales Summary');

        const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        res.setHeader('Content-Disposition', `attachment; filename="Sales_Report_${Date.now()}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        return res.send(excelBuffer);

    } catch (error) {
        console.error("Excel Report Generation Error:", error);
        return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ error: "Error generating Excel report" });
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
            return res.status(RESPONSE_CODES.NOT_FOUND).json({ error: "No sales data found for the selected period." });
        }

        let totalSales = 0;
        let totalDiscount = 0;
        let totalOrders = orders.length;

        const doc = new PDFDocument({
            size: 'A4',
            margin: 20,
            info: {
                Title: 'Sales Report',
                Author: 'CUBE CRAZE',
                Subject: 'Sales Data Analysis'
            }
        });

        res.setHeader('Content-Disposition', `attachment; filename="Sales_Report_${Date.now()}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // Colors
        const primaryColor = '#1d76D2';
        const secondaryColor = '#b515a5';
        const textColor = '#000000';
        const tableRowColor1 = '#FFFFFF';
        const tableRowColor2 = '#F5F5F5';
        const borderColor = '#CCCCCC';

        // Header
        const drawHeader = () => {
            doc.rect(0, 0, doc.page.width, 80).fill(primaryColor);
            doc.fillColor('white')
               .fontSize(20)
               .font('Helvetica-Bold')
               .text('Sales Report', 50, 25);
            doc.fontSize(10)
               .font('Helvetica')
               .text(`Generated: ${new Date().toLocaleString('en-IN')}`, 50, 50);
            doc.text('CUBE CRAZEE', doc.page.width - 150, 25, { align: 'right' });
            doc.text('cubecrazee@gmail.com', doc.page.width - 150, 40, { align: 'right' });
            doc.moveDown();
        };

        // Page border
        const drawPageBorder = () => {
            doc.rect(40, 90, doc.page.width - 80, doc.page.height - 130)
               .lineWidth(0.3)
               .strokeColor(borderColor)
               .stroke();
        };

        // Draw header and border
        drawHeader();
        drawPageBorder();

        // Orders Table
        doc.moveTo(50, 100);
        const tableTop = 100;
        const itemWidth = [60, 80, 80, 100, 60, 60, 60]; // Adjusted for 7 columns
        const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Payment', 'Total (Rs. )', 'Status'];

        // Draw table headers
        let xPos = 50;
        doc.fillColor(textColor) // Dark text for headers
           .fontSize(10)
           .font('Helvetica-Bold');
        headers.forEach((header, i) => {
            doc.rect(xPos, tableTop, itemWidth[i], 30)
               .fill(tableRowColor1) // White background
               .strokeColor(borderColor)
               .lineWidth(0.5)
               .stroke();
            doc.text(header, xPos + 5, tableTop + 10, { width: itemWidth[i] - 10, align: 'center' });
            xPos += itemWidth[i];
        });

        // Draw table rows
        let yPos = tableTop + 30;
        orders.forEach((order, index) => {
            totalSales += order.finalAmount || 0;
            totalDiscount += order.discount || 0;

            const rowData = [
                order.orderId,
                new Date(order.createdOn).toLocaleString('en-IN', { dateStyle: 'short' }),
                order.userData?.name || "N/A",
                order.userData?.email || "N/A",
                //order.userData?.phone || "N/A",
                order.paymentMethod || "Unknown",
                order.finalAmount?.toFixed(2) || "0.00",
                // order.discount?.toFixed(2) || "0.00",
                // ((order.finalAmount || 0) - (order.discount || 0)).toFixed(2),
                order.status || "Unknown"
            ];

            xPos = 50;
            doc.fillColor(textColor)
               .fontSize(9)
               .font('Helvetica');
            rowData.forEach((data, i) => {
                doc.rect(xPos, yPos, itemWidth[i], 25)
                   .fill(index % 2 === 0 ? tableRowColor1 : tableRowColor2)
                   .strokeColor(borderColor)
                   .lineWidth(0.2)
                   .stroke();
                doc.fillColor(textColor)
                   .text(data, xPos + 5, yPos + 8, { width: itemWidth[i] - 10, align: i === 5 ? 'right' : 'left' });
                xPos += itemWidth[i];
            });

            yPos += 25;
            if (yPos > doc.page.height - 100) {
                doc.addPage();
                drawHeader();
                drawPageBorder();
                yPos = tableTop;
                xPos = 50;
                doc.fillColor(textColor)
                   .fontSize(10)
                   .font('Helvetica-Bold');
                headers.forEach((header, i) => {
                    doc.rect(xPos, tableTop, itemWidth[i], 30)
                       .fill(tableRowColor1) // White background for headers
                       .strokeColor(borderColor)
                       .lineWidth(0.5)
                       .stroke();
                    doc.text(header, xPos + 5, tableTop + 10, { width: itemWidth[i] - 10, align: 'center' });
                    xPos += itemWidth[i];
                });
                yPos = tableTop + 30;
            }
        });

        // Summary Section
        yPos += 30;
        if (yPos > doc.page.height - 200) {
            doc.addPage();
            drawHeader();
            drawPageBorder();
            yPos = 100;
        }

        doc.rect(50, yPos, doc.page.width - 100, 120)
           .fill(tableRowColor2)
           .strokeColor(primaryColor)
           .lineWidth(1)
           .stroke();

        doc.fillColor(textColor)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Sales Summary', 60, yPos + 10);

        const summaryData = [
            `Total Orders: ${totalOrders}`,
            `Total Sales Amount: Rs. ${totalSales.toFixed(2)}`,
            // `Total Discount Applied: Rs. ${totalDiscount.toFixed(2)}`,
            `Net Sales (After Discount): Rs. ${(totalSales - totalDiscount).toFixed(2)}`
        ];

        doc.fontSize(11)
           .font('Helvetica');
        summaryData.forEach((line, i) => {
            doc.text(line, 60, yPos + 35 + (i * 20));
        });

        // // Page numbers
        // const pageCount = doc.bufferedPageRange().count;
        // for (let i = 0; i < pageCount; i++) {
        //     doc.switchToPage(i);
        //     doc.fillColor(textColor)
        //        .fontSize(9)
        //        .text(`Page ${i + 1} of ${pageCount}`, doc.page.width - 100, doc.page.height - 40, { align: 'right' });
        // }

        doc.end();
    } catch (error) {
        console.error("PDF Report Generation Error:", error);
        return res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ error: "Error generating PDF report" });
    }
};





module.exports = {generateExcelReport,generatePDFReport};
