const adminModel = require("../../model/adminModel");
const userSchema = require("../../model/userModel");
const categorySchema = require("../../model/categoryModel");
const productSchema = require("../../model/productModel");
const orderSchema = require("../../model/orderModel");
const offerSchama = require("../../model/offerModel");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const loadSales = async (req, res) => {
  const now = new Date();
  const startDate = new Date(now.setDate(now.getDate() - 30));
  const endDate = new Date();

  console.log(startDate, endDate);

  const filter = {
    status: { $nin: ['Cancelled', 'Returned'] },
    orderDate: { $gte: startDate, $lte: endDate },
  };

  try {
    const orders = await orderSchema
      .find(filter)
      .populate("products.productId");

    let totalAmount = orders.reduce(
      (total, ord) => (total += ord.totalPrice),
      0
    );
    let totalDiscount = orders.reduce((total, ord) => {
      if (ord.couponDiscount !== undefined) {
        return (total += ord.couponDiscount);
      }
      return total;
    }, 0);

    const totalSales = orders.length;

    res.render("admin/salesReport", {
      defaultReport: {
        orders,
        totalSales,
        totalAmount,
        totalDiscount,
      },
    });
  } catch (error) {
    console.error("Error generating default sales report:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const salesreport = async (req, res) => {
  console.log("Received sales report request:", req.body);

  try {
    const { frequency, startDate, endDate } = req.body;
    let filter = {status: { $nin: ['Cancelled', 'Returned'] },};

    console.log(startDate, endDate);

    if (frequency === "custom" && startDate && endDate) {
      filter.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
      console.log(filter);
    } else if (frequency === "daily") {
      const today = new Date();
      filter.orderDate = {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lte: new Date(),
      };
    } else if (frequency === "weekly") {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      filter.orderDate = {
        $gte: startOfWeek,
        $lte: new Date(),
      };
    } else if (frequency === "monthly") {
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      );
      filter.orderDate = {
        $gte: startOfMonth,
        $lte: new Date(),
      };
    }

    const orders = await orderSchema.find(filter);

    console.log(orders);

    const totalSales = orders.length;
    const totalAmount = orders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );
    const totalDiscount = orders.reduce(
      (sum, order) =>
        sum + (order.couponDiscount || 0) + (order.offerDiscount || 0),
      0
    );

    res.json({
      totalSales,
      totalAmount,
      totalDiscount,
      orders,
    });
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res.status(500).json({ error: "Failed to fetch sales report" });
  }
};

