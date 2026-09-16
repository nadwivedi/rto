import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const Form30Modal = ({ onClose }) => {
  const { user } = useAuth()
  const printRef = useRef()
  const inputRefs = useRef([])
  const [vehicleSearchNumber, setVehicleSearchNumber] = useState('')
  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')

  const [formData, setFormData] = useState({
    registeringAuthorityLocation: '',
    // Part I - Transferor
    transferorName: '',
    transferorRelation: '',
    transferorAddress: '',
    transferDay: '',
    transferMonthYear: '',
    vehicleNumber: '',
    transfereeName: '',
    transfereeRelation: '',
    transfereeAddress: '',
    transferorSignDate: new Date().toLocaleDateString('en-GB'),
    suspensionDetails: '',
    // Part II - Transferee
    transfereeNamePart2: '',
    transfereeRelationPart2: '',
    transfereeAge: '',
    transfereeAddressPart2: '',
    purchaseDay: '',
    purchaseMonthYear: '',
    vehicleNumberPart2: '',
    transferorNameAddressPart2: '',
    transfereeSignDate: new Date().toLocaleDateString('en-GB'),
    // Financier Consent
    financierNameAddress: '',
    financierSignDate: new Date().toLocaleDateString('en-GB'),
    // Office Endorsement
    endorsementRefNo: '',
    endorsementOffice: '',
    endorsementEffectDate: '',
    endorsementSignDate: new Date().toLocaleDateString('en-GB'),
    financierAddressFooter: ''
  })

  // Prefill RTO from user context
  useEffect(() => {
    if (user?.rto) {
      setFormData(prev => ({
        ...prev,
        registeringAuthorityLocation: prev.registeringAuthorityLocation || user.rto,
        endorsementOffice: prev.endorsementOffice || `RTO ${user.rto}`
      }))
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value.toUpperCase() }
      // Sync duplicate fields for convenience
      if (name === 'vehicleNumber') {
        updated.vehicleNumberPart2 = value.toUpperCase()
      }
      if (name === 'transfereeName') {
        updated.transfereeNamePart2 = value.toUpperCase()
      }
      if (name === 'transfereeRelation') {
        updated.transfereeRelationPart2 = value.toUpperCase()
      }
      if (name === 'transfereeAddress') {
        updated.transfereeAddressPart2 = value.toUpperCase()
      }
      if (name === 'transferDay') {
        updated.purchaseDay = value.toUpperCase()
      }
      if (name === 'transferMonthYear') {
        updated.purchaseMonthYear = value.toUpperCase()
      }
      return updated
    })
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
            vehicleNumberPart2: vehicleData.registrationNumber || prev.vehicleNumberPart2,
            transferorName: vehicleData.ownerName || prev.transferorName,
            transferorRelation: vehicleData.sonWifeDaughterOf || prev.transferorRelation,
            transferorAddress: vehicleData.address || prev.transferorAddress,
            transferorNameAddressPart2: `${vehicleData.ownerName || ''}, ${vehicleData.address || ''}`.trim() || prev.transferorNameAddressPart2
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
          <title>FORM 30 - Application for Intimation and Transfer of Ownership</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12px;
              line-height: 1.45;
              padding: 15px;
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
              font-size: 12px;
              padding: 0 2px;
              font-weight: bold;
              color: #000;
            }
            .no-print { display: none !important; }
            @media print {
              body { padding: 8mm; margin: 0; }
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
      transferorRelation: '',
      transferorAddress: '',
      transferDay: '',
      transferMonthYear: '',
      vehicleNumber: '',
      transfereeName: '',
      transfereeRelation: '',
      transfereeAddress: '',
      transferorSignDate: new Date().toLocaleDateString('en-GB'),
      suspensionDetails: '',
      transfereeNamePart2: '',
      transfereeRelationPart2: '',
      transfereeAge: '',
      transfereeAddressPart2: '',
      purchaseDay: '',
      purchaseMonthYear: '',
      vehicleNumberPart2: '',
      transferorNameAddressPart2: '',
      transfereeSignDate: new Date().toLocaleDateString('en-GB'),
      financierNameAddress: '',
      financierSignDate: new Date().toLocaleDateString('en-GB'),
      endorsementRefNo: '',
      endorsementOffice: user?.rto ? `RTO ${user.rto}` : '',
      endorsementEffectDate: '',
      endorsementSignDate: new Date().toLocaleDateString('en-GB'),
      financierAddressFooter: ''
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
              padding: '16mm 18mm',
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: '12px',
              lineHeight: '1.45',
              color: '#000'
            }}
          >
            <div className="form-container">
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <h1 style={{ fontSize: '17px', fontWeight: 'bold', letterSpacing: '2px' }}>FORM 30</h1>
                <p style={{ fontSize: '11px', marginTop: '1px' }}>[See Rule 55(2) and (3)]</p>
                <h2 style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '3px', textTransform: 'uppercase' }}>
                  Application for Intimation and Transfer of Ownership of a Motor Vehicle
                </h2>
                <p style={{ fontSize: '10px', marginTop: '2px', fontStyle: 'italic', lineHeight: '1.25' }}>
                  (To be made in duplicate if the vehicle is held under an agreement of hire-purchase / lease / hypothecation. The duplicate copy with the endorsement of the Registering Authority to be returned to the Financier simultaneously on making the entry of the transfer of ownership in the Certificate of Registration and Registration Record in Form 24)
                </p>
              </div>

              {/* To Section */}
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontWeight: 'bold' }}>To</p>
                <div style={{ display: 'flex', alignItems: 'baseline', marginLeft: '24px' }}>
                  <span>The Registering Authority</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '16px' }}>
                    <input
                      ref={(el) => (inputRefs.current[0] = el)}
                      type="text"
                      name="registeringAuthorityLocation"
                      value={formData.registeringAuthorityLocation}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 0)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>
              </div>

              {/* PART I */}
              <div style={{ borderTop: '1.5px solid #000', paddingTop: '6px', marginBottom: '10px' }}>
                <h3 style={{ textAlign: 'center', fontSize: '12.5px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '6px' }}>
                  PART I – FOR THE USE OF THE TRANSFEROR
                </h3>

                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '3px' }}>
                  <span style={{ width: '150px' }}>Name of the transferor:</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                    <input
                      ref={(el) => (inputRefs.current[1] = el)}
                      type="text"
                      name="transferorName"
                      value={formData.transferorName}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 1)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '3px' }}>
                  <span style={{ width: '150px' }}>Son/Wife/Daughter of:</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                    <input
                      ref={(el) => (inputRefs.current[2] = el)}
                      type="text"
                      name="transferorRelation"
                      value={formData.transferorRelation}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 2)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '3px' }}>
                  <span style={{ width: '150px' }}>Full Address:</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                    <input
                      ref={(el) => (inputRefs.current[3] = el)}
                      type="text"
                      name="transferorAddress"
                      value={formData.transferorAddress}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 3)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '6px', textAlign: 'justify', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                    <span>I/We, hereby declare that I/We have on this</span>
                    <div style={{ width: '70px', borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                      <input
                        ref={(el) => (inputRefs.current[4] = el)}
                        type="text"
                        name="transferDay"
                        value={formData.transferDay}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 4)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                      />
                    </div>
                    <span>day of the year</span>
                    <div style={{ width: '110px', borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                      <input
                        ref={(el) => (inputRefs.current[5] = el)}
                        type="text"
                        name="transferMonthYear"
                        value={formData.transferMonthYear}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 5)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                      />
                    </div>
                    <span>sold my/our motor vehicle bearing Registration mark</span>
                    <div style={{ flex: 1, minWidth: '140px', borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                      <input
                        ref={(el) => (inputRefs.current[6] = el)}
                        type="text"
                        name="vehicleNumber"
                        value={formData.vehicleNumber}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 6)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                    <span>to Shri./Smt</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                      <input
                        ref={(el) => (inputRefs.current[7] = el)}
                        type="text"
                        name="transfereeName"
                        value={formData.transfereeName}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 7)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                    <span>Son/Wife/Daughter of</span>
                    <div style={{ width: '200px', borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                      <input
                        ref={(el) => (inputRefs.current[8] = el)}
                        type="text"
                        name="transfereeRelation"
                        value={formData.transfereeRelation}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 8)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '2px' }}>
                    <span>residing at</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '16px' }}>
                      <input
                        ref={(el) => (inputRefs.current[9] = el)}
                        type="text"
                        name="transfereeAddress"
                        value={formData.transfereeAddress}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 9)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <p style={{ marginTop: '3px' }}>
                    and handed over the Certificate of Registration and the Certificate of Insurance to him/her/them.
                  </p>
                  <p style={{ marginTop: '2px' }}>
                    I/We hereby declare that to the best of my/our knowledge the certificate of registration of the vehicle has not been suspended or cancelled.
                  </p>
                  <p style={{ fontSize: '11px', marginTop: '2px' }}>
                    *I/We enclose the “No Objection Certificate” issued by the Registering Authority.<br />
                    **If the “No Objection Certificate” issued from the Registering Authority is not enclosed, the transferor should file along with this application a declaration as required under sub-section (1) of section 50.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span>Date:</span>
                    <div style={{ width: '110px', borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '16px' }}>
                      <input
                        ref={(el) => (inputRefs.current[10] = el)}
                        type="text"
                        name="transferorSignDate"
                        value={formData.transferorSignDate}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 10)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 'bold' }}>Signature or thumb impression of the Transferor</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '4px', fontSize: '11px' }}>
                  <span>*Details of suspension or cancellation:</span>
                  <div style={{ flex: 1, borderBottom: '1px dotted #000', marginLeft: '6px', minHeight: '14px' }}>
                    <input
                      ref={(el) => (inputRefs.current[11] = el)}
                      type="text"
                      name="suspensionDetails"
                      value={formData.suspensionDetails}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 11)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '11px', padding: '0 2px' }}
                    />
                  </div>
                </div>
                <p style={{ fontSize: '10px', fontStyle: 'italic' }}>**Strike out whichever is inapplicable.</p>
              </div>

              {/* PART II */}
              <div style={{ borderTop: '1.5px solid #000', paddingTop: '6px', marginBottom: '10px' }}>
                <h3 style={{ textAlign: 'center', fontSize: '12.5px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '6px' }}>
                  PART II – FOR THE USE OF TRANSFEREE
                </h3>

                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '3px' }}>
                  <span style={{ width: '160px' }}>Name of the Transferee:</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                    <input
                      ref={(el) => (inputRefs.current[12] = el)}
                      type="text"
                      name="transfereeNamePart2"
                      value={formData.transfereeNamePart2}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 12)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
                  <span>Son/Wife/Daughter of:</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                    <input
                      ref={(el) => (inputRefs.current[13] = el)}
                      type="text"
                      name="transfereeRelationPart2"
                      value={formData.transfereeRelationPart2}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 13)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                  <span>Age:</span>
                  <div style={{ width: '60px', borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                    <input
                      ref={(el) => (inputRefs.current[14] = el)}
                      type="text"
                      name="transfereeAge"
                      value={formData.transfereeAge}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 14)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '3px' }}>
                  <span style={{ width: '160px' }}>Full address:</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                    <input
                      ref={(el) => (inputRefs.current[15] = el)}
                      type="text"
                      name="transfereeAddressPart2"
                      value={formData.transfereeAddressPart2}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 15)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '6px', textAlign: 'justify', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                    <span>I/We hereby declare that I/We have on this</span>
                    <div style={{ width: '70px', borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                      <input
                        ref={(el) => (inputRefs.current[16] = el)}
                        type="text"
                        name="purchaseDay"
                        value={formData.purchaseDay}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 16)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                      />
                    </div>
                    <span>day of the year</span>
                    <div style={{ width: '110px', borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                      <input
                        ref={(el) => (inputRefs.current[17] = el)}
                        type="text"
                        name="purchaseMonthYear"
                        value={formData.purchaseMonthYear}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 17)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                      />
                    </div>
                    <span>purchased the motor vehicle bearing registration number</span>
                    <div style={{ flex: 1, minWidth: '130px', borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                      <input
                        ref={(el) => (inputRefs.current[18] = el)}
                        type="text"
                        name="vehicleNumberPart2"
                        value={formData.vehicleNumberPart2}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 18)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                    <span>from</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', minHeight: '16px' }}>
                      <input
                        ref={(el) => (inputRefs.current[19] = el)}
                        type="text"
                        name="transferorNameAddressPart2"
                        value={formData.transferorNameAddressPart2}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 19)}

                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <p style={{ marginTop: '2px' }}>
                    and request that necessary entries regarding the transfer of ownership of the vehicle in my/our name may be recorded in the certificate of registration and certificate of fitness of the vehicle, which is enclosed.
                  </p>
                  <p style={{ marginTop: '2px' }}>
                    The certificate of Insurance is also enclosed. To the best of my knowledge and belief I/We have not suppressed any facts and information furnished is true. The vehicle is not superdari and free from all encumbrances. I/We undertake to hold myself responsible for any inaccuracy of the information.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span>Date:</span>
                    <div style={{ width: '110px', borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '16px' }}>
                      <input
                        ref={(el) => (inputRefs.current[20] = el)}
                        type="text"
                        name="transfereeSignDate"
                        value={formData.transfereeSignDate}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 20)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 'bold' }}>Signature or thumb impression of the Transferee</p>
                  </div>
                </div>
              </div>

              {/* CONSENT OF FINANCIER */}
              <div style={{ borderTop: '1px dashed #444', paddingTop: '6px', marginBottom: '8px' }}>
                <h4 style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                  CONSENT OF THE FINANCIER IN THE CASE OF MOTOR VEHICLE SUBJECT TO AN AGREEMENT OF HIRE-PURCHASE/LEASE/HYPOTHECATION
                </h4>
                <p style={{ fontSize: '11px', lineHeight: '1.4', textAlign: 'justify' }}>
                  I/We being a party to an agreement of hire-purchase/lease/hypothecation in respect of motor vehicle specified above, give consent to the transfer of ownership of the said motor vehicle in the name of the Transferee named above, with whom I/We have entered into an agreement of hire-purchase/lease/hypothecation.
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px' }}>(Full name and address of the Financier):</span>
                  <div style={{ flex: 1, borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '16px' }}>
                    <input
                      ref={(el) => (inputRefs.current[21] = el)}
                      type="text"
                      name="financierNameAddress"
                      value={formData.financierNameAddress}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 21)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '11px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '11px' }}>Date:</span>
                    <div style={{ width: '100px', borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '16px' }}>
                      <input
                        ref={(el) => (inputRefs.current[22] = el)}
                        type="text"
                        name="financierSignDate"
                        value={formData.financierSignDate}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 22)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '11px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '11px' }}>Signature of the Financier</p>
                  </div>
                </div>
              </div>

              {/* OFFICE ENDORSEMENT */}
              <div style={{ border: '1px solid #000', padding: '6px 10px', marginTop: '6px' }}>
                <h4 style={{ textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', marginBottom: '4px' }}>
                  OFFICE ENDORSEMENT
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', width: '45%' }}>
                    <span>Ref.No.</span>
                    <div style={{ flex: 1, borderBottom: '1px dotted #000', marginLeft: '4px', minHeight: '14px' }}>
                      <input
                        ref={(el) => (inputRefs.current[23] = el)}
                        type="text"
                        name="endorsementRefNo"
                        value={formData.endorsementRefNo}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 23)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '11px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', width: '50%' }}>
                    <span>Office of the</span>
                    <div style={{ flex: 1, borderBottom: '1px dotted #000', marginLeft: '4px', minHeight: '14px' }}>
                      <input
                        ref={(el) => (inputRefs.current[24] = el)}
                        type="text"
                        name="endorsementOffice"
                        value={formData.endorsementOffice}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 24)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '11px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px', fontSize: '11px', lineHeight: '1.4' }}>
                  <span>The transfer of ownership of vehicle under continuation of an endorsement of hire-purchase /lease/ hypothecation agreement has been recorded with effect from</span>
                  <div style={{ width: '100px', borderBottom: '1px dotted #000', minHeight: '14px' }}>
                    <input
                      ref={(el) => (inputRefs.current[25] = el)}
                      type="text"
                      name="endorsementEffectDate"
                      value={formData.endorsementEffectDate}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 25)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '11px', fontWeight: 'bold', padding: '0 2px' }}
                    />
                  </div>
                  <span>in the Registration Certificate of the vehicle and in the Registration Record of this office in Form 24.</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', fontSize: '11px' }}>
                    <span>Date:</span>
                    <div style={{ width: '90px', borderBottom: '1px dotted #000', marginLeft: '4px', minHeight: '14px' }}>
                      <input
                        ref={(el) => (inputRefs.current[26] = el)}
                        type="text"
                        name="endorsementSignDate"
                        value={formData.endorsementSignDate}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 26)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '11px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '11px' }}>Signature of the Registering Authority</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '4px', fontSize: '11px' }}>
                  <span>To The Financier:</span>
                  <div style={{ flex: 1, borderBottom: '1px dotted #000', marginLeft: '4px', minHeight: '14px' }}>
                    <input
                      ref={(el) => (inputRefs.current[27] = el)}
                      type="text"
                      name="financierAddressFooter"
                      value={formData.financierAddressFooter}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 27)}

                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '11px', padding: '0 2px' }}
                    />
                  </div>
                </div>
                <p style={{ fontSize: '9px', fontStyle: 'italic' }}>(To be sent by Registered Post Acknowledgment Due)</p>
              </div>

              {/* Specimen Signatures */}
              <div style={{ marginTop: '6px', fontSize: '10px', lineHeight: '1.3' }}>
                <p style={{ fontStyle: 'italic', marginBottom: '4px' }}>
                  Specimen signature or thumb impression of the registered owner and the Financier are to be obtained in the original application for affixing and attestation by the Registering Authority with the office seal in Forms 23 and 24, in such manner that the parts of impression of seal or stamp and attestation shall fall upon each signature.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ width: '48%' }}>
                    <p style={{ fontWeight: 'bold' }}>Specimen signatures of the Financier</p>
                    <p style={{ marginTop: '2px' }}>1. ...........................................................</p>
                    <p style={{ marginTop: '2px' }}>2. ...........................................................</p>
                  </div>
                  <div style={{ width: '48%' }}>
                    <p style={{ fontWeight: 'bold' }}>Specimen signatures of the Registered Owner</p>
                    <p style={{ marginTop: '2px' }}>1. ...........................................................</p>
                    <p style={{ marginTop: '2px' }}>2. ...........................................................</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls Section */}
        <div className="w-full lg:w-80 bg-white rounded-2xl p-5 shadow-xl border border-gray-100 h-fit sticky top-2 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Form 30</h3>
              <p className="text-xs text-gray-500">Intimation & Transfer Application</p>
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

export default Form30Modal
