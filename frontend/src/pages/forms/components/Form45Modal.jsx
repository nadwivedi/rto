import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const Form45Modal = ({ onClose }) => {
  const { user } = useAuth()
  const printRef = useRef()
  const inputRefs = useRef([])
  const [vehicleSearchNumber, setVehicleSearchNumber] = useState('')
  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')

  const [formData, setFormData] = useState({
    transportAuthorityLocation: '',
    fullName: '',
    fatherHusbandName: '',
    age: '',
    houseNo: '',
    roadLane: '',
    locality: '',
    cityTown: '',
    purpose: '',
    route: '',
    periodFrom: '',
    periodTo: '',
    ladenWeight: '',
    vehicleType: '',
    seatingCapacity: '',
    registrationMark: '',
    feeDeposited: '',
    rNo: '',
    bookNo: '',
    date: '',
    // Office use fields
    dateOfReceipt: '',
    amountOfRupees: '',
    receiptNumber: '',
    receiptDate: '',
    grantedRejected: '',
    permitNumberIssued: '',
    registrationMarkAfterIssued: ''
  })

  // Prefill RTO from logged-in user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        transportAuthorityLocation: user.rto || ''
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
            fullName: vehicleData.ownerName || prev.fullName,
            fatherHusbandName: vehicleData.sonWifeDaughterOf || prev.fatherHusbandName,
            houseNo: vehicleData.address || prev.houseNo,
            registrationMark: vehicleData.registrationNumber || prev.registrationMark,
            ladenWeight: vehicleData.ladenWeight || prev.ladenWeight
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
          <title>FORM M.P.M.V.R.-45 (T.P.A.) - Temporary Permit Application</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.5; padding: 20px; font-weight: 400; color: #000; }
            .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
            input {
              border: none !important;
              background: transparent;
              outline: none;
              width: 100%;
              font-family: 'Inter', sans-serif;
              font-size: 13px;
              padding: 0 2px;
              font-weight: 400;
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
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              lineHeight: '1.5',
              fontWeight: '400',
              color: '#000'
            }}
          >
            <div className="form-container">
              {/* Title */}
              <div style={{marginBottom: '8px'}}>
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '1px'}}>
                  <h1 style={{fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px', textAlign: 'center'}}>
                    FORM M.P.M.V.R.-45 (T.P.A.)
                  </h1>
                  <span style={{fontSize: '13px', fontWeight: 'normal', letterSpacing: '0px', position: 'absolute', right: '0'}}>(See Rule 72 (1) (D)</span>
                </div>
                <h2 style={{fontSize: '16px', fontWeight: 'bold', marginTop: '1px', textAlign: 'center'}}>APPLICATION IN RESPECT OF A TEMPORARY PERMIT</h2>
              </div>

              {/* To Section */}
              <div style={{marginBottom: '8px'}}>
                <p>To,</p>
                <div style={{marginLeft: '24px', marginTop: '4px'}}>
                  <p style={{marginBottom: '4px'}}>The Regional /State Transport Authority</p>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div style={{borderBottom: '1.5px solid #000', width: '286px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[0] = el}
                        type="text"
                        name="transportAuthorityLocation"
                        value={formData.transportAuthorityLocation}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 0)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                      />
                    </div>
                    <span>(C.G.)</span>
                  </div>
                </div>
              </div>

              {/* Introduction */}
              <div style={{marginBottom: '6px', textAlign: 'justify'}}>
                <p>In accordance with the provision of Section 69 and 87 of the Motor Vehicle Act. 1988 the undersigned hereby apply for a temporary permit under section 87 of the Act. as hereunder Setour.</p>
              </div>

              {/* Field 1 - Full Name */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>1.</span>
                <span style={{width: '80px', flexShrink: 0, marginRight: '10px'}}>Full Name</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[1] = el}
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 1)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Surname/Father's/Husband's Name */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center', marginLeft: '30px'}}>
                <span style={{width: '260px', flexShrink: 0, marginRight: '10px'}}>(Surname) Name Father's / Husband's Name</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[2] = el}
                    type="text"
                    name="fatherHusbandName"
                    value={formData.fatherHusbandName}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 2)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Field 2 - Age */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>2.</span>
                <span style={{width: '80px', flexShrink: 0, marginRight: '10px'}}>Age</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[3] = el}
                    type="text"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 3)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Field 3 - Full Address */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>3.</span>
                <span style={{width: '120px', flexShrink: 0, marginRight: '10px'}}>Full Address H.No.</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[4] = el}
                    type="text"
                    name="houseNo"
                    value={formData.houseNo}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 4)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Road Lane and Locality */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center', marginLeft: '30px'}}>
                <span style={{width: '80px', flexShrink: 0, marginRight: '10px'}}>Road Lane</span>
                <div style={{width: '180px', borderBottom: '1.5px solid #000', minHeight: '16px', marginRight: '10px'}}>
                  <input
                    ref={(el) => inputRefs.current[5] = el}
                    type="text"
                    name="roadLane"
                    value={formData.roadLane}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 5)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
                <span style={{flexShrink: 0, marginRight: '10px', whiteSpace: 'nowrap'}}>Name of the Locilty</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[6] = el}
                    type="text"
                    name="locality"
                    value={formData.locality}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 6)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* City/Town */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center', marginLeft: '30px'}}>
                <span style={{width: '80px', flexShrink: 0, marginRight: '10px'}}>City / Town</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[7] = el}
                    type="text"
                    name="cityTown"
                    value={formData.cityTown}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 7)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Field 4 - Purpose */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>4.</span>
                <span style={{width: '220px', flexShrink: 0, marginRight: '10px'}}>Purpose for which permit is required</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[8] = el}
                    type="text"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 8)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Field 5 - Route */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>5.</span>
                <span style={{width: '180px', flexShrink: 0, marginRight: '10px'}}>Route or reputes or area</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[9] = el}
                    type="text"
                    name="route"
                    value={formData.route}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 9)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Extra line for route */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}></div>
              </div>

              {/* Field 6 - Period duration */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>6.</span>
                <span style={{width: '320px', flexShrink: 0, marginRight: '10px'}}>Period duration of permit from (both day inclusive)</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[10] = el}
                    type="text"
                    name="periodFrom"
                    value={formData.periodFrom}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 10)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* To */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center', marginLeft: '30px'}}>
                <span style={{width: '40px', flexShrink: 0, marginRight: '10px'}}>To</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[11] = el}
                    type="text"
                    name="periodTo"
                    value={formData.periodTo}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 11)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Laden weight */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center', marginLeft: '30px'}}>
                <span style={{width: '100px', flexShrink: 0, marginRight: '10px'}}>(Laden weight)</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[12] = el}
                    type="text"
                    name="ladenWeight"
                    value={formData.ladenWeight}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 12)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Field 7 - Type and Seating capacity */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>7.</span>
                <span style={{width: '180px', flexShrink: 0, marginRight: '10px'}}>Type and Seating capacity</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[13] = el}
                    type="text"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 13)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* of the vehicle for which the permit is required */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center', marginLeft: '30px'}}>
                <span style={{width: '280px', flexShrink: 0, marginRight: '10px'}}>of the vehicle for which the permit is required</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[14] = el}
                    type="text"
                    name="seatingCapacity"
                    value={formData.seatingCapacity}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 14)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Field 8 - Registration mark */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>8.</span>
                <span style={{width: '200px', flexShrink: 0, marginRight: '10px'}}>Registration mark of the vehicle</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[15] = el}
                    type="text"
                    name="registrationMark"
                    value={formData.registrationMark}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 15)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Field 9 - Declaration */}
              <div style={{marginBottom: '8px'}}>
                <div style={{display: 'flex', alignItems: 'flex-start'}}>
                  <span style={{width: '30px', flexShrink: 0}}>9.</span>
                  <p style={{flex: 1}}>I hereby declare that the above Statement are true and agree that they shall be condition of any permit issued to me.</p>
                </div>
              </div>

              {/* Field 10 - Fee deposited */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>10.</span>
                <span style={{width: '140px', flexShrink: 0, marginRight: '10px'}}>I deposted fee Rs.</span>
                <div style={{width: '200px', borderBottom: '1.5px solid #000', minHeight: '16px', marginRight: '10px'}}>
                  <input
                    ref={(el) => inputRefs.current[16] = el}
                    type="text"
                    name="feeDeposited"
                    value={formData.feeDeposited}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 16)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
                <span style={{width: '60px', flexShrink: 0, marginRight: '10px'}}>R.No.</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[17] = el}
                    type="text"
                    name="rNo"
                    value={formData.rNo}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 17)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Book No and Date */}
              <div style={{display: 'flex', marginBottom: '12px', alignItems: 'center', marginLeft: '30px'}}>
                <span style={{width: '80px', flexShrink: 0, marginRight: '10px'}}>Book No.</span>
                <div style={{width: '200px', borderBottom: '1.5px solid #000', minHeight: '16px', marginRight: '20px'}}>
                  <input
                    ref={(el) => inputRefs.current[18] = el}
                    type="text"
                    name="bookNo"
                    value={formData.bookNo}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 18)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
                <span style={{width: '60px', flexShrink: 0, marginRight: '10px'}}>dated</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[19] = el}
                    type="text"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 19)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Signature section */}
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginLeft: '30px'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{marginRight: '10px'}}>Date</span>
                  <div style={{borderBottom: '1.5px solid #000', width: '150px', minHeight: '16px'}}></div>
                </div>
                <div style={{textAlign: 'center'}}>
                  <div style={{borderBottom: '1.5px solid #000', width: '250px', height: '40px', marginBottom: '4px'}}></div>
                  <p style={{fontSize: '11px'}}>Signature thumb impression of the</p>
                  <p style={{fontSize: '11px'}}>Applicant</p>
                </div>
              </div>

              {/* Separator line */}
              <div style={{borderTop: '2px solid #000', margin: '12px 0'}}></div>

              {/* Office Section */}
              <div style={{marginTop: '8px'}}>
                <p style={{fontWeight: 'bold', marginBottom: '10px'}}>(To be filled in the office of the transport Authority)</p>

                {/* Office Field 1 */}
                <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                  <span style={{width: '30px', flexShrink: 0}}>1.</span>
                  <span style={{width: '120px', flexShrink: 0, marginRight: '10px'}}>Date of receipt</span>
                  <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                    <input
                      type="text"
                      name="dateOfReceipt"
                      value={formData.dateOfReceipt}
                      onChange={handleChange}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                    />
                  </div>
                </div>

                {/* Office Field 2 */}
                <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                  <span style={{width: '30px', flexShrink: 0}}>2.</span>
                  <span style={{flexShrink: 0, marginRight: '6px'}}>Amount of Rupees</span>
                  <div style={{width: '60px', borderBottom: '1.5px solid #000', minHeight: '16px', marginRight: '6px'}}>
                    <input
                      type="text"
                      name="amountOfRupees"
                      value={formData.amountOfRupees}
                      onChange={handleChange}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                    />
                  </div>
                  <span style={{marginRight: '6px'}}>received vide receipt No.</span>
                  <div style={{width: '80px', borderBottom: '1.5px solid #000', minHeight: '16px', marginRight: '6px'}}>
                    <input
                      type="text"
                      name="receiptNumber"
                      value={formData.receiptNumber}
                      onChange={handleChange}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                    />
                  </div>
                  <span style={{marginRight: '6px'}}>dated</span>
                  <div style={{width: '100px', borderBottom: '1.5px solid #000', minHeight: '16px', marginRight: '4px'}}>
                    <input
                      type="text"
                      name="receiptDate"
                      value={formData.receiptDate}
                      onChange={handleChange}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                    />
                  </div>
                  <span>202</span>
                </div>

                {/* Office Field 3 */}
                <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                  <span style={{width: '30px', flexShrink: 0}}>3.</span>
                  <span style={{flexShrink: 0, marginRight: '6px'}}>Granted/ Granted in modified from rejected on</span>
                  <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                    <input
                      type="text"
                      name="grantedRejected"
                      value={formData.grantedRejected}
                      onChange={handleChange}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                    />
                  </div>
                </div>

                {/* Office Field 4 */}
                <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                  <span style={{width: '30px', flexShrink: 0}}>4.</span>
                  <span style={{width: '160px', flexShrink: 0, marginRight: '10px'}}>Permit number issued</span>
                  <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                    <input
                      type="text"
                      name="permitNumberIssued"
                      value={formData.permitNumberIssued}
                      onChange={handleChange}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                    />
                  </div>
                </div>

                {/* Office Field 5 */}
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '4px'}}>
                  <span style={{width: '30px', flexShrink: 0}}>5.</span>
                  <span style={{flexShrink: 0, marginRight: '10px', whiteSpace: 'nowrap'}}>Registration mark of vehicle if intimated after issued</span>
                  <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                    <input
                      type="text"
                      name="registrationMarkAfterIssued"
                      value={formData.registrationMarkAfterIssued}
                      onChange={handleChange}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                    />
                  </div>
                </div>

                {/* Secretary signature */}
                <div style={{textAlign: 'right', marginTop: '2px'}}>
                  <div style={{borderBottom: '1.5px solid #000', width: '250px', height: '30px', marginLeft: 'auto', marginBottom: '2px'}}></div>
                  <p style={{fontSize: '12px', margin: '0'}}>Secretary</p>
                  <p style={{fontSize: '12px', margin: '0'}}>Transport Authority</p>
                  <p style={{fontSize: '12px', margin: '0'}}>(C.G.)</p>
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
              {!fetchingVehicle && !vehicleError && vehicleSearchNumber.trim().length >= 4 && formData.registrationMark && (
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

export default Form45Modal
