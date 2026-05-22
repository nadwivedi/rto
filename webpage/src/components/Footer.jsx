import { Link } from 'react-router-dom'
import Logo from './Logo'
import { container } from '../lib/styles'
import {
  EMAIL,
  PHONE_PRIMARY,
  PHONE_SECONDARY,
  phonePrimaryDisplay,
  phoneSecondaryDisplay,
} from '../data/contact'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200/80 bg-slate-100 py-9 text-slate-600 lg:py-10">
      <div className={container}>
        <div className="mb-7 grid gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div>
            <Link to="/" className="inline-block">
              <Logo showText={false} size="footer" />
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-slate-500 sm:text-[0.8125rem]">
              India&apos;s Best RTO Agent Software — built for agents, insurance partners, and PUC
              centers who need reliable expiry tracking and client management.
            </p>
          </div>

          <div>
            <h4 className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-800">
              Product
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-[0.8125rem]">
              <li>
                <Link to="/features" className="hover:text-brand-800">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-brand-800">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-800">
                  Pricing &amp; Demo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-800">
              Company
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-[0.8125rem]">
              <li>
                <Link to="/about" className="hover:text-brand-800">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-800">
                  Contact
                </Link>
              </li>
              <li>
                <a href="https://softwarebytes.in" target="_blank" rel="noopener noreferrer" className="hover:text-brand-800">
                  SoftwareBytes
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-800">
              Contact
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-[0.8125rem]">
              <li>
                <a href={`mailto:${EMAIL}`} className="hover:text-brand-800">
                  {EMAIL}
                </a>
              </li>
              <li>
                <a href={`tel:+91${PHONE_PRIMARY}`} className="hover:text-brand-800">
                  {phonePrimaryDisplay}
                </a>
              </li>
              <li>
                <a href={`tel:+91${PHONE_SECONDARY}`} className="hover:text-brand-800">
                  {phoneSecondaryDisplay}
                </a>
              </li>
              <li>Raipur, Chhattisgarh, India</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-5 text-center text-[0.6875rem] text-slate-500 sm:flex-row sm:justify-between sm:text-left sm:text-xs">
          <span>
            &copy; {year} RTO Sarthi. Developed by{' '}
            <a href="https://softwarebytes.in" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-800 hover:text-accent-600 hover:underline">
              SoftwareBytes
            </a>
            , Raipur.
          </span>
          <a href="https://rtosarthi.com" className="font-medium text-brand-800 hover:text-accent-600 hover:underline">
            RTOSarthi.com
          </a>
        </div>
      </div>
    </footer>
  )
}
