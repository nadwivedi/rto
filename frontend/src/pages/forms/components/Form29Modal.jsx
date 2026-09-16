import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const Form29Modal = ({ onClose }) => {
  const { user } = useAuth()
  const printRef = useRef()
  const inputRefs = useRef([])
  const [vehicleSearchNumber, setVehicleSearchNumber] = useState('')
  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')

  const [formData, setFormData] = useState({
    registeringAuthorityLocation: '',
    transferorName: '',
    transferorResidentOf: '',
    saleDay: '',
    saleMonthYear: '',
    vehicleNumber: '',
    vehicleMake: '',
    chassisNumber: '',
    engineNumber: '',
    transfereeName: '',
    transfereeRelation: '',
    transfereeAddress: '',
    financierDetails: '',
    date: new Date().toLocaleDateString('en-GB'),
    transfereeAuthorityLocation: '',
    endorsementRefNo: '',
    endorsementOffice: '',
    endorsementTransfereeName: '',
    endorsementEffectDate: '',
    endorsementDate: new Date().toLocaleDateString('en-GB'),
    transferorAddressFooter: ''
  })

  // Prefill RTO from user data
  useEffect(() => {
    if (user?.rto) {
      setFormData(prev => ({
        ...prev,
        registeringAuthorityLocation: prev.registeringAuthorityLocation || user.rto,
        endorsementOffice: prev.endorsementOffice || `RTO ${user.rto}`,
        transfereeAuthorityLocation: prev.transfereeAuthorityLocation || user.rto
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
            chassisNumber: vehicleData.chassisNumber || prev.chassisNumber,
            engineNumber: vehicleData.engineNumber || prev.engineNumber,
            transferorName: vehicleData.ownerName || prev.transferorName,
            transferorResidentOf: vehicleData.address || prev.transferorResidentOf,
            transferorAddressFooter: `${vehicleData.ownerName || ''} - ${vehicleData.address || ''}`.trim() || prev.transferorAddressFooter
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
          <title>FORM 29 - Notice of Transfer of Ownership of a Motor Vehicle</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 13px;
              line-height: 1.5;
              padding: 20px;
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
              font-size: 13px;
              padding: 0 2px;
              font-weight: bold;
              color: #000;
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

  const handleClear = () => {
    setFormData({
      registeringAuthorityLocation: user?.rto || '',
      transferorName: '',
      transferorResidentOf: '',
      saleDay: '',
      saleMonthYear: '',
      vehicleNumber: '',
      vehicleMake: '',
      chassisNumber: '',
      engineNumber: '',
      transfereeName: '',
      transfereeRelation: '',
      transfereeAddress: '',
      financierDetails: '',
      date: new Date().toLocaleDateString('en-GB'),
      transfereeAuthorityLocation: user?.rto || '',
      endorsementRefNo: '',
      endorsementOffice: user?.rto ? `RTO ${user.rto}` : '',
      endorsementTransfereeName: '',
      endorsementEffectDate: '',
      endorsementDate: new Date().toLocaleDateString('en-GB'),
      transferorAddressFooter: ''
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
              padding: '18mm 20mm',
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: '13px',
              lineHeight: '1.5',
              color: '#000'
            }}
          >
            <div className="form-container">
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>FORM 29</h1>
                <p style={{ fontSize: '12px', marginTop: '2px' }}>[See Rule 55(1)]</p>
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px', textTransform: 'uppercase' }}>
                  Notice of Transfer of Ownership of a Motor Vehicle
                </h2>
                <p style={{ fontSize: '11px', marginTop: '4px', fontStyle: 'italic', lineHeight: '1.3' }}>
                  (To be made in duplicate and the duplicate copy with the endorsement of the Registering Authority to be returned to the transferor immediately on making entries of transfer of ownership in certificate of Registration and Form 24)
                </p>
              </div>

              {/* To Section */}
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontWeight: 'bold' }}>To</p>
                <div style={{ display: 'flex', alignItems: 'baseline', marginLeft: '24px' }}>
                  <span>The Registering Authority</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[0] = el)}
                      type="text"
                      name="registeringAuthorityLocation"
                      value={formData.registeringAuthorityLocation}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 0)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>
                <p style={{ marginLeft: '24px', fontSize: '11px', fontStyle: 'italic' }}>(in whose jurisdiction the Transferee resides)</p>
              </div>

              {/* Body Paragraph */}
              <div style={{ marginBottom: '12px', textAlign: 'justify', lineHeight: '1.7' }}>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span>I/We</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', margin: '0 6px', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[1] = el)}
                      type="text"
                      name="transferorName"
                      value={formData.transferorName}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 1)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                  <span>resident of</span>
                </div>

                <div style={{ borderBottom: '1.5px dotted #000', margin: '3px 0', minHeight: '18px' }}>
                  <input
                    ref={(el) => (inputRefs.current[2] = el)}
                    type="text"
                    name="transferorResidentOf"
                    value={formData.transferorResidentOf}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 2)}

                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                  <span>have on the</span>
                  <div style={{ width: '80px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[3] = el)}
                      type="text"
                      name="saleDay"
                      value={formData.saleDay}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 3)}
                      placeholder="Day (e.g. 15th)"
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                    />
                  </div>
                  <span>day of the year</span>
                  <div style={{ width: '120px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[4] = el)}
                      type="text"
                      name="saleMonthYear"
                      value={formData.saleMonthYear}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 4)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                    />
                  </div>
                  <span>Sold and delivered my / our Vehicle No</span>
                  <div style={{ flex: 1, minWidth: '150px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[5] = el)}
                      type="text"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 5)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
                  <span>make</span>
                  <div style={{ width: '180px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[6] = el)}
                      type="text"
                      name="vehicleMake"
                      value={formData.vehicleMake}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 6)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                  <span>Chassis No.</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[7] = el)}
                      type="text"
                      name="chassisNumber"
                      value={formData.chassisNumber}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 7)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
                  <span>[Engine number or motor number in the case of Battery Operated Vehicles]</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[8] = el)}
                      type="text"
                      name="engineNumber"
                      value={formData.engineNumber}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 8)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                  <span>to</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '3px' }}>
                  <span>Shri / Smt</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[9] = el)}
                      type="text"
                      name="transfereeName"
                      value={formData.transfereeName}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 9)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                  <span>Son/Wife/Daughter of</span>
                  <div style={{ width: '220px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[10] = el)}
                      type="text"
                      name="transfereeRelation"
                      value={formData.transfereeRelation}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 10)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '3px' }}>
                  <span>residing at</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[11] = el)}
                      type="text"
                      name="transfereeAddress"
                      value={formData.transfereeAddress}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 11)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '3px' }}>
                  <span>under an agreement of hire purchase/lease/ hypothecation with</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[12] = el)}
                      type="text"
                      name="financierDetails"
                      value={formData.financierDetails}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 12)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <p style={{ marginTop: '8px' }}>
                  The Registration Certificate and Insurance Certificate have been handed over to him /her / them.
                </p>
                <p style={{ marginTop: '4px' }}>
                  To the best of my/our knowledge and belief the vehicle is not superdari and free from all encumbrances and information furnished is true. I/We undertake to hold my/our self-responsible for any inaccuracy or suppression of information.
                </p>
              </div>

              {/* Signatures Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '24px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'left', width: '45%' }}>
                  <div style={{ borderBottom: '1.5px dotted #000', minHeight: '32px', marginBottom: '4px' }}></div>
                  <p style={{ fontWeight: 'bold' }}>Signature of the Financier</p>
                  <p style={{ fontSize: '11px', fontStyle: 'italic' }}>(as his consent)</p>
                </div>
                <div style={{ textAlign: 'right', width: '48%' }}>
                  <div style={{ borderBottom: '1.5px dotted #000', minHeight: '32px', marginBottom: '4px' }}></div>
                  <p style={{ fontWeight: 'bold' }}>Signature or thumb impression of the</p>
                  <p style={{ fontWeight: 'bold' }}>Registered Owner (Transferor)</p>
                </div>
              </div>

              {/* Date & Transferee */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 'bold' }}>Date:</span>
                  <div style={{ width: '120px', borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[13] = el)}
                      type="text"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 13)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>
                <div>
                  <p style={{ fontWeight: 'bold' }}>I/We (Transferee)</p>
                </div>
              </div>

              {/* Copy to */}
              <div style={{ marginBottom: '14px', borderTop: '1px dashed #666', paddingTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span>Copy to the Registering Authority</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', margin: '0 6px', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[14] = el)}
                      type="text"
                      name="transfereeAuthorityLocation"
                      value={formData.transfereeAuthorityLocation}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 14)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                  <span>in whose jurisdiction the</span>
                </div>
                <p>transferor resides.</p>
                <p style={{ fontSize: '11px', fontStyle: 'italic', marginTop: '2px' }}>
                  Note. – To be sent to the Registering Authority by Registered Post Acknowledgment Due.
                </p>
              </div>

              {/* Office Endorsement Box */}
              <div style={{ border: '1.5px solid #000', padding: '10px 12px', marginTop: '10px' }}>
                <h3 style={{ textAlign: 'center', fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px' }}>
                  OFFICE ENDORSEMENT
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', width: '45%' }}>
                    <span>Ref.No.</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[15] = el)}
                        type="text"
                        name="endorsementRefNo"
                        value={formData.endorsementRefNo}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 15)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', width: '50%' }}>
                    <span>Office of the</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[16] = el)}
                        type="text"
                        name="endorsementOffice"
                        value={formData.endorsementOffice}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 16)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px', lineHeight: '1.7' }}>
                  <span>The ownership of the vehicle has been transferred to the name of</span>
                  <div style={{ flex: 1, minWidth: '180px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[17] = el)}
                      type="text"
                      name="endorsementTransfereeName"
                      value={formData.endorsementTransfereeName}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 17)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                  <span>with the note of the above said agreement with effect from</span>
                  <div style={{ width: '120px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[18] = el)}
                      type="text"
                      name="endorsementEffectDate"
                      value={formData.endorsementEffectDate}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 18)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span>Date:</span>
                    <div style={{ width: '120px', borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[19] = el)}
                        type="text"
                        name="endorsementDate"
                        value={formData.endorsementDate}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 19)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 'bold' }}>Signature of the Registering Authority with Office seal</p>
                  </div>
                </div>
                <p style={{ fontSize: '10px', fontStyle: 'italic', marginTop: '4px' }}>*Strike out whichever is inapplicable</p>
              </div>

              {/* To Transferor Footer */}
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontWeight: 'bold' }}>To</p>
                <div style={{ display: 'flex', alignItems: 'baseline', marginLeft: '24px' }}>
                  <span>The Transferor:</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '18px' }}>
                    <input
                      ref={(el) => (inputRefs.current[20] = el)}
                      type="text"
                      name="transferorAddressFooter"
                      value={formData.transferorAddressFooter}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 20)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>
                <p style={{ marginLeft: '24px', fontSize: '11px', fontStyle: 'italic' }}>(To be sent by Registered Post Acknowledgment Due)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls Section */}
        <div className="w-full lg:w-80 bg-white rounded-2xl p-5 shadow-xl border border-gray-100 h-fit sticky top-2 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Form 29</h3>
              <p className="text-xs text-gray-500">Notice of Vehicle Transfer</p>
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

export default Form29Modal
