import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import './About.css'

export default function About() {
  return (
    <>
      <SEO 
        title="About Us | RTO Sarthi"
        description="Learn more about RTO Sarthi, India's best RTO agent software developed by SoftwareBytes. Discover how we use AI to streamline RTO workflows."
        url="/about"
        keywords="about rto sarthi, softwarebytes, rto software developers"
      />
      <section className="page-hero">
        <div className="page-hero-bg">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
        </div>
        <div className="container">
          <div className="page-hero-content">
            <div className="hero-badge">About RTO Sarthi</div>
            <h1 className="hero-title">Built for <span className="gradient-text">RTO Agents</span></h1>
            <p className="hero-description">We understand the challenges of managing an RTO agency. RTO Sarthi was born to solve them.</p>
          </div>
        </div>
      </section>

      <section className="about-main">
        <div className="container">
          <div className="about-grid">
            <div className="about-text">
              <span className="section-badge">Who We Are</span>
              <h2 className="section-title-sm">India's Best RTO Agent Software</h2>
              <p><strong>RTO Sarthi</strong> is India's most powerful and easy-to-use software solution built specifically for RTO agents. Developed in 2023, we have grown rapidly over the past 3 years to become the trusted choice for <strong>200+ clients</strong> across the country.</p>
              <p>Managing hundreds of vehicles, tracking expiry dates, following up with clients, and recording payments — it is a lot to handle manually. RTO Sarthi brings everything together in one intuitive platform, so you never miss a renewal and always stay ahead.</p>
              <p>We leverage <strong>AI technology</strong> to make your work faster and easier. From automatic WhatsApp reminders to AI-powered document scanning that auto-fills vehicle details, RTO Sarthi is engineered to reduce your daily workload and improve the service you provide to your clients.</p>
              <div className="about-values">
                {[
                  { title: 'Zero missed renewals', desc: 'Smart expiry tracking across Fitness, Permit, Tax & PUC' },
                  { title: 'Automated communications', desc: 'WhatsApp reminders sent on your behalf automatically' },
                  { title: 'AI-Powered data entry', desc: 'Capture vehicle data instantly from photos or PDFs using AI' },
                ].map(v => (
                  <div key={v.title} className="value-item">
                    <div className="value-icon">✓</div>
                    <div>
                      <strong>{v.title}</strong>
                      <p>{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="about-card-visual">
              {[
                { icon: '🚗', color: 'purple', title: 'Vehicle Tracking', desc: 'Manage unlimited vehicles for all your clients in one place.' },
                { icon: '📱', color: 'green', title: 'WhatsApp Automation', desc: 'Automated reminders for every expiring document — hands-free.' },
                { icon: '📄', color: 'blue', title: 'Instant Data Capture', desc: 'Upload a document or click a photo. We fill the rest.' },
                { icon: '💳', color: 'amber', title: 'Payment Tracking', desc: 'Track dues, mark payments, and view pending balances at a glance.' },
              ].map(c => (
                <div key={c.title} className="about-stat-card">
                  <div className={`asc-icon ${c.color}`}>{c.icon}</div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="developer-section">
        <div className="container">
          <div className="dev-card">
            <div className="dev-info">
              <span className="section-badge">Developed By</span>
              <h2 className="section-title-sm">SoftwareBytes</h2>
              <p>RTO Sarthi is proudly developed by <strong>SoftwareBytes</strong> — a dynamic IT company based in <strong>Raipur, Chhattisgarh</strong>. We specialize in building custom software solutions that solve real-world problems for businesses across India.</p>
              <p>Our team of passionate developers, designers, and business analysts work together to deliver technology that is not just functional, but transformative. RTO Sarthi is designed after deep research into the challenges faced by RTO agents every day.</p>
              <div className="dev-highlights">
                <div className="dev-highlight"><span className="dh-icon">🏢</span><span>Raipur, Chhattisgarh</span></div>
                <div className="dev-highlight"><span className="dh-icon">💡</span><span>Custom Software Solutions</span></div>
                <div className="dev-highlight"><span className="dh-icon">🇮🇳</span><span>Made in India</span></div>
              </div>
              <a href="https://softwarebytes.in" target="_blank" rel="noopener noreferrer" className="btn btn-primary dev-btn">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                Visit SoftwareBytes.in
              </a>
            </div>
            <div className="dev-logo-section">
              <div className="dev-logo-card">
                <div className="dev-logo-inner">
                  <svg width="64" height="64" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="14" fill="url(#devLg)"/>
                    <path d="M8 14C8 10.686 10.686 8 14 8C17.314 8 20 10.686 20 14C20 17.314 17.314 20 14 20" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
                    <circle cx="14" cy="14" r="3" fill="white"/>
                    <defs>
                      <linearGradient id="devLg" x1="0" y1="0" x2="28" y2="28">
                        <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="dev-logo-text">
                    <span className="dlp-name">SoftwareBytes</span>
                    <span className="dlp-location">Raipur, CG · India</span>
                  </div>
                </div>
                <p className="dev-quote">"We build software that makes businesses grow."</p>
                <a href="https://softwarebytes.in" target="_blank" rel="noopener noreferrer" className="dev-site-link">🌐 softwarebytes.in</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-glow"></div>
            <h2 className="cta-title">Ready to make your work easier?</h2>
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
