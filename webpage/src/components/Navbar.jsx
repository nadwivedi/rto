import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="url(#lg1)"/>
              <path d="M8 14C8 10.686 10.686 8 14 8C17.314 8 20 10.686 20 14C20 17.314 17.314 20 14 20" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="14" cy="14" r="3" fill="white"/>
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-text">RTO <span className="logo-accent">Sarthi</span></span>
        </Link>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" end className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/about" className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>About</NavLink>
          <NavLink to="/features" className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Features</NavLink>
          <NavLink to="/contact" className={({isActive}) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Contact</NavLink>
          <Link to="/contact" className="nav-cta" onClick={() => setMenuOpen(false)}>Get Started</Link>
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
        </button>
      </div>
    </nav>
  )
}
