import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Contact.css'

export default function Contact() {
  const [formStatus, setFormStatus] = useState('idle') // idle, submitting, success

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormStatus('submitting')
    // Simulate form submission
    setTimeout(() => {
      setFormStatus('success')
    }, 1200)
  }

  return (
    <>
      <section className="page-hero">
        <div className="page-hero-bg">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
        </div>
        <div className="container">
          <div className="page-hero-content">
            <div className="hero-badge">Get In Touch</div>
            <h1 className="hero-title">Contact <span className="gradient-text">RTO Sarthi</span></h1>
            <p className="hero-description">
              Have questions about RTO Sarthi? Want a demo or to get started? We're just a call or message away.
            </p>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            
            {/* Contact Info */}
            <div className="contact-info">
              <h2 className="section-title-sm">Reach Us Anytime</h2>
              <p className="contact-intro">Our team is available to help you understand how RTO Sarthi can work for your agency. Reach out through any of the channels below.</p>

              <div className="contact-cards">
                <a href="tel:6264682508" className="contact-card">
                  <div className="cc-icon purple">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                  </div>
                  <div className="cc-info">
                    <span className="cc-label">Call Us (Primary)</span>
                    <span className="cc-value">+91 62646 82508</span>
                  </div>
                  <div className="cc-arrow">→</div>
                </a>

                <a href="tel:9202469725" className="contact-card">
                  <div className="cc-icon blue">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                  </div>
                  <div className="cc-info">
                    <span className="cc-label">Call Us (Alternate)</span>
                    <span className="cc-value">+91 92024 69725</span>
                  </div>
                  <div className="cc-arrow">→</div>
                </a>

                <a href="mailto:softwarebytesindia@gmail.com" className="contact-card">
                  <div className="cc-icon green">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div className="cc-info">
                    <span className="cc-label">Email Us</span>
                    <span className="cc-value">softwarebytesindia@gmail.com</span>
                  </div>
                  <div className="cc-arrow">→</div>
                </a>

                <a href="https://wa.me/916264682508" target="_blank" rel="noopener noreferrer" className="contact-card whatsapp-card">
                  <div className="cc-icon wa-green">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.61 12.61 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="cc-info">
                    <span className="cc-label">WhatsApp Us</span>
                    <span className="cc-value">Chat with us on WhatsApp</span>
                  </div>
                  <div className="cc-arrow">→</div>
                </a>
              </div>

              <div className="office-info">
                <div className="office-label">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>
                  Office
                </div>
                <p><strong>SoftwareBytes</strong><br/>Raipur, Chhattisgarh, India</p>
                <a href="https://softwarebytes.in" target="_blank" rel="noopener noreferrer" className="office-website">
                  🌐 softwarebytes.in
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-wrap">
              <div className="contact-form-card">
                <h3>Send us a Message</h3>
                <p>Fill out the form below and we'll get back to you within 24 hours.</p>
                {formStatus === 'success' ? (
                  <div className="form-success">
                    ✅ Thank you! We'll contact you soon.
                  </div>
                ) : (
                  <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="name">Your Name</label>
                        <input type="text" id="name" name="name" placeholder="e.g. Ramesh Kumar" required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="phone">Phone Number</label>
                        <input type="tel" id="phone" name="phone" placeholder="e.g. 9876543210" required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input type="email" id="email" name="email" placeholder="you@example.com" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="subject">Subject</label>
                      <select id="subject" name="subject">
                        <option value="">Select a topic</option>
                        <option>I want a demo of RTO Sarthi</option>
                        <option>Pricing & Plans</option>
                        <option>Technical Support</option>
                        <option>Partnership Enquiry</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="message">Message</label>
                      <textarea id="message" name="message" rows="5" placeholder="Tell us more about your requirements..."></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary form-submit" disabled={formStatus === 'submitting'}>
                      {formStatus === 'submitting' ? 'Sending...' : (
                        <>
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
