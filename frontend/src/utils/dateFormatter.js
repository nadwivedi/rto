/**
 * Date Formatting Utilities
 *
 * This utility provides automatic date formatting with dash insertion
 * for DD-MM-YYYY format. Use this in all date input fields across the app.
 */

/**
 * Smart date input handler with real-time validation, auto-padding, and auto-dash insertion
 *
 * Features:
 * - Auto-pads single digits: 5 → 05 (for day/month when they can't exceed 3x or 1x)
 * - Prevents invalid input: day max 31, month max 12
 * - Auto-dash insertion: 22 → 22-, 2212 → 22-12-
 * - Auto-year expansion: 221223 → 22-12-2023 (except for "20")
 * - Allows natural editing and deletion
 *
 * @param {string} value - The new input value
 * @param {string} oldValue - The previous input value (for detecting deletion)
 * @returns {string|null} - Formatted date string, or null if input should be rejected
 *
 * @example
 * // In your handleChange function:
 * const handleChange = (e) => {
 *   const { name, value } = e.target
 *   if (name === 'validFrom' || name === 'validTo') {
 *     const formatted = handleSmartDateInput(value, formData[name])
 *     if (formatted !== null) {
 *       setFormData(prev => ({ ...prev, [name]: formatted }))
 *     }
 *     return
 *   }
 * }
 */
export const handleSmartDateInput = (value, oldValue = '') => {
  // If user is deleting (new value is shorter), just clean and allow it
  if (value.length < oldValue.length) {
    return value.replace(/[^\d-]/g, '').slice(0, 10)
  }

  // Remove non-digits for validation
  let digitsOnly = value.replace(/[^\d]/g, '')

  // Validate and cap day (first 2 digits)
  if (digitsOnly.length >= 1) {
    const firstDigit = parseInt(digitsOnly[0], 10)
    // If first digit is 4-9, auto-pad with 0 (e.g., 5 → 05, 6 → 06)
    // because day can't be 40+, 50+, etc.
    if (firstDigit >= 4 && digitsOnly.length === 1) {
      digitsOnly = '0' + digitsOnly
    }
    // If first digit > 3, don't allow it (day can't start with 4-9 unless auto-padded)
    else if (firstDigit > 3) {
      return null // Reject input
    }
  }

  if (digitsOnly.length >= 2) {
    const day = parseInt(digitsOnly.slice(0, 2), 10)
    // If day > 31, auto-correct to 31 (e.g., 38 → 31, 44 → 31)
    if (day > 31) {
      digitsOnly = '31' + digitsOnly.slice(2)
    }
    // If day is 00, auto-correct to 01
    else if (day === 0) {
      digitsOnly = '01' + digitsOnly.slice(2)
    }
  }

  // Validate and cap month (digits 3-4)
  if (digitsOnly.length >= 3) {
    const monthFirstDigit = parseInt(digitsOnly[2], 10)
    // If first digit of month is 2-9, auto-pad with 0 (e.g., 5 → 05)
    // because month can't be 20+, 30+, etc.
    if (monthFirstDigit >= 2 && digitsOnly.length === 3) {
      digitsOnly = digitsOnly.slice(0, 2) + '0' + digitsOnly[2] + digitsOnly.slice(3)
    }
    // If first digit of month > 1, don't allow it (month can only start with 0 or 1)
    else if (monthFirstDigit > 1) {
      return null // Reject input
    }
  }

  if (digitsOnly.length >= 4) {
    const month = parseInt(digitsOnly.slice(2, 4), 10)
    // If month > 12, auto-correct to 12 (e.g., 13 → 12, 19 → 12)
    if (month > 12) {
      digitsOnly = digitsOnly.slice(0, 2) + '12' + digitsOnly.slice(4)
    }
    // If month is 00, auto-correct to 01
    else if (month === 0) {
      digitsOnly = digitsOnly.slice(0, 2) + '01' + digitsOnly.slice(4)
    }
  }

  // Limit to 8 digits total
  digitsOnly = digitsOnly.slice(0, 8)

  // Auto-expand 2-digit year to 4-digit (e.g., 23 → 2023, 24 → 2024)
  // Only expand when we have exactly 6 digits (DDMMYY)
  // Don't expand if year is "20" - let user continue typing manually (2002, 2012, etc.)
  if (digitsOnly.length === 6) {
    const yearPart = digitsOnly.slice(4, 6)
    if (yearPart !== '20') {
      const yearNum = parseInt(yearPart, 10)
      // Expand 2-digit year: 00-50 → 2000-2050, 51-99 → 1951-1999
      const fullYear = yearNum <= 50 ? 2000 + yearNum : 1900 + yearNum
      digitsOnly = digitsOnly.slice(0, 4) + String(fullYear)
    }
  }

  // Format with auto-dash insertion (add dash after 2nd and 4th digit)
  let formatted = ''
  for (let i = 0; i < digitsOnly.length; i++) {
    formatted += digitsOnly[i]
    // Add dash after 2nd digit (day) and after 4th digit (month)
    if (i === 1 || i === 3) {
      formatted += '-'
    }
  }

  return formatted
}

