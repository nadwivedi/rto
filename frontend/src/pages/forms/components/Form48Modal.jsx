import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const Form48Modal = ({ onClose }) => {
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
    applicantStatus: '',
    fatherHusbandName: '',
    fullAddress: '',
    intendsToDrive: '',
    holdsHeavyLicense: '',
    licenseNumber: '',
    licenseDate: '',
    licenseValidity: '',
    licensingAuthority: '',
    registrationCertificate: '',
    otherPermitsDetails: '',
    nationalPermitsHeld: '',
    vehicleType: '',
    makeOfVehicle: '',
    convictionsDetails: '',
    certificateForwarded: '',
    declarationPlace: '',
    feePaid: '',
    date: ''
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
            applicantName: vehicleData.ownerName || prev.applicantName,
            fatherHusbandName: vehicleData.sonWifeDaughterOf || prev.fatherHusbandName,
            fullAddress: vehicleData.address || prev.fullAddress,
            registrationCertificate: vehicleData.registrationNumber || prev.registrationCertificate,
            makeOfVehicle: vehicleData.makerModel || prev.makeOfVehicle
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
          <title>FORM 48 - Application for National Permit</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.4; padding: 20px; font-weight: 500; }
            .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
            input {
              border: none !important;
              background: transparent;
              outline: none;
              width: 100%;
              font-family: Arial, Helvetica, sans-serif;
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
      <div className="w-full max-w-[1280px] flex gap-2 px-2">
        {/* Form Section */}
        <div className="flex-1 bg-gray-100 rounded-lg p-2">
          <style>{`
            .no-print { display: table-cell !important; }
            @media print {
              .no-print { display: none !important; }
            }
          `}</style>
          <div
            ref={printRef}
            className="bg-white shadow-lg mx-auto"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '20mm',
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: '12px',
              lineHeight: '1.4',
              fontWeight: '500'
            }}
          >
            <div className="form-container">
              {/* Title */}
              <div style={{textAlign: 'center', marginBottom: '15px'}}>
                <h1 style={{fontSize: '18px', fontWeight: 'bold', letterSpacing: '4px'}}>FORM 48</h1>
                <p style={{fontSize: '11px', marginTop: '3px'}}>[Refer Rule 86]</p>
                <h2 style={{fontSize: '13px', fontWeight: 'bold', marginTop: '5px'}}>APPLICATION FOR THE GRANT OF NATIONAL PERMIT</h2>
              </div>

              {/* To Section */}
              <div style={{marginBottom: '15px'}}>
                <p>To</p>
                <div style={{display: 'flex', marginTop: '4px', marginLeft: '48px'}}>
                  <div style={{width: '43%'}}>
                    <p style={{marginBottom: '4px'}}>The Regional/State Transport Authority,</p>
                    <div style={{borderBottom: '2px dotted #000', minHeight: '16px', width: '100%'}}>
                      <input
                        ref={(el) => inputRefs.current[0] = el}
                        type="text"
                        name="transportAuthorityLocation"
                        value={formData.transportAuthorityLocation}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 0)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Intro */}
              <div style={{marginBottom: '15px', lineHeight: '1.6'}}>
                <p>I/We the undersigned hereby apply for the grant of national permit valid</p>
                <div style={{display: 'flex', alignItems: 'baseline', marginTop: '4px'}}>
                  <span>throughout the territory of India/in the State of</span>
                  <div style={{flex: 1, borderBottom: '2px dotted #000', marginLeft: '8px', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[1] = el}
                      type="text"
                      name="stateName"
                      value={formData.stateName}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 1)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                    />
                  </div>
                </div>
                <p style={{fontSize: '10px', fontStyle: 'italic', marginTop: '2px'}}>(here write the names of the States desired)</p>
              </div>

              {/* Field 1 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>1.</span>
                <span style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>Name of the applicant(s) in full</span>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[2] = el}
                    type="text"
                    name="applicantName"
                    value={formData.applicantName}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 2)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 2 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>2.</span>
                <div style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>
                  <div>Status of the applicant, whether individual, company</div>
                  <div>or partnership firm, cooperative society, etc.</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[3] = el}
                    type="text"
                    name="applicantStatus"
                    value={formData.applicantStatus}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 3)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 3 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>3.</span>
                <div style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>
                  <div>Name of father or husband (in case of individual and in</div>
                  <div>case of company or firm the particulars of managing partner</div>
                  <div>or managing director, as the case may be)</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[4] = el}
                    type="text"
                    name="fatherHusbandName"
                    value={formData.fatherHusbandName}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 4)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 4 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>4.</span>
                <div style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>
                  <div>Full address (to be supported by attested copy of ration</div>
                  <div>card, electricity bill, etc. in case of individual or any other</div>
                  <div>valid documentary proof to the satisfaction of the State Trans-</div>
                  <div>port Authority/Regional Transport Authority and in case of</div>
                  <div>company or firm, the certified copy of the Memorandum of</div>
                  <div>Association or copy of the deed of partnership, as the case</div>
                  <div>may be)</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[5] = el}
                    type="text"
                    name="fullAddress"
                    value={formData.fullAddress}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 5)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 5 (a) */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>5.</span>
                <span style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>(a) Whether the applicant himself intends to drive the vehicle ?</span>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[6] = el}
                    type="text"
                    name="intendsToDrive"
                    value={formData.intendsToDrive}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 6)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 5 (b) (i) */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'end', marginLeft: '30px'}}>
                <div style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>
                  <div>(b) (i) If so, whether the applicant holds heavy</div>
                  <div style={{marginLeft: '48px'}}>passenger motor vehicle driving licence</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[7] = el}
                    type="text"
                    name="holdsHeavyLicense"
                    value={formData.holdsHeavyLicense}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 7)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 5 (b) (ii) */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline', marginLeft: '30px'}}>
                <div style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>
                  <div>(ii) The number, date and validity period of driving</div>
                  <div style={{marginLeft: '48px'}}>licence</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[8] = el}
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 8)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 5 (b) (iii) */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline', marginLeft: '30px'}}>
                <span style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>(iii) Name and address of the licensing authority</span>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[9] = el}
                    type="text"
                    name="licensingAuthority"
                    value={formData.licensingAuthority}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 9)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 6 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>6.</span>
                <div style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>
                  <div>Registration certificate along with the date of first registration,</div>
                  <div>insurance certificate number</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[10] = el}
                    type="text"
                    name="registrationCertificate"
                    value={formData.registrationCertificate}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 10)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 7 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>7.</span>
                <span style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>Details of other permits if held in respect of a particular vehicle</span>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[11] = el}
                    type="text"
                    name="otherPermitsDetails"
                    value={formData.otherPermitsDetails}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 11)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 8 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>8.</span>
                <span style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>Details of number of national permits held by the applicant</span>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[12] = el}
                    type="text"
                    name="nationalPermitsHeld"
                    value={formData.nationalPermitsHeld}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 12)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 9 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>9.</span>
                <div style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>
                  <div>Type of vehicle, whether two-axle truck or articulated vehicle</div>
                  <div>or multi-axle vehicle or tractor-trailer combination</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[13] = el}
                    type="text"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 13)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 10 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>10.</span>
                <span style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>Make of motor vehicle</span>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[14] = el}
                    type="text"
                    name="makeOfVehicle"
                    value={formData.makeOfVehicle}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 14)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 11 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>11.</span>
                <div style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>
                  <div>Particulars of convictions/suspensions/cancellation, if any,</div>
                  <div>during the past three years in respect of the vehicle/permit</div>
                  <div>held by the applicant(s)</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[15] = el}
                    type="text"
                    name="convictionsDetails"
                    value={formData.convictionsDetails}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 15)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 12 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>12.</span>
                <div style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>
                  <div>I/We forward herewith the certificate of registration of the</div>
                  <div>vehicle or I/We will produce the certificate of registration</div>
                  <div>of the vehicle before the permits are issued</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[16] = el}
                    type="text"
                    name="certificateForwarded"
                    value={formData.certificateForwarded}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 16)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 13 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>13.</span>
                <div style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>
                  <div>I/We hereby declare that the above statements are true and that</div>
                  <div>I/We am/are the resident(s) of this State having principal place</div>
                  <div>of business in this State at</div>
                </div>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[17] = el}
                    type="text"
                    name="declarationPlace"
                    value={formData.declarationPlace}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 17)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Field 14 */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'baseline'}}>
                <span style={{width: '30px', flexShrink: 0}}>14.</span>
                <span style={{width: '360px', flexShrink: 0, marginRight: '10px'}}>I/We have paid the fee of Rs.</span>
                <div style={{flex: 1, borderBottom: '2px dotted #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[18] = el}
                    type="text"
                    name="feePaid"
                    value={formData.feePaid}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 18)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{marginTop: '10px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'end'}}>
                  <div style={{display: 'flex', alignItems: 'baseline'}}>
                    <span>Date</span>
                    <div style={{borderBottom: '2px dotted #000', marginLeft: '16px', width: '150px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[19] = el}
                        type="text"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 19)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '500'}}
                      />
                    </div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{borderBottom: '2px dotted #000', marginBottom: '4px', width: '250px', height: '40px'}}></div>
                    <p style={{fontSize: '11px', fontWeight: 'normal'}}>Signature or thumb impression of the applicant</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Section on Right */}
        <div className="w-44 flex-shrink-0">
          <div className="sticky top-1 bg-white rounded-lg shadow-xl p-3 space-y-2">
            <button
              onClick={onClose}
              className="w-full text-gray-600 hover:text-gray-800 text-3xl font-bold h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all border-2 border-gray-300 hover:border-gray-400"
              title="Close"
            >
              ✕
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
              {!fetchingVehicle && !vehicleError && vehicleSearchNumber.trim().length >= 4 && formData.registrationCertificate && (
                <p className="text-xs text-green-600">✓ Data loaded</p>
              )}
            </div>

            <div className="border-t border-gray-200 my-2"></div>
            <button
              onClick={() => handlePrint(true)}
              className="w-full px-3 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-xs font-semibold shadow-md hover:shadow-lg transition-all"
              title="Print Empty Form"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">📄</span>
                <div className="leading-tight text-center">
                  <div>PRINT</div>
                  <div>EMPTY</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => handlePrint(false)}
              className="w-full px-3 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-semibold shadow-md hover:shadow-lg transition-all"
              title="Print Filled Form"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">🖨️</span>
                <div className="leading-tight text-center">
                  <div>PRINT</div>
                  <div>FILLED</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Form48Modal
