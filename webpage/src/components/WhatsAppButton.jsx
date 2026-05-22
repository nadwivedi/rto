import { IconWhatsApp } from './Icons'
import { whatsappUrl } from '../data/contact'

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.45)] transition-transform hover:scale-105 hover:bg-[#20bd5a] active:scale-95 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 [&_svg]:h-6 [&_svg]:w-6 sm:[&_svg]:h-7 sm:[&_svg]:w-7"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
    >
      <IconWhatsApp />
    </a>
  )
}