const downloadSalesreport = async (req, res) => {
  const { format } = req.params;
  const { frequency, startDate, endDate } = req.body;

  console.log("Body: ", req.body);

  try {
    let filter = {
        status: { $nin: ['Cancelled', 'Returned'] },
    };

    if (frequency === 'custom' && startDate && endDate) {
        filter.orderDate = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        };
    } else if (frequency === 'daily') {
        const today = new Date();
        filter.orderDate = {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lte: new Date(),
        };
    } else if (frequency === 'weekly') {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        filter.orderDate = {
            $gte: startOfWeek,
            $lte: new Date(),
        };
    } else if (frequency === 'monthly') {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        filter.orderDate = {
            $gte: startOfMonth,
            $lte: new Date(),
        };
    }
    
    const orders = await orderSchema.find(filter).populate('customer').populate('products.productId');
      

    const totalSales = orders.length;
    const totalAmount = orders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0
    );
    const totalDiscount = orders.reduce(
      (sum, order) =>
        sum + (order.couponDiscount || 0) + (order.offerDiscount || 0),
      0
    );

    const reportData = {
      totalSales,
      totalAmount,
      totalDiscount,
      orders,
    };

    console.log("Eew", reportData.totalAmount);

    if (format === "pdf") {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="sales-report.pdf"'
      );

      const padText = (text, width) => {
        text = String(text);
        return text.length < width
          ? text + " ".repeat(width - text.length)
          : text.slice(0, width);
      };

      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const columnWidths = {
        date: Math.floor(pageWidth * 0.15),
        orderId: Math.floor(pageWidth * 0.05),
        customerName: Math.floor(pageWidth * 0.2),
        totalAmount: Math.floor(pageWidth * 0.15),
        couponDiscount: Math.floor(pageWidth * 0.15),
        offerDiscount: Math.floor(pageWidth * 0.15),
      };

      const renderRow = (columns, isHeader = false) => {
        doc.font(isHeader ? "Courier-Bold" : "Courier").fontSize(10);
        columns.forEach((col, index) => {
          doc.text(padText(col.text, col.width), col.x, col.y, {
            continued: index < columns.length - 1,
          });
        });
        doc.text("\n");
      };

      doc.fontSize(20).text("Sales Report", { align: "center" }).moveDown();

      doc
        .fontSize(12)
        .text(`Total Sales: ${reportData.totalSales}`)
        .text(`Total Amount: ${reportData.totalAmount.toFixed(2)}`)
        .text(`Total Discount: ${reportData.totalDiscount.toFixed(2)}`)
        .moveDown();

      renderRow(
        [
          { text: "Date", width: columnWidths.date, x: 20, y: doc.y },
          {
            text: "OrderId",
            width: columnWidths.orderId,
            x: 25 + columnWidths.date,
            y: doc.y,
          },
          {
            text: "Customer ",
            width: columnWidths.customerName,
            x: 100 + columnWidths.date + columnWidths.orderId,
            y: doc.y,
          },
          {
            text: "Total ",
            width: columnWidths.totalAmount,
            x:
              70 +
              columnWidths.date +
              columnWidths.orderId +
              columnWidths.customerName,
            y: doc.y,
          },
          {
            text: "Coupon ",
            width: columnWidths.couponDiscount,
            x:
              75 +
              columnWidths.date +
              columnWidths.orderId +
              columnWidths.customerName +
              columnWidths.totalAmount,
            y: doc.y,
          },
          {
            text: "Offer ",
            width: columnWidths.offerDiscount,
            x:
              70 +
              columnWidths.date +
              columnWidths.orderId +
              columnWidths.customerName +
              columnWidths.totalAmount +
              columnWidths.couponDiscount,
            y: doc.y,
          },
        ],
        true
      );

      reportData.orders.forEach((order) => {
        renderRow([
          {
            text: new Date(order.orderDate).toLocaleDateString(),
            width: columnWidths.date,
            x: 20,
            y: doc.y,
          },
          {
            text: String(order._id).slice(0, 8),
            width: columnWidths.orderId,
            x: 25 + columnWidths.date,
            y: doc.y,
          },

          {
            text: order.customer?.userName || "N/A",
            width: columnWidths.customerName,
            x: 100 + columnWidths.date + columnWidths.orderId,
            y: doc.y,
          },
          {
            text: `${order.totalPrice.toFixed(2)}`,
            width: columnWidths.totalAmount,
            x:
              70 +
              columnWidths.date +
              columnWidths.orderId +
              columnWidths.customerName,
            y: doc.y,
          },
          {
            text: `${(order.couponDiscount || 0).toFixed(2)}`,
            width: columnWidths.couponDiscount,
            x:
              75 +
              columnWidths.date +
              columnWidths.orderId +
              columnWidths.customerName +
              columnWidths.totalAmount,
            y: doc.y,
          },
          {
            text: `₹${(order.offerDiscount || 0).toFixed(2)}`,
            width: columnWidths.offerDiscount,
            x:
              70 +
              columnWidths.date +
              columnWidths.orderId +
              columnWidths.customerName +
              columnWidths.totalAmount +
              columnWidths.couponDiscount,
            y: doc.y,
          },
        ]);
      });

      doc.end();
      doc.pipe(res);
    }

       else if (format === "xlxs") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");

      worksheet.addRow([
        "Date",
        "Order ID",
        "Customer Name",
        "Total Amount",
        "Coupon Discount",
        "Offer Discount",
      ]);
      reportData.orders.forEach((order) => {
        worksheet.addRow([
          new Date(order.orderDate).toLocaleDateString(),
          order._id,
          order.customer?.userName || "N/A",
          order.totalPrice,
          order.couponDiscount,
          order.offerDiscount,
        ]);
      });

      worksheet.addRow([]);
      worksheet.addRow([
        "Total",
        "",
        "",
        reportData.totalAmount,
        reportData.totalDiscount,
      ]);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="sales-report.xlsx"'
      );

      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(400).json({ message: "Invalid format" });
    }
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({ error: "Failed to generate sales report" });
  }
};

module.exports = {
  loadSales,
  salesreport,
  downloadSalesreport,
};
