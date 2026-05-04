import { Link } from 'react-router-dom'
import './Features.css'

export default function Features() {
  const featureDetails = [
    {
      id: 'party-management',
      title: 'Manage Party & Pending Balance',
      desc: 'Keep a comprehensive record of all your clients (parties). Easily track their details, vehicle history, and monitor outstanding pending balances in real-time from a centralized dashboard.',
      icon: '👥',
      color: 'purple'
    },
    {
      id: 'billing',
      title: 'Create Bills for Party',
      desc: 'Generate professional bills and invoices for your clients with just a few clicks. Maintain a clear ledger of all transactions and share invoices directly with parties.',
      icon: '🧾',
      color: 'blue'
    },
    {
      id: 'expiry-alerts',
      title: 'Expiry Alerts for Party',
      desc: 'Never miss a renewal date. Get proactive alerts for upcoming expirations of Fitness, Permit, Tax, and PUC documents, organized by priority.',
      icon: '⏰',
      color: 'amber'
    },
    {
      id: 'whatsapp-automation',
      title: 'Automated WhatsApp Messages',
      desc: 'Save time and improve client communication. The system automatically sends personalized WhatsApp reminders to parties before their documents expire.',
      icon: '💬',
      color: 'green'
    },
    {
      id: 'ai-entry',
      title: 'Automatic Entry Using AI',
      desc: 'Eliminate manual data entry errors. Upload a document or click a photo, and our advanced AI instantly extracts and fills in the vehicle details.',
      icon: '🤖',
      color: 'teal'
    },
    {
      id: 'balance-alerts',
      title: 'Pending Balance Alerts',
      desc: 'Stay on top of your finances. Receive automated alerts for parties with overdue balances, helping you follow up and manage cash flow effectively.',
      icon: '💳',
      color: 'rose'
    }
  ]

  return (
    <>
      {/* PAGE HERO */}
      <section className="page-hero">
        <div className="page-hero-bg">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
        </div>
        <div className="container">
          <div className="page-hero-content">
            <div className="hero-badge">Powerful Capabilities</div>
            <h1 className="hero-title">Features of <span className="gradient-text">RTO Sarthi</span></h1>
            <p className="hero-description">
              Discover the comprehensive suite of tools designed to automate your workflow, manage clients, and grow your RTO agency.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES DETAIL SECTION */}
      <section className="features-detail-section">
        <div className="container">
          <div className="features-list">
            {featureDetails.map((feat, index) => (
              <div key={feat.id} className={`feature-row ${index % 2 !== 0 ? 'reverse' : ''}`}>
                <div className="feature-content">
                  <div className={`feature-icon-large ${feat.color}`}>
                    {feat.icon}
                  </div>
                  <h2 className="feature-heading">{feat.title}</h2>
                  <p className="feature-body">{feat.desc}</p>
                  <ul className="feature-bullets">
                    <li><span className="bullet-check">✓</span> Time-saving automation</li>
                    <li><span className="bullet-check">✓</span> Easy-to-use interface</li>
                    <li><span className="bullet-check">✓</span> Secure data management</li>
                  </ul>
                </div>
                <div className="feature-image-placeholder">
                  <div className={`mockup-window ${feat.color}-theme`}>
                    <div className="mockup-header-sm">
                      <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                    </div>
                    <div className="mockup-body-placeholder">
                      <div className="mockup-icon">{feat.icon}</div>
                      <div className="mockup-text">{feat.title} Dashboard View</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-glow"></div>
            <h2 className="cta-title">Ready to experience these features?</h2>
            <p className="cta-desc">Get in touch with us and see how RTO Sarthi can transform your agency.</p>
            <div className="cta-actions">
              <Link to="/contact" className="btn btn-white">Contact Us</Link>
              <Link to="/" className="btn btn-outline-white">Back to Home</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