/**
 * Formats a date string with automatic dash insertion
 *
 * @param {string} value - The input value from the date field
 * @returns {string} - Formatted date string in DD-MM-YYYY format
 *
 * @example
 * formatDateInput('07')       // Returns: '07-'
 * formatDateInput('071')      // Returns: '07-1'
 * formatDateInput('0711')     // Returns: '07-11-'
 * formatDateInput('07112')    // Returns: '07-11-2'
 * formatDateInput('071125')   // Returns: '07-11-2025' (auto-expands 2-digit year)
 * formatDateInput('07112025') // Returns: '07-11-2025'
 */
export const formatDateInput = (value) => {
  // Remove all non-digit characters except dashes
  let cleaned = value.replace(/[^\d-]/g, '')

  // Remove existing dashes to reformat
  let digitsOnly = cleaned.replace(/-/g, '')

  // Limit to 8 digits (DDMMYYYY)
  digitsOnly = digitsOnly.slice(0, 8)

  // Auto-insert dashes: DD-MM-YYYY
  let formatted = digitsOnly

  // Format based on length
  if (digitsOnly.length <= 2) {
    // Just digits, or add dash immediately after 2nd digit
    formatted = digitsOnly
    if (digitsOnly.length === 2) {
      formatted = digitsOnly + '-'
    }
  } else if (digitsOnly.length <= 4) {
    // DD-MM format, add dash after 4th digit
    formatted = digitsOnly.slice(0, 2) + '-' + digitsOnly.slice(2)
    if (digitsOnly.length === 4) {
      formatted = digitsOnly.slice(0, 2) + '-' + digitsOnly.slice(2) + '-'
    }
  } else {
    // DD-MM-YYYY format (5+ digits)
    formatted = digitsOnly.slice(0, 2) + '-' + digitsOnly.slice(2, 4) + '-' + digitsOnly.slice(4)
  }

  // Auto-expand 2-digit year to 4-digit when complete (DDMMYY -> DDMMYYYY)
  if (digitsOnly.length === 6) {
    const day = digitsOnly.slice(0, 2)
    const month = digitsOnly.slice(2, 4)
    const year = digitsOnly.slice(4, 6)
    const yearNum = parseInt(year, 10)
    const fullYear = yearNum <= 50 ? 2000 + yearNum : 1900 + yearNum
    formatted = `${day}-${month}-${fullYear}`
  }

  return formatted
}

/**
 * Handles date input change with automatic formatting and auto-focus to next field
 *
 * Use this in your handleChange function for date fields
 *
 * @param {Event} e - The input change event
 * @param {Function} setFormData - The state setter function
 * @param {boolean} autoFocusNext - Whether to auto-focus next field when date is complete
 * @returns {boolean} - Returns true if handled, false otherwise
 *
 * @example
 * const handleChange = (e) => {
 *   if (handleDateInputChange(e, setFormData, true)) return
 *   // ... other field handling
 * }
 */
export const handleDateInputChange = (e, setFormData, autoFocusNext = true) => {
  const { name, value } = e.target

  // Only handle date fields
  const dateFields = ['validFrom', 'validTo', 'taxFrom', 'taxTo', 'issueDate', 'expiryDate',
                      'licenseIssueDate', 'licenseExpiryDate', 'learningLicenseIssueDate',
                      'learningLicenseExpiryDate', 'dateOfBirth', 'applicationDate']

  if (dateFields.includes(name)) {
    const formatted = formatDateInput(value)

    setFormData(prev => ({
      ...prev,
      [name]: formatted
    }))

    // Auto-focus to next field when date is complete (10 chars = DD-MM-YYYY)
    if (autoFocusNext && formatted.length === 10) {
      // Use setTimeout to ensure state update completes first
      setTimeout(() => {
        const form = e.target.form
        if (form) {
          const elements = Array.from(form.elements)
          const currentIndex = elements.indexOf(e.target)

          // Find next focusable input
          for (let i = currentIndex + 1; i < elements.length; i++) {
            const nextElement = elements[i]
            if (
              (nextElement.tagName === 'INPUT' || nextElement.tagName === 'SELECT' || nextElement.tagName === 'TEXTAREA') &&
              !nextElement.disabled &&
              !nextElement.readOnly &&
              nextElement.type !== 'hidden'
            ) {
              nextElement.focus()
              break
            }
          }
        }
      }, 0)
    }

    return true // Handled
  }

  return false // Not handled
}

