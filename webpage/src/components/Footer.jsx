import { Link } from 'react-router-dom'
import './Footer.css'

const Logo = () => (
  <Link to="/" className="nav-logo">
    <div className="logo-icon">
      <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="14" fill="url(#fLogo)"/>
        <path d="M8 14C8 10.686 10.686 8 14 8C17.314 8 20 10.686 20 14C20 17.314 17.314 20 14 20" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="14" cy="14" r="3" fill="white"/>
        <defs>
          <linearGradient id="fLogo" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
    <span className="logo-text">RTO <span className="logo-accent">Sarthi</span></span>
  </Link>
)

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo />
            <p className="footer-tagline">
              Smart software for smart RTO agents. Built with ❤️ by{' '}
              <a href="https://softwarebytes.in" target="_blank" rel="noopener noreferrer" className="footer-link">SoftwareBytes</a>.
            </p>
          </div>
          <div className="footer-links-col">
            <h4>Pages</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-links-col">
            <h4>Features</h4>
            <ul>
              <li><Link to="/features">Expiry Alerts</Link></li>
              <li><Link to="/features">WhatsApp Reminders</Link></li>
              <li><Link to="/features">Auto Document Entry</Link></li>
              <li><Link to="/features">Party Management</Link></li>
            </ul>
          </div>
          <div className="footer-links-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="tel:6264682508">📞 6264682508</a></li>
              <li><a href="tel:9202469725">📞 9202469725</a></li>
              <li><a href="mailto:softwarebytesindia@gmail.com">✉️ softwarebytesindia@gmail.com</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 RTO Sarthi. Developed by{' '}
            <a href="https://softwarebytes.in" target="_blank" rel="noopener noreferrer">SoftwareBytes</a>
            {' '}– Raipur, Chhattisgarh.</p>
        </div>
      </div>
    </footer>
  )
}
