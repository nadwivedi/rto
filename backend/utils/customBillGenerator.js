const PDFDocument = require('pdfkit')
const path = require('path')
const fs = require('fs')

/**
 * Convert number to words (Indian numbering system)
 */
function numberToWords(num) {
  if (!num || num === 0) return 'Zero'

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

  function convertLessThanThousand(n) {
    if (n === 0) return ''
    if (n < 10) return ones[n]
    if (n < 20) return teens[n - 10]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '')
  }

  let word = ''
  let crore = Math.floor(num / 10000000)
  let lakh = Math.floor((num % 10000000) / 100000)
  let thousand = Math.floor((num % 100000) / 1000)
  let hundred = num % 1000

  if (crore > 0) word += convertLessThanThousand(crore) + ' Crore '
  if (lakh > 0) word += convertLessThanThousand(lakh) + ' Lakh '
  if (thousand > 0) word += convertLessThanThousand(thousand) + ' Thousand '
  if (hundred > 0) word += convertLessThanThousand(hundred)

  return word.trim()
}

/**
 * Generate PDF from custom bill data using PDFKit
 */
async function generateCustomBillPDF(customBill, userInfo) {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'bills')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const filename = `BILL-${String(customBill.billNumber).padStart(2, '0')}-${Date.now()}.pdf`
    const filepath = path.join(uploadsDir, filename)

    return new Promise((resolve, reject) => {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      })

      // Pipe to file
      const writeStream = fs.createWriteStream(filepath)
      doc.pipe(writeStream)

      const currentDate = customBill.billDate || new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })

      // Page dimensions
      const pageWidth = doc.page.width
      const leftMargin = 50
      const rightMargin = pageWidth - 50

      // Outer border
      doc.rect(20, 20, pageWidth - 40, doc.page.height - 40)
        .lineWidth(3)
        .strokeColor('#000000')
        .stroke()

      let yPos = 40

      // Header section
      // Bill badge
      doc.fontSize(10)
        .fillColor('#ffffff')
        .font('Helvetica-Bold')

      const badgeText = 'BILL / CASH MEMO'
      const badgeWidth = doc.widthOfString(badgeText) + 40
      const badgeX = (pageWidth - badgeWidth) / 2
      doc.roundedRect(badgeX, yPos, badgeWidth, 25, 12)
        .fillAndStroke('#2c3e50', '#2c3e50')

      doc.fillColor('#ffffff')
        .text(badgeText, badgeX, yPos + 8, {
          width: badgeWidth,
          align: 'center'
        })

      // Mobile numbers on the right
      doc.fontSize(8)
        .fillColor('#000000')
        .font('Helvetica-Bold')

      if (userInfo && userInfo.mobile1) {
        doc.text(`Mob.: ${userInfo.mobile1}`, rightMargin - 100, yPos, {
          width: 100,
          align: 'right'
        })
        if (userInfo.mobile2) {
          doc.text(`        ${userInfo.mobile2}`, rightMargin - 100, yPos + 12, {
            width: 100,
            align: 'right'
          })
        }
      }

      yPos += 40

      // Company name (use billName if available, otherwise fall back to name)
      const companyName = (userInfo && userInfo.billName ? userInfo.billName.toUpperCase() : (userInfo && userInfo.name ? userInfo.name.toUpperCase() : 'ASHOK KUMAR'))
      doc.fontSize(24)
        .fillColor('#000000')
        .font('Helvetica-BoldOblique')

      const nameHeight = doc.heightOfString(companyName, { width: pageWidth, align: 'center' })
      doc.text(companyName, 0, yPos, {
        width: pageWidth,
        align: 'center'
      })

      yPos += nameHeight + 6

      // Address (below bill name)
      doc.fontSize(11)
        .font('Helvetica')

      if (userInfo && userInfo.address) {
        doc.text(userInfo.address, 0, yPos, {
          width: pageWidth,
          align: 'center'
        })
        yPos += 15
      }

      // Subtitle (use billDescription if available, otherwise fall back to 'Transport Consultant')
      doc.fontSize(13)
        .font('Helvetica-Oblique')
        .text((userInfo && userInfo.billDescription ? `(${userInfo.billDescription})` : '(Transport Consultant)'), 0, yPos, {
          width: pageWidth,
          align: 'center'
        })

      yPos += 25

      // Email
      if (userInfo && userInfo.email) {
        doc.text(`Email : ${userInfo.email}`, 0, yPos, {
          width: pageWidth,
          align: 'center'
        })
      }

      yPos += 35

      // Bill info section
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('No.', leftMargin, yPos)

      doc.fontSize(18)
        .fillColor('#c0392b')
        .text(String(customBill.billNumber).padStart(2, '0'), leftMargin + 30, yPos - 2)

      doc.fontSize(11)
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text('Date', rightMargin - 180, yPos)

      // Date with underline
      const dateX = rightMargin - 130
      doc.font('Helvetica')
        .text(currentDate, dateX, yPos)

      doc.moveTo(dateX - 5, yPos + 12)
        .lineTo(dateX + 80, yPos + 12)
        .strokeColor('#000000')
        .lineWidth(1)
        .stroke()

      yPos += 35

      // Customer section with underline
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('M/s.', leftMargin, yPos)

      const customerNameX = leftMargin + 35
      doc.font('Helvetica')
        .text((customBill.customerName || '').toUpperCase(), customerNameX, yPos)

      // Customer underline
      doc.moveTo(customerNameX, yPos + 13)
        .lineTo(rightMargin, yPos + 13)
        .strokeColor('#000000')
        .lineWidth(1)
        .stroke()

      // Double line below customer
      yPos += 18
      doc.moveTo(leftMargin, yPos)
        .lineTo(rightMargin, yPos)
        .strokeColor('#000000')
        .lineWidth(2)
        .stroke()

      yPos += 15

      // Items table
      const tableTop = yPos
      const colX = {
        slNo: leftMargin,
        description: leftMargin + 40,
        qty: rightMargin - 200,
        rate: rightMargin - 130,
        amount: rightMargin - 70
      }

      // Calculate dynamic table height based on number of items
      const rowHeight = 60
      const headerHeight = 35
      const totalRowHeight = 35
      const numberOfItems = customBill.items && customBill.items.length > 0 ? customBill.items.length : 3
      const tableHeight = headerHeight + (numberOfItems * rowHeight) + totalRowHeight

      // Table outer border
      doc.rect(leftMargin, tableTop, rightMargin - leftMargin, tableHeight)
        .lineWidth(3)
        .strokeColor('#000000')
        .stroke()

      // Table header background
      doc.rect(leftMargin, tableTop, rightMargin - leftMargin, 35)
        .fillAndStroke('#ecf0f1', '#000000')

      // Table headers
      doc.fontSize(11)
        .fillColor('#000000')
        .font('Helvetica-Bold')

      doc.text('SI\nNo.', colX.slNo + 5, tableTop + 8, {
        width: 30,
        align: 'center'
      })

      doc.text('DESCRIPTION', colX.description + 10, tableTop + 13, {
        width: 260,
        align: 'center'
      })

      doc.text('Qty.', colX.qty + 5, tableTop + 13, {
        width: 50,
        align: 'center'
      })

      doc.text('Rate', colX.rate + 5, tableTop + 13, {
        width: 60,
        align: 'center'
      })

      doc.text('AMOUNT\nRs.', colX.amount, tableTop + 8, {
        width: 65,
        align: 'center'
      })

      // Horizontal line after header
      doc.moveTo(leftMargin, tableTop + 35)
        .lineTo(rightMargin, tableTop + 35)
        .strokeColor('#000000')
        .lineWidth(2)
        .stroke()

      // Vertical lines for columns
      const columnLines = [
        colX.slNo + 40,
        colX.qty,
        colX.rate,
        colX.amount
      ]

      columnLines.forEach(x => {
        doc.moveTo(x, tableTop)
          .lineTo(x, tableTop + tableHeight)
          .strokeColor('#000000')
          .lineWidth(2)
          .stroke()
      })

      // Add items
      let itemY = tableTop + 45

      doc.font('Helvetica')
        .fontSize(11)

      if (customBill.items && customBill.items.length > 0) {
        customBill.items.forEach((item, index) => {
          // SI No
          if (item.slNo) {
            doc.text(item.slNo.toString(), colX.slNo + 5, itemY, {
              width: 30,
              align: 'center'
            })
          }

          // Description (handle multiline)
          const description = (item.description || '').toUpperCase()
          doc.text(description, colX.description + 10, itemY, {
            width: 250,
            height: rowHeight - 10,
            align: 'left'
          })

          // Quantity
          if (item.quantity) {
            doc.text(item.quantity.toString(), colX.qty + 5, itemY, {
              width: 50,
              align: 'center'
            })
          }

          // Rate
          if (item.rate) {
            doc.text(item.rate.toLocaleString('en-IN'), colX.rate, itemY, {
              width: 60,
              align: 'center'
            })
          }

          // Amount
          if (item.amount) {
            doc.text(item.amount.toLocaleString('en-IN'), colX.amount, itemY, {
              width: 65,
              align: 'center'
            })
          }

          // Line separator between items
          if (index < customBill.items.length - 1) {
            itemY += rowHeight
            doc.moveTo(leftMargin, itemY - 5)
              .lineTo(rightMargin, itemY - 5)
              .strokeColor('#cccccc')
              .lineWidth(1)
              .stroke()
          }
        })
      }

      // Total row
      const totalRowY = tableTop + tableHeight - 35
      doc.rect(leftMargin, totalRowY, rightMargin - leftMargin, 35)
        .fillAndStroke('#f8f9fa', '#000000')

      doc.font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#000000')
        .text('TOTAL', colX.rate - 50, totalRowY + 12, {
          width: 110,
          align: 'right'
        })

      // Total amount - use Rs. instead of ₹ symbol
      const totalAmount = customBill.totalAmount ? customBill.totalAmount.toLocaleString('en-IN') : '0'
      doc.text(`Rs. ${totalAmount}`, colX.amount, totalRowY + 12, {
        width: 65,
        align: 'center'
      })

      yPos = tableTop + tableHeight + 25

      // Amount in words
      doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Rs', leftMargin, yPos)

      const amountInWords = (numberToWords(customBill.totalAmount) + ' Rupees Only').toUpperCase()
      const wordsX = leftMargin + 25

      // Draw underline first
      doc.moveTo(wordsX, yPos + 15)
        .lineTo(rightMargin, yPos + 15)
        .strokeColor('#000000')
        .lineWidth(1.5)
        .stroke()

      // Then draw text above the line
      doc.font('Helvetica')
        .text(amountInWords, wordsX, yPos)

      // Signature section
      yPos = doc.page.height - 130

      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text(`For, ${(userInfo && userInfo.name ? userInfo.name.toUpperCase() : 'ASHOK KUMAR')}`, rightMargin - 150, yPos, {
          width: 150,
          align: 'right'
        })

      // Finalize PDF
      doc.end()

      writeStream.on('finish', () => {
        resolve(`/uploads/bills/${filename}`)
      })

      writeStream.on('error', (error) => {
        reject(error)
      })
    })
  } catch (error) {
    console.error('Error generating custom bill PDF:', error)
    throw error
  }
}

/**
 * Generate unique custom bill number per user
 * Format: Simple sequential numbers (1, 2, 3, etc.)
 * Each user has their own sequence starting from 1
 */
async function generateCustomBillNumber(CustomBill, userId) {
  try {
    // Find the bill with the highest bill number for this specific user
    // Sort by billNumber in descending order to get the latest one
    const lastBill = await CustomBill.findOne({ userId })
      .sort({ billNumber: -1 })
      .select('billNumber')
      .lean()

    // If no bills exist for this user, start from 1
    if (!lastBill || !lastBill.billNumber) {
      return 1
    }

    // Increment the last bill number for this user
    const nextBillNumber = lastBill.billNumber + 1

    return nextBillNumber
  } catch (error) {
    console.error('Error generating custom bill number:', error)
    throw error
  }
}

module.exports = {
  generateCustomBillPDF,
  generateCustomBillNumber
}