/**
 * Validates if a date string is complete and valid
 *
 * @param {string} dateString - Date string in DD-MM-YYYY format
 * @returns {boolean} - True if date is valid
 *
 * @example
 * isValidDate('07-11-2025') // Returns: true
 * isValidDate('07-11')      // Returns: false
 * isValidDate('32-13-2025') // Returns: false
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false

  const parts = dateString.split('-')
  if (parts.length !== 3) return false

  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)

  // Basic validation
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false
  if (day < 1 || day > 31) return false
  if (month < 1 || month > 12) return false
  if (year < 1900 || year > 2100) return false

  // Check days in month
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day
}

/**
 * Converts 2-digit year to 4-digit year
 *
 * @param {string} yearStr - 2-digit year string
 * @returns {number} - 4-digit year
 *
 * @example
 * expandYear('25') // Returns: 2025
 * @example
 * expandYear('99') // Returns: 1999
 */
export const expandYear = (yearStr) => {
  const yearNum = parseInt(yearStr, 10)
  // 00-50 → 2000-2050, 51-99 → 1951-1999
  return yearNum <= 50 ? 2000 + yearNum : 1900 + yearNum
}

/**
 * Formats date on blur - handles 2-digit year expansion
 *
 * @param {Event} e - The blur event
 * @param {Function} setFormData - The state setter function
 *
 * @example
 * <input onBlur={(e) => handleDateBlur(e, setFormData)} />
 */
export const handleDateBlur = (e, setFormData) => {
  const { name, value } = e.target

  const parts = value.split('-')

  // Only format if we have a complete date with 3 parts
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    let year = parts[2]

    // Auto-expand 2-digit year to 4-digit (only when exactly 2 digits)
    if (year.length === 2 && /^\d{2}$/.test(year)) {
      year = expandYear(year)
    }

    // Normalize to DD-MM-YYYY format (if year is 4 digits or was expanded)
    if (year.toString().length === 4) {
      const formattedValue = `${day}-${month}-${year}`
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }))
    }
  }
}

/**
 * Gets today's date in DD-MM-YYYY format
 *
 * @returns {string} - Today's date formatted as DD-MM-YYYY
 *
 * @example
 * getTodayDate() // Returns: '07-11-2025'
 */
export const getTodayDate = () => {
  const today = new Date()
  const day = String(today.getDate()).padStart(2, '0')
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const year = today.getFullYear()
  return `${day}-${month}-${year}`
}

/**
 * Parses DD-MM-YYYY date string to Date object
 *
 * @param {string} dateString - Date string in DD-MM-YYYY format
 * @returns {Date|null} - Date object or null if invalid
 *
 * @example
 * parseDate('07-11-2025') // Returns: Date object
 */
export const parseDate = (dateString) => {
  if (!dateString) return null

  const parts = dateString.split(/[/-]/)
  if (parts.length !== 3) return null

  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
  const year = parseInt(parts[2], 10)

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null

  return new Date(year, month, day)
}

/**
 * Formats Date object to DD-MM-YYYY string
 *
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 *
 * @example
 * formatDateToString(new Date()) // Returns: '07-11-2025'
 */
export const formatDateToString = (date) => {
  if (!date || !(date instanceof Date)) return ''

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}

/**
 * Normalizes an AI extracted format like "01-Mar-2026" or "1 Mar 26" into strictly "01-03-2026".
 * Useful for filtering out conversational LLM date guesses before passing to handleSmartDateInput.
 */
export const normalizeAIExtractedDate = (dateStr) => {
  if (!dateStr) return '';
  
  // Look for exact pattern DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const exactMatch = String(dateStr).trim().match(/^(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})$/);
  if (exactMatch) {
    const day = exactMatch[1];
    const month = exactMatch[2];
    const year = exactMatch[3];
    return `${day}-${month}-${year}`;
  }

  const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
  const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  const parsedDate = new Date(dateStr);
  if (!Number.isNaN(parsedDate.getTime())) {
    return formatDateToString(parsedDate);
  }
  
  let str = String(dateStr).toLowerCase().replace(/[^a-z0-9]/g, ' ');
  let parts = str.split(/\s+/).filter(Boolean);

  if (parts.length >= 4 && weekdays.includes(parts[0])) {
    parts = parts.slice(1);
  }
  
  if (parts.length >= 3) {
     let day = parts[0];
     let month = parts[1];
     let year = parts[2];
     
     if (day.match(/[a-z]/)) {
       // if they said "Mar 01 2026"
       month = parts[0];
       day = parts[1];
       year = parts.find(part => /^\d{2,4}$/.test(part)) || parts[2];
     }
     
     // try to convert text month to number string
     const mKey = Object.keys(months).find(k => month.startsWith(k));
     if (mKey) {
         month = months[mKey];
     }

     day = day.replace(/\D/g, '').padStart(2, '0');
     month = month.replace(/\D/g, '').padStart(2, '0');
     year = year.replace(/\D/g, '');
     
     if (year.length === 2 && parseInt(year) > 0) {
         year = parseInt(year) <= 50 ? '20' + year : '19' + year;
     }

     return `${day}-${month}-${year}`;
  }
  
  // if we can't parse it clearly, just strip non-alphanumerics so smart input can handle it
  return String(dateStr).replace(/[^\d-]/g, '');
}
