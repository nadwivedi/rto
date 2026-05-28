/**
 * pdfToImages.js
 *
 * Converts PDF pages to JPEG base64 images using PDF.js.
 * Works for both text-based PDFs and scanned/image-based PDFs.
 * The resulting images can be sent to the vision OCR model.
 */
import * as pdfjsLib from 'pdfjs-dist';

// Configure the PDF.js worker using unpkg CDN to ensure it works reliably in production (VPS) without Vite path resolution issues.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '5.7.284'}/build/pdf.worker.min.mjs`;

/**
 * Render the first `maxPages` pages of a PDF to JPEG base64 strings.
 *
 * @param {File} pdfFile - The PDF File object from an <input>
 * @param {number} maxPages - How many pages to render (default 2)
 * @param {number} scale   - Render scale; 2 = ~144 DPI, good for OCR
 * @param {number} quality - JPEG quality 0–1 (default 0.88)
 * @returns {Promise<string[]>} Array of data:image/jpeg;base64,... strings
 */
export async function pdfToImages(pdfFile, maxPages = 2, scale = 2, quality = 0.88) {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pagesToProcess = Math.min(pdf.numPages, maxPages);
  const images = [];

  for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    images.push(canvas.toDataURL('image/jpeg', quality));
  }

  return images;
}
