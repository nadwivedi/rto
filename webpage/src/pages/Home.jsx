import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import './Home.css'

const features = [
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>
    ),
    color: 'purple',
    title: 'Expiry Alerts Dashboard',
    desc: 'Real-time overview of all upcoming and expired Fitness, Permit, Tax, and PUC records — sorted by urgency.',
    tags: ['Fitness', 'Permit', 'Tax', 'PUC'],
    tagClass: '',
  },
  {
    icon: (
      <svg width="28" height="28" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.61 12.61 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      </svg>
    ),
    color: 'green',
    title: 'Automatic WhatsApp Reminders',
    desc: 'Send personalized WhatsApp messages to parties automatically when documents are about to expire — zero manual effort.',
    tags: ['Automated', 'WhatsApp'],
    tagClass: 'green-tag',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
        <circle cx="12" cy="13" r="3"/>
      </svg>
    ),
    color: 'blue',
    title: 'Auto Entry via Photo / PDF',
    desc: 'Click a photo of RC or upload a PDF document and let RTO Sarthi automatically extract and fill vehicle details.',
    tags: ['Photo Scan', 'PDF Upload', 'OCR'],
    tagClass: 'blue-tag',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
    color: 'amber',
    title: 'Party Management',
    desc: 'Maintain a complete database of clients. Track contact details, vehicle history, and all service records in one place.',
    tags: ['Clients', 'History'],
    tagClass: 'amber-tag',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    color: 'rose',
    title: 'Pending Balance Tracking',
    desc: 'Never lose track of payments. See all parties with outstanding dues on your dashboard and mark them paid in one click.',
    tags: ['Payments', 'Due Alerts'],
    tagClass: 'rose-tag',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
    color: 'teal',
    title: 'Reports & Export',
    desc: 'Generate detailed reports for any period. Export vehicle data, expiry lists, and payment summaries instantly.',
    tags: ['PDF Reports', 'Export'],
    tagClass: 'teal-tag',
  },
]

export default function Home() {
  return (
    <>
      <SEO 
        title="Smart RTO Agent Software"
        description="RTO Sarthi is the ultimate AI-powered software for RTO agents. Track document expiry, send automated WhatsApp reminders, and manage your party ledgers all in one intuitive dashboard."
        url="/"
        keywords="rto agent software, rto software india, whatsapp rto reminder, rto pending balance software, vehicle expiry tracker"
      />
      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Trusted by RTO Agents across India
            </div>
            <h1 className="hero-title">
              The Smartest Way to<br/>
              <span className="gradient-text">Manage RTO Work</span>
            </h1>
            <p className="hero-description">
              RTO Sarthi is a powerful all-in-one software built for RTO agents. Track expiry dates, send automatic WhatsApp reminders, manage party ledgers, and capture vehicle data instantly — all from one dashboard.
            </p>
            <div className="hero-actions">
              <Link to="/contact" className="btn btn-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Get Started Free
              </Link>
              <a href="#features" className="btn btn-ghost">Explore Features</a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-num">5+</span>
                <span className="stat-label">Modules</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-num">100%</span>
                <span className="stat-label">Automated Alerts</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-num">0</span>
                <span className="stat-label">Missed Renewals</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="dashboard-mockup">
              <div className="mockup-header">
                <div className="mockup-dots"><span></span><span></span><span></span></div>
                <span className="mockup-title">RTO Sarthi Dashboard</span>
              </div>
              <div className="mockup-cards">
                {[
                  { c: 'blue', icon: '🚗', num: '128', label: 'Total Vehicles' },
                  { c: 'yellow', icon: '⏰', num: '14', label: 'Expiring Soon' },
                  { c: 'red', icon: '❗', num: '3', label: 'Expired' },
                  { c: 'green', icon: '💰', num: '₹4.2k', label: 'Pending Balance' },
                ].map(s => (
                  <div key={s.label} className={`mockup-stat-card ${s.c}`}>
                    <div className="mockup-stat-icon">{s.icon}</div>
                    <div className="mockup-stat-info">
                      <span className="msi-num">{s.num}</span>
                      <span className="msi-label">{s.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mockup-alert">
                <div className="alert-icon">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.61 12.61 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  </svg>
                </div>
                <div className="alert-content">
                  <span className="alert-title">WhatsApp Reminder Sent</span>
                  <span className="alert-sub">MH12AB1234 – Fitness expiring in 5 days</span>
                </div>
                <span className="alert-badge">Auto</span>
              </div>
            </div>
            <div className="floating-badge fb1">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Auto Entry via Photo
            </div>
            <div className="floating-badge fb2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              Smart Alerts
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Everything an RTO Agent Needs</h2>
            <p className="section-desc">A comprehensive platform designed to eliminate manual tracking and reduce errors.</p>
          </div>
          <div className="features-grid">
            {features.map(f => (
              <div key={f.title} className="feature-card">
                <div className={`feature-icon ${f.color}`}>{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
                <div className="feature-tags">
                  {f.tags.map(t => <span key={t} className={`tag ${f.tagClass}`}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">How It Works</span>
            <h2 className="section-title">Simple, Fast, Powerful</h2>
            <p className="section-desc">Get up and running in minutes. No technical knowledge required.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Add Parties & Vehicles</h3>
              <p>Register your clients and their vehicles. Upload RC or click a photo for instant auto-fill.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Track Expiry Dates</h3>
              <p>Add fitness, permit, tax, and PUC details. The system monitors expiry dates automatically.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Automated Reminders</h3>
              <p>RTO Sarthi sends WhatsApp reminders to parties before documents expire — no manual effort needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-glow"></div>
            <h2 className="cta-title">Ready to transform your RTO work?</h2>
            <p className="cta-desc">Join RTO agents who are already saving hours every day with RTO Sarthi.</p>
            <div className="cta-actions">
              <Link to="/contact" className="btn btn-white">Contact Us Today</Link>
              <Link to="/about" className="btn btn-outline-white">Learn More</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
