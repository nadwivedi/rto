const fs = require('fs');
const pdfParse = require('pdf-parse');

async function extract() {
  const buffer = fs.readFileSync('C:\\Users\\Naray\\Downloads\\HR98J8747 (New Policy).pdf');
  const pdfData = await pdfParse(buffer);
  fs.writeFileSync('C:\\Users\\Naray\\OneDrive\\Desktop\\code\\rto2\\extracted_pdf_text.txt', pdfData.text);
  console.log("PDF text extracted to extracted_pdf_text.txt. Total length:", pdfData.text.length);
}

extract().catch(console.error);
