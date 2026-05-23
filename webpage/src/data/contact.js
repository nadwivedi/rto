/** Shared contact details for RTO Sarthi */
export const WHATSAPP_NUMBER = '916264682508'
export const PHONE_PRIMARY = '6264682508'
export const PHONE_SECONDARY = '8602145864'
export const EMAIL = 'rtosarthi@gmail.com'

export const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello RTO Sarthi, I would like to know more about your software.')}`

export const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/rto-sarthi/',
  x: 'https://x.com/rtosarthi',
  instagram: 'https://www.instagram.com/rtosarthi/',
  facebook: 'https://www.facebook.com/rtosarthi',
}

export function formatPhone(digits) {
  const n = digits.replace(/\D/g, '')
  if (n.length === 10) {
    return `+91 ${n.slice(0, 5)} ${n.slice(5)}`
  }
  return `+91 ${n}`
}

export const phonePrimaryDisplay = formatPhone(PHONE_PRIMARY)
export const phoneSecondaryDisplay = formatPhone(PHONE_SECONDARY)
