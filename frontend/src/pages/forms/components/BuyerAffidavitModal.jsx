import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const BuyerAffidavitModal = ({ onClose }) => {
  const { user } = useAuth()
  const printRef = useRef()
  const inputRefs = useRef([])
  const [vehicleSearchNumber, setVehicleSearchNumber] = useState('')
  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')

  const [formData, setFormData] = useState({
    courtName: 'Executive Magistrate / Notary Public',
    courtLocation: '',
    buyerName: '',
    buyerRelation: '',
    buyerResidence: '',
    buyerPO: '',
    buyerPS: '',
    buyerDistrict: '',
    buyerAPResidence: '',
    buyerAPPS: '',
    buyerAPDistrict: '',
    vehicleMake: '',
    vehicleNumber: '',
    engineNumber: '',
    chassisNumber: '',
    sellerName: '',
    sellerRelation: '',
    sellerResidence: '',
    sellerPS: '',
    sellerDistrict: '',
    sellerAPResidence: '',
    sellerAPPS: '',
    sellerAPDistrict: '',
    identifierName: '',
    date: new Date().toLocaleDateString('en-GB')
  })

  useEffect(() => {
    if (user?.rto) {
      setFormData(prev => ({
        ...prev,
        courtLocation: prev.courtLocation || user.rto,
        buyerDistrict: prev.buyerDistrict || user.rto,
        sellerDistrict: prev.sellerDistrict || user.rto
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
            vehicleNumber: vehicleData.registrationNumber || prev.vehicleNumber,
            vehicleMake: vehicleData.makerModel || vehicleData.maker || prev.vehicleMake,
            engineNumber: vehicleData.engineNumber || prev.engineNumber,
            chassisNumber: vehicleData.chassisNumber || prev.chassisNumber,
            sellerName: vehicleData.ownerName || prev.sellerName,
            sellerRelation: vehicleData.sonWifeDaughterOf || prev.sellerRelation,
            sellerResidence: vehicleData.address || prev.sellerResidence
          }))
          setVehicleError('')
        }
      } catch (error) {
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
          <title>AFFIDAVIT - Vehicle Purchase (क्रेता शपथ-पत्र)</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 14px;
              line-height: 1.7;
              padding: 25px;
              font-weight: 500;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
            input {
              border: none !important;
              background: transparent;
              outline: none;
              width: 100%;
              font-family: 'Times New Roman', Times, serif;
              font-size: 14px;
              padding: 0 2px;
              font-weight: bold;
              color: #000;
            }
            .no-print { display: none !important; }
            @media print {
              body { padding: 12mm; margin: 0; }
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

  const handleClear = () => {
    setFormData({
      courtName: 'Executive Magistrate / Notary Public',
      courtLocation: user?.rto || '',
      buyerName: '',
      buyerRelation: '',
      buyerResidence: '',
      buyerPO: '',
      buyerPS: '',
      buyerDistrict: user?.rto || '',
      buyerAPResidence: '',
      buyerAPPS: '',
      buyerAPDistrict: '',
      vehicleMake: '',
      vehicleNumber: '',
      engineNumber: '',
      chassisNumber: '',
      sellerName: '',
      sellerRelation: '',
      sellerResidence: '',
      sellerPS: '',
      sellerDistrict: user?.rto || '',
      sellerAPResidence: '',
      sellerAPPS: '',
      sellerAPDistrict: '',
      identifierName: '',
      date: new Date().toLocaleDateString('en-GB')
    })
    setVehicleSearchNumber('')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center z-[70] overflow-y-auto pt-2 pb-6 px-2">
      <div className="w-full max-w-[1280px] flex flex-col lg:flex-row gap-4">
        {/* Form Sheet Section */}
        <div className="flex-1 bg-gray-200/80 rounded-2xl p-3 shadow-inner overflow-x-auto">
          <div
            ref={printRef}
            className="bg-white shadow-2xl mx-auto rounded-sm"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '20mm 22mm',
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: '14px',
              lineHeight: '1.7',
              color: '#000'
            }}
          >
            <div className="form-container">
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <p style={{ fontSize: '13px', fontWeight: 'bold' }}>Before,</p>
                <h1 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px', marginTop: '2px' }}>
                  Executive Magistrate / Notary Public
                </h1>
                <div style={{ display: 'inline-flex', alignItems: 'baseline', marginTop: '2px', minWidth: '160px', borderBottom: '1px dotted #000' }}>
                  <input
                    ref={(el) => (inputRefs.current[0] = el)}
                    type="text"
                    name="courtLocation"
                    value={formData.courtLocation}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 0)}

                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', textAlign: 'center', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold' }}
                  />
                </div>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px', marginTop: '10px' }}>
                  (AFFIDAVIT)
                </h2>
              </div>

              {/* Deponent Info */}
              <div style={{ textAlign: 'justify', lineHeight: '1.8', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 'bold' }}>I</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', margin: '0 6px', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[1] = el)}
                      type="text"
                      name="buyerName"
                      value={formData.buyerName}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 1)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '4px' }}>
                  <span>S/o, D/o, W/o</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[2] = el)}
                      type="text"
                      name="buyerRelation"
                      value={formData.buyerRelation}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 2)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  <span>Residence of</span>
                  <div style={{ flex: 1, minWidth: '160px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[3] = el)}
                      type="text"
                      name="buyerResidence"
                      value={formData.buyerResidence}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 3)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                  <span>P. O.</span>
                  <div style={{ width: '120px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[4] = el)}
                      type="text"
                      name="buyerPO"
                      value={formData.buyerPO}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 4)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                  <span>P. S.</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[5] = el)}
                      type="text"
                      name="buyerPS"
                      value={formData.buyerPS}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 5)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                  <span>District</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[6] = el)}
                      type="text"
                      name="buyerDistrict"
                      value={formData.buyerDistrict}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 6)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  <span>(A/P resident of</span>
                  <div style={{ flex: 1, minWidth: '140px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[7] = el)}
                      type="text"
                      name="buyerAPResidence"
                      value={formData.buyerAPResidence}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 7)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                  <span>P. S.</span>
                  <div style={{ width: '100px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[8] = el)}
                      type="text"
                      name="buyerAPPS"
                      value={formData.buyerAPPS}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 8)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                  <span>Dist</span>
                  <div style={{ width: '100px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[9] = el)}
                      type="text"
                      name="buyerAPDistrict"
                      value={formData.buyerAPDistrict}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 9)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                  <span>)</span>
                </div>

                <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
                  Do hereby solemnly affirm and declare as follows :-
                </p>

                {/* Point 1 */}
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span>1. That I have purchased the vehicle</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[10] = el)}
                        type="text"
                        name="vehicleMake"
                        value={formData.vehicleMake}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 10)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <span>Bearing registration No.</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[11] = el)}
                        type="text"
                        name="vehicleNumber"
                        value={formData.vehicleNumber}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 11)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <span>Engine No.</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[12] = el)}
                        type="text"
                        name="engineNumber"
                        value={formData.engineNumber}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 12)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                    <span>Chassis No.</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[13] = el)}
                        type="text"
                        name="chassisNumber"
                        value={formData.chassisNumber}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 13)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <span>from Sri</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[14] = el)}
                        type="text"
                        name="sellerName"
                        value={formData.sellerName}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 14)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                    <span>S/o, D/o, W/o</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[15] = el)}
                        type="text"
                        name="sellerRelation"
                        value={formData.sellerRelation}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 15)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <span>Resident of</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[16] = el)}
                        type="text"
                        name="sellerResidence"
                        value={formData.sellerResidence}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 16)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                    <span>P. S.</span>
                    <div style={{ width: '120px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[17] = el)}
                        type="text"
                        name="sellerPS"
                        value={formData.sellerPS}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 17)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                    <span>Distt</span>
                    <div style={{ width: '120px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[18] = el)}
                        type="text"
                        name="sellerDistrict"
                        value={formData.sellerDistrict}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 18)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <span>A/o Resident of</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[19] = el)}
                        type="text"
                        name="sellerAPResidence"
                        value={formData.sellerAPResidence}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 19)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                    <span>P. S.</span>
                    <div style={{ width: '100px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[20] = el)}
                        type="text"
                        name="sellerAPPS"
                        value={formData.sellerAPPS}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 20)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                    <span>Distt</span>
                    <div style={{ width: '100px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[21] = el)}
                        type="text"
                        name="sellerAPDistrict"
                        value={formData.sellerAPDistrict}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 21)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Point 2 */}
                <p style={{ marginTop: '12px' }}>
                  2. That neither any case nor govt. dues stands against this vehicle up to the date of affidavit and if is I am fully responsible for the same.
                </p>

                {/* Point 3 */}
                <p style={{ marginTop: '10px' }}>
                  3. That the ownership of the vehicle aforesaid may be transferred in the name of the purchaser above named for which I have got no objection, hence this affidavit.
                </p>

                <p style={{ marginTop: '12px', fontStyle: 'italic' }}>
                  That the above contents of this affidavit are true and correct to the best of my knowledge and belief.
                </p>
              </div>

              {/* Identification and Deponent Signature */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '36px', borderTop: '1px solid #ccc', paddingTop: '16px' }}>
                <div style={{ width: '50%', textAlign: 'left' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '13px' }}>I identified the deponent</p>
                  <p style={{ fontSize: '12px' }}>Who, has signed or given L.T.I. (Signature in Full)</p>
                  <p style={{ fontSize: '12px' }}>in my presence</p>
                  <div style={{ borderBottom: '1.5px dotted #000', minHeight: '36px', marginTop: '20px', width: '80%' }}></div>
                  <p style={{ fontSize: '11px', marginTop: '4px', fontStyle: 'italic' }}>Advocate / Identifier Signature</p>
                </div>

                <div style={{ width: '45%', textAlign: 'center' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '15px', letterSpacing: '1px' }}>DEPONENT</p>
                  <div style={{ borderBottom: '1.5px dotted #000', minHeight: '40px', marginTop: '30px' }}></div>
                  <p style={{ fontSize: '12px', marginTop: '4px', fontWeight: 'bold' }}>(Signature or Thumb Impression)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls Section */}
        <div className="w-full lg:w-80 bg-white rounded-2xl p-5 shadow-xl border border-gray-100 h-fit sticky top-2 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Buyer Affidavit</h3>
              <p className="text-xs text-gray-500">वाहन क्रय शपथ-पत्र (Purchaser)</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Vehicle Search */}
          <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-100">
            <label className="block text-xs font-bold text-sky-900 mb-1.5">
              🔍 Auto-Fill from Vehicle Reg No.
            </label>
            <input
              type="text"
              placeholder="e.g. CG04HA1234"
              value={vehicleSearchNumber}
              onChange={(e) => setVehicleSearchNumber(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-white border border-sky-200 rounded-lg text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
            />
            {fetchingVehicle && (
              <p className="text-xs text-sky-600 mt-1 font-medium animate-pulse">Fetching vehicle data...</p>
            )}
            {vehicleError && (
              <p className="text-xs text-red-500 mt-1 font-medium">{vehicleError}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => handlePrint(false)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF (Filled)
            </button>

            <button
              onClick={() => handlePrint(true)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-slate-300 cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Print Blank Form
            </button>

            <button
              onClick={handleClear}
              className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-semibold text-xs transition-all border border-rose-200 cursor-pointer"
            >
              Clear Form Fields
            </button>
          </div>

          <div className="text-[11px] text-gray-400 text-center mt-2 border-t border-gray-100 pt-3">
            💡 Press <span className="font-bold text-gray-600">Enter</span> inside any input to jump to the next field.
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuyerAffidavitModal
