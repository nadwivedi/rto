import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const Form46Modal = ({ onClose }) => {
  const { user } = useAuth()
  const printRef = useRef()
  const inputRefs = useRef([])
  const [vehicleSearchNumber, setVehicleSearchNumber] = useState('')
  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')

  const [formData, setFormData] = useState({
    transportAuthorityLocation: '',
    stateName: '',
    applicantName: '',
    relation: '',
    address: '',
    regMark: '',
    yearOfManufacture: '',
    dateOfRegistration: '',
    engineNumber: '',
    chassisNumber: '',
    permitNumber: '',
    permitIssueDate: '',
    permitExpiryDate: '',
    unladenWeight: '',
    grossWeight: '',
    payLoad: '',
    periodFrom: '',
    periodTo: '',
    certificateEnclosed: '',
    bankDraft: '',
    date: '',
    statePayments: [
      { sno: '1', stateName: '', amountPaid: '', bankDraft: '', dateOfPayment: '' }
    ]
  })

  // Prefill RTO and State from logged-in user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        transportAuthorityLocation: user.rto || '',
        stateName: user.state || ''
      }))
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }))
  }

  const handleKeyDown = (e, currentIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const nextIndex = currentIndex + 1
      if (inputRefs.current[nextIndex]) {
        inputRefs.current[nextIndex].focus()
      }
    }
  }

  const handlePaymentChange = (index, field, value) => {
    const updatedPayments = [...formData.statePayments]
    updatedPayments[index][field] = value.toUpperCase()
    setFormData(prev => ({ ...prev, statePayments: updatedPayments }))
  }

  const addPaymentRow = () => {
    setFormData(prev => ({
      ...prev,
      statePayments: [
        ...prev.statePayments,
        {
          sno: (prev.statePayments.length + 1).toString(),
          stateName: '',
          amountPaid: '',
          bankDraft: '',
          dateOfPayment: ''
        }
      ]
    }))
  }

  const removePaymentRow = (index) => {
    if (formData.statePayments.length > 1) {
      const updatedPayments = formData.statePayments.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, statePayments: updatedPayments }))
    }
  }

  // Auto-fill vehicle details
  useEffect(() => {
    const fetchVehicleDetails = async () => {
      const searchInput = vehicleSearchNumber.trim()

      if (searchInput.length < 4) {
        setVehicleError('')
        return
      }

      setFetchingVehicle(true)
      setVehicleError('')

      try {
        const response = await axios.get(`${API_URL}/api/vehicle-registrations/search/${searchInput}`, {
          withCredentials: true
        })

        if (response.data.success) {
          const vehicleData = response.data.multiple ? response.data.data[0] : response.data.data

          setFormData(prev => ({
            ...prev,
            regMark: vehicleData.registrationNumber || prev.regMark,
            applicantName: vehicleData.ownerName || prev.applicantName,
            relation: vehicleData.sonWifeDaughterOf || prev.relation,
            address: vehicleData.address || prev.address,
            chassisNumber: vehicleData.chassisNumber || prev.chassisNumber,
            engineNumber: vehicleData.engineNumber || prev.engineNumber,
            unladenWeight: vehicleData.unladenWeight || prev.unladenWeight,
            grossWeight: vehicleData.ladenWeight || prev.grossWeight
          }))
          setVehicleError('')
        }
      } catch (error) {
        console.error('Error fetching vehicle details:', error)
        if (error.response && error.response.status === 404) {
          setVehicleError('No vehicles found')
        } else {
          setVehicleError('Error fetching vehicle details')
        }
      } finally {
        setFetchingVehicle(false)
      }
    }

    const timer = setTimeout(() => {
      if (vehicleSearchNumber.trim().length >= 4) {
        fetchVehicleDetails()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [vehicleSearchNumber])

  const handlePrint = (printEmpty = false) => {
    const printContent = printRef.current

    const inputs = printContent.querySelectorAll('input')
    const originalValues = []
    if (printEmpty) {
      inputs.forEach((input, i) => {
        originalValues[i] = input.value
        input.value = ''
      })
    }

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>FORM 46 - Tourist Permit or National Permit</title>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Roboto', 'Arial', sans-serif; font-size: 12px; line-height: 1.5; padding: 20px; }
            .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
            input, textarea {
              border: none !important;
              background: transparent;
              outline: none;
              width: 100%;
              font-family: 'Roboto', 'Arial', sans-serif;
              font-size: 12px;
              padding: 0 2px;
              font-weight: 500;
            }
            .no-print { display: none !important; }
            @media print {
              body { padding: 10mm; margin: 0; }
              @page {
                margin: 0;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)

    if (printEmpty) {
      inputs.forEach((input, i) => {
        input.value = originalValues[i]
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[70] overflow-y-auto pt-1 pb-2">
      <div className="flex gap-2 px-2">
        {/* Form Section */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
          .no-print { display: table-cell !important; }
          @media print {
            .no-print { display: none !important; }
            .form-content-wrapper { padding: 20mm !important; }
          }
        `}</style>
        <div
          ref={printRef}
          className="bg-white shadow-lg form-content-wrapper"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '10mm 20mm',
            fontFamily: "'Roboto', 'Arial', 'Helvetica', sans-serif",
            fontSize: '12px',
            lineHeight: '1.5'
          }}
        >
          <div className="form-container">
              {/* Title */}
              <div style={{textAlign: 'center', marginBottom: '20px'}}>
                <h1 style={{fontSize: '24px', fontWeight: '700', letterSpacing: '3px', marginBottom: '4px', fontFamily: "'Roboto', 'Arial', sans-serif"}}>FORM 46</h1>
                <p style={{fontSize: '13px', marginTop: '2px', marginBottom: '4px', fontFamily: "'Roboto', 'Arial', sans-serif"}}>See Rule (83) (1) and 87 (1)</p>
                <h2 style={{fontSize: '15px', fontWeight: '500', marginTop: '2px', fontFamily: "'Roboto', 'Arial', sans-serif"}}>Form of application for grant of authorisation</h2>
                <h2 style={{fontSize: '15px', fontWeight: '500', fontFamily: "'Roboto', 'Arial', sans-serif"}}>tourist Permit or National Permit</h2>
              </div>

              {/* To Section */}
              <div style={{marginBottom: '15px'}}>
                <p>To,</p>
                <div style={{display: 'flex', marginTop: '4px'}}>
                  <span style={{width: '48px', flexShrink: 0}}></span>
                  <div style={{flex: 1}}>
                    <p style={{marginBottom: '4px'}}>The Regional / State Transport Authority</p>
                    <div style={{borderBottom: '2px solid #000', minHeight: '16px', width: '252px'}}>
                      <input
                        ref={(el) => inputRefs.current[0] = el}
                        type="text"
                        name="transportAuthorityLocation"
                        value={formData.transportAuthorityLocation}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 0)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Intro */}
              <div style={{marginBottom: '15px', lineHeight: '1.6'}}>
                <p>I/We the undersigned hereby by apply for grant of authorisation valid throughout the territory</p>
                <div style={{display: 'flex', alignItems: 'baseline', marginTop: '4px'}}>
                  <span>of India/ in the state of</span>
                  <div style={{flex: 1, borderBottom: '2px solid #000', marginLeft: '8px', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[1] = el}
                      type="text"
                      name="stateName"
                      value={formData.stateName}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 1)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                    />
                  </div>
                </div>
              </div>

              {/* Section Title */}
              <p style={{textAlign: 'center', fontWeight: 'bold', marginBottom: '12px'}}>(Specify the name of the State)</p>

              {/* Field 1 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>1.</span>
                <span style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>Name of the applicants in full</span>
                <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[2] = el}
                    type="text"
                    name="applicantName"
                    value={formData.applicantName}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 2)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                  />
                </div>
              </div>

              {/* Field 2 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>2.</span>
                <span style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>Son/ Wife/ Daughter of</span>
                <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[3] = el}
                    type="text"
                    name="relation"
                    value={formData.relation}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 3)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                  />
                </div>
              </div>

              {/* Field 3 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>3.</span>
                <span style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>Address</span>
                <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[4] = el}
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 4)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                  />
                </div>
              </div>

              {/* Field 4 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>4.</span>
                <div style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>
                  <div>Registration mark & year of manufacture</div>
                  <div>& date of registration of the motor vehicle</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[5] = el}
                    type="text"
                    name="regMark"
                    value={formData.regMark}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 5)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                  />
                </div>
              </div>

              {/* Field 5 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>5.</span>
                <span style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>Engine number of the motor vehicle</span>
                <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[6] = el}
                    type="text"
                    name="engineNumber"
                    value={formData.engineNumber}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 6)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                  />
                </div>
              </div>

              {/* Field 6 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>6.</span>
                <span style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>Chassis number of the motor vehicle</span>
                <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[7] = el}
                    type="text"
                    name="chassisNumber"
                    value={formData.chassisNumber}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 7)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                  />
                </div>
              </div>

              {/* Field 7 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>7.</span>
                <div style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>
                  <div>Permit number of the authority who has</div>
                  <div>issued the permit and date of issue and</div>
                  <div>date of expiry of the permit</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[8] = el}
                    type="text"
                    name="permitNumber"
                    value={formData.permitNumber}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 8)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                  />
                </div>
              </div>

              {/* Field 8 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>8.</span>
                <span style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>Unladen weight of the motor vehicle</span>
                <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[9] = el}
                    type="text"
                    name="unladenWeight"
                    value={formData.unladenWeight}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 9)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                  />
                </div>
              </div>

              {/* Field 9 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>9.</span>
                <div style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>
                  <div>Gross vehicle weight of the motor</div>
                  <div>vehicle</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[10] = el}
                    type="text"
                    name="grossWeight"
                    value={formData.grossWeight}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 10)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                  />
                </div>
              </div>

              {/* Field 10 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>10.</span>
                <div style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>
                  <div>Pay load of the motor vehicle seating</div>
                  <div>capacity in the case of tourist vehicle</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[11] = el}
                    type="text"
                    name="payLoad"
                    value={formData.payLoad}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 11)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                  />
                </div>
              </div>

              {/* Field 11 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>11.</span>
                <div style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>
                  <div>Period for which the authorisation </div>
                  <div>is sought from</div>
                </div>
                <div style={{flex: 1, display: 'flex', alignItems: 'baseline', gap: '10px'}}>
                  <span>From</span>
                  <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[12] = el}
                      type="text"
                      name="periodFrom"
                      value={formData.periodFrom}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 12)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                    />
                  </div>
                  <span>To</span>
                  <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[13] = el}
                      type="text"
                      name="periodTo"
                      value={formData.periodTo}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 13)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                    />
                  </div>
                </div>
              </div>

              {/* Field 12 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>12.</span>
                <div style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>
                  <div>I/We enclosed the certificate of</div>
                  <div>registration & permit of the vehicle</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[14] = el}
                    type="text"
                    name="certificateEnclosed"
                    value={formData.certificateEnclosed}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 14)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                  />
                </div>
              </div>

              {/* Field 13 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>13.</span>
                <div style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>
                  <div>I/We enclosed Bank draft as</div>
                  <div>manufactured hereunder toward payment</div>
                  <div>of the authorisation.</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[15] = el}
                    type="text"
                    name="bankDraft"
                    value={formData.bankDraft}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 15)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                  />
                </div>
              </div>

              {/* Payment Table */}
              <table style={{width: '100%', borderCollapse: 'collapse', border: '2px solid #000', margin: '10px 0'}}>
                <thead>
                  <tr>
                    <th style={{border: '2px solid #000', padding: '6px', textAlign: 'center', width: '60px', fontSize: '11px', fontWeight: 'bold'}}>S.No.<br/>1</th>
                    <th style={{border: '2px solid #000', padding: '6px', textAlign: 'center', width: '180px', fontSize: '11px', fontWeight: 'bold'}}>Name of the State<br/>2</th>
                    <th style={{border: '2px solid #000', padding: '6px', textAlign: 'center', width: '110px', fontSize: '11px', fontWeight: 'bold'}}>Amount Paid<br/>3</th>
                    <th style={{border: '2px solid #000', padding: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold'}}>Particulars of Bank<br/>Draft & Date</th>
                    <th style={{border: '2px solid #000', padding: '6px', textAlign: 'center', width: '110px', fontSize: '11px', fontWeight: 'bold'}}>Date of<br/>Payment<br/>5</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{border: '2px solid #000', padding: '15px 8px', textAlign: 'center', fontSize: '11px', height: '80px', verticalAlign: 'top'}}>1</td>
                    <td style={{border: '2px solid #000', padding: '15px 8px', fontSize: '11px', height: '80px'}}>
                      <textarea
                        value={formData.statePayments[0].stateName}
                        onChange={(e) => handlePaymentChange(0, 'stateName', e.target.value)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', height: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '11px', textTransform: 'uppercase', resize: 'none', fontWeight: '500'}}
                      />
                    </td>
                    <td style={{border: '2px solid #000', padding: '15px 8px', fontSize: '11px', height: '80px'}}>
                      <textarea
                        value={formData.statePayments[0].amountPaid}
                        onChange={(e) => handlePaymentChange(0, 'amountPaid', e.target.value)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', height: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '11px', textTransform: 'uppercase', resize: 'none', fontWeight: '500'}}
                      />
                    </td>
                    <td style={{border: '2px solid #000', padding: '15px 8px', fontSize: '11px', height: '80px'}}>
                      <textarea
                        value={formData.statePayments[0].bankDraft}
                        onChange={(e) => handlePaymentChange(0, 'bankDraft', e.target.value)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', height: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '11px', textTransform: 'uppercase', resize: 'none', fontWeight: '500'}}
                      />
                    </td>
                    <td style={{border: '2px solid #000', padding: '15px 8px', fontSize: '11px', height: '80px'}}>
                      <textarea
                        value={formData.statePayments[0].dateOfPayment}
                        onChange={(e) => handlePaymentChange(0, 'dateOfPayment', e.target.value)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', height: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '11px', textTransform: 'uppercase', resize: 'none', fontWeight: '500'}}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Footer */}
              <div style={{marginTop: '10px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                  <div style={{display: 'flex', alignItems: 'baseline', marginTop: '44px'}}>
                    <span>Date</span>
                    <div style={{borderBottom: '2px solid #000', marginLeft: '16px', width: '150px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[16] = el}
                        type="text"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 16)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Roboto', 'Arial', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                      />
                    </div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{borderBottom: '2px solid #000', marginBottom: '4px', width: '200px', height: '40px'}}></div>
                    <p style={{fontSize: '11px', fontWeight: 'bold'}}>Signature of thumb impression</p>
                    <p style={{fontSize: '11px', fontWeight: 'bold'}}>of the applicant</p>
                  </div>
                </div>
                <p style={{fontSize: '10px', fontStyle: 'italic', marginTop: '2px'}}>Strike out whichever is inapplicable</p>
              </div>
          </div>
        </div>

        {/* Buttons Section on Right */}
        <div className="w-52 flex-shrink-0">
          <div className="sticky top-1 bg-white rounded-xl shadow-2xl p-4 space-y-3 border border-gray-200">
            <div className="text-center mb-2">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Actions</h3>
            </div>
            <button
              onClick={onClose}
              className="w-full text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-sm font-semibold py-2 flex items-center justify-center rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              title="Close"
            >
              ✕ Close
            </button>
            <div className="border-t border-gray-200 my-2"></div>

            {/* Auto-fill Vehicle Section */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">Auto-Fill</label>
              <input
                type="text"
                placeholder="Vehicle Number"
                value={vehicleSearchNumber}
                onChange={(e) => setVehicleSearchNumber(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 font-semibold uppercase"
              />
              {fetchingVehicle && (
                <p className="text-xs text-blue-600">Searching...</p>
              )}
              {vehicleError && (
                <p className="text-xs text-red-600">{vehicleError}</p>
              )}
              {!fetchingVehicle && !vehicleError && vehicleSearchNumber.trim().length >= 4 && formData.regMark && (
                <p className="text-xs text-green-600">✓ Data loaded</p>
              )}
            </div>

            <div className="border-t border-gray-200 my-2"></div>
            <button
              onClick={() => handlePrint(true)}
              className="w-full px-3 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              title="Print Empty Form"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Print Empty</span>
              </div>
            </button>
            <button
              onClick={() => handlePrint(false)}
              className="w-full px-3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              title="Print Filled Form"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Filled</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Form46Modal
