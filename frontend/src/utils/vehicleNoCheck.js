/**
 * Vehicle Number Validation Utility
 * Validates vehicle number - only checks max 10 characters
 */

/**
 * Validates vehicle number
 * @param {string} vehicleNumber - Vehicle number to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber) {
    return { isValid: false, message: 'Vehicle number is required' }
  }

  const clean = vehicleNumber.trim().replace(/\s+/g, '').toUpperCase()

  if (clean.length > 10) {
    return {
      isValid: false,
      message: 'Vehicle number must be 10 characters or less'
    }
  }

  return { isValid: true, message: '' }
}

/**
 * Formats vehicle number with proper spacing
 * @param {string} vehicleNumber - Vehicle number to format
 * @returns {string} - Formatted vehicle number
 */
export const formatVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber) return ''

  const clean = vehicleNumber.trim().replace(/\s+/g, '').toUpperCase()

  if (clean.length === 10) {
    return `${clean.substring(0, 2)} ${clean.substring(2, 4)} ${clean.substring(4, 6)} ${clean.substring(6, 10)}`
  }

  if (clean.length === 9) {
    return `${clean.substring(0, 2)} ${clean.substring(2, 4)} ${clean.substring(4, 5)} ${clean.substring(5, 9)}`
  }

  if (clean.length === 8) {
    return `${clean.substring(0, 4)} ${clean.substring(4, 8)}`
  }

  if (clean.length === 7) {
    return `${clean.substring(0, 4)} ${clean.substring(4, 7)}`
  }

  return clean
}

/**
 * Cleans and returns vehicle number without spaces in uppercase
 * @param {string} vehicleNumber - Vehicle number to clean
 * @returns {string} - Cleaned vehicle number
 */
export const cleanVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber) return ''
  return vehicleNumber.trim().replace(/\s+/g, '').toUpperCase()
}

/**
 * Enforces vehicle number format as user types
 * @param {string} currentValue - Current input value
 * @param {string} newValue - New value being typed
 * @returns {string} - Uppercased, max 10 chars
 */
export const enforceVehicleNumberFormat = (currentValue, newValue) => {
  if (!newValue) return ''
  return newValue.toUpperCase().slice(0, 10)
}

/**
 * Real-time validation for input fields
 * @param {string} vehicleNumber - Vehicle number being typed
 * @returns {object} - { isValid: boolean, message: string, cleaned: string }
 */
export const validateVehicleNumberRealtime = (vehicleNumber) => {
  if (!vehicleNumber || vehicleNumber.trim() === '') {
    return { isValid: false, message: '', cleaned: '' }
  }

  const cleaned = cleanVehicleNumber(vehicleNumber)

  if (cleaned.length > 10) {
    return {
      isValid: false,
      message: 'Vehicle number must be 10 characters or less',
      cleaned
    }
  }

  return { isValid: true, message: '', cleaned }
}

/**
 * State code to State name mapping for Indian states and UTs
 */
const STATE_CODE_MAP = {
  'AN': 'Andaman and Nicobar Islands',
  'AP': 'Andhra Pradesh',
  'AR': 'Arunachal Pradesh',
  'AS': 'Assam',
  'BR': 'Bihar',
  'CH': 'Chandigarh',
  'CG': 'Chhattisgarh',
  'DD': 'Daman and Diu',
  'DL': 'Delhi',
  'DN': 'Dadra and Nagar Haveli',
  'GA': 'Goa',
  'GJ': 'Gujarat',
  'HP': 'Himachal Pradesh',
  'HR': 'Haryana',
  'JH': 'Jharkhand',
  'JK': 'Jammu and Kashmir',
  'KA': 'Karnataka',
  'KL': 'Kerala',
  'LA': 'Ladakh',
  'LD': 'Lakshadweep',
  'MH': 'Maharashtra',
  'ML': 'Meghalaya',
  'MN': 'Manipur',
  'MP': 'Madhya Pradesh',
  'MZ': 'Mizoram',
  'NL': 'Nagaland',
  'OD': 'Odisha',
  'OR': 'Odisha',
  'PB': 'Punjab',
  'PY': 'Puducherry',
  'RJ': 'Rajasthan',
  'SK': 'Sikkim',
  'TN': 'Tamil Nadu',
  'TR': 'Tripura',
  'TS': 'Telangana',
  'UK': 'Uttarakhand',
  'UP': 'Uttar Pradesh',
  'WB': 'West Bengal'
}

/**
 * Get state name from state code
 * @param {string} stateCode - Two letter state code
 * @returns {string} - Full state name or state code if not found
 */
export const getStateName = (stateCode) => {
  if (!stateCode) return ''
  const code = stateCode.toUpperCase()
  return STATE_CODE_MAP[code] || code
}

/**
 * Get vehicle number parts
 * @param {string} vehicleNumber - Vehicle number
 * @returns {object} - { stateCode, stateName, districtCode, series, number, last4Digits, rtoCode }
 */
export const parseVehicleNumber = (vehicleNumber) => {
  const cleaned = cleanVehicleNumber(vehicleNumber)

  if (cleaned.length < 7 || cleaned.length > 10) return null

  const validation = validateVehicleNumber(cleaned)
  if (!validation.isValid) return null

  const stateCode = cleaned.substring(0, 2)
  const districtCode = cleaned.substring(2, 4)

  let series, number

  if (cleaned.length === 10) {
    series = cleaned.substring(4, 6)
    number = cleaned.substring(6, 10)
  } else if (cleaned.length === 9) {
    series = cleaned.substring(4, 5)
    number = cleaned.substring(5, 9)
  } else {
    series = ''
    number = cleaned.substring(4)
  }

  return {
    stateCode,
    stateName: getStateName(stateCode),
    districtCode,
    rtoCode: `${stateCode}${districtCode}`,
    series,
    number,
    last4Digits: number.slice(-4),
    fullNumber: cleaned
  }
}

/**
 * Get formatted parts for display with custom styling
 * @param {string} vehicleNumber - Vehicle number
 * @returns {object} - Parsed parts ready for custom display
 * @example
 * const parts = getVehicleNumberParts('CG04AA4793')
 * // Returns: {
 * //   stateCode: 'CG',
 * //   stateName: 'Chhattisgarh',
 * //   rtoCode: 'CG04',
 * //   series: 'AA',
 * //   last4Digits: '4793',
 * //   fullNumber: 'CG04AA4793'
 * // }
 */
export const getVehicleNumberParts = (vehicleNumber) => {
  return parseVehicleNumber(vehicleNumber)
}
