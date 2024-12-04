const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(bodyParser.json());

// Ensure the folder exists
if (!fs.existsSync("./generated-invoices")) {
  fs.mkdirSync("./generated-invoices");
}

// Serve static files (HTML form)
app.use(express.static(path.join(__dirname, "public")));

// Endpoint to generate an invoice
app.post("/generate-invoice", async (req, res) => {
  const { customerName, items, totalAmount, invoiceDate } = req.body;

  // Validate input
  if (!customerName || !items || !totalAmount || !invoiceDate) {
    return res.status(400).json({ error: "Missing required fields!" });
  }

  try {
    // Generate unique file name
    const fileName = `invoice-${Date.now()}.pdf`;
    const filePath = `./generated-invoices/${fileName}`;

    // Create a PDF document
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Invoice header
    doc.fontSize(18).text("Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Customer Name: ${customerName}`);
    doc.text(`Date: ${invoiceDate}`);
    doc.text(`Total Amount: $${totalAmount}`);
    doc.moveDown();

    // Items table
    doc.text("Items:", { underline: true });
    items.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.name} - $${item.price} x ${item.quantity}`
      );
    });

    // Finalize PDF
    doc.end();

    // Respond with the download link
    writeStream.on("finish", () => {
      res.json({
        message: "Invoice generated successfully!",
        downloadUrl: `http://localhost:${
          process.env.PORT || 5000
        }/download/${fileName}`,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
});

// Allow all origins (for development purposes)
app.use(cors());

// Endpoint to serve generated invoices
app.get("/download/:fileName", (req, res) => {
  const { fileName } = req.params;
  const filePath = `./generated-invoices/${fileName}`;
  if (fs.existsSync(filePath)) {
    res.download(filePath); // Automatically prompts the file for download
  } else {
    res.status(404).json({ error: "Invoice not found" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
