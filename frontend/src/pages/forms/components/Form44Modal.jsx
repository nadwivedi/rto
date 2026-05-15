import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const Form44Modal = ({ onClose }) => {
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
    cityTownPin: '',
    routeArea: '',
    natureOfGoods: '',
    registrationMarks: '',
    makeType: '',
    loadCapacity: '',
    ladenWeight: '',
    overallLength: '',
    width: '',
    vehicleYear: '',
    suspensionDetails: '',
    certificateOption: 'forward'
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
            registrationMarks: vehicleData.registrationNumber || prev.registrationMarks,
            ladenWeight: vehicleData.ladenWeight || prev.ladenWeight,
            makeType: vehicleData.makerName || prev.makeType
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
          <title>FORM M.P.M.V.R.-44 (GCPA) - Goods Carriage Permits</title>
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
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
            }
            th, td {
              border: 1.5px solid #000;
              padding: 6px;
              text-align: center;
            }
            th {
              font-weight: 500;
              font-size: 12px;
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
              <div style={{marginBottom: '10px', textAlign: 'center'}}>
                <h1 style={{fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px'}}>
                  FORM M.P.M.V.R.- 44 (GCPA)
                </h1>
                <p style={{fontSize: '12px', marginTop: '2px'}}>[See Rule 72 (1), (C)]</p>
                <h2 style={{fontSize: '15px', fontWeight: 'bold', marginTop: '6px'}}>
                  An application in respect of Grant of goods Carriage permits
                </h2>
              </div>

              {/* To Section */}
              <div style={{marginBottom: '10px'}}>
                <p>To,</p>
                <p style={{marginLeft: '24px', marginTop: '4px'}}>The Regional Transport Authority</p>
                <div style={{borderBottom: '1.5px solid #000', width: '280px', minHeight: '16px', marginLeft: '24px', marginTop: '4px'}}>
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

              {/* Introduction */}
              <div style={{marginBottom: '8px', textAlign: 'justify'}}>
                <p>In accordance with the provisions of Section 69,77,78,79 and 80 of the Motor Vehicles Act. 1998 of the undersigned hereby apply for a goods carriers permits under section 66 of the M.V. Act. as here under set out of</p>
              </div>

              {/* Field 1 - Full Name */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>1.</span>
                <span style={{width: '220px', flexShrink: 0, marginRight: '10px'}}>Full name of the Applicant Company</span>
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

              {/* Age line */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center', justifyContent: 'flex-end'}}>
                <span style={{marginRight: '10px'}}>Age</span>
                <div style={{width: '100px', borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[2] = el}
                    type="text"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 2)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Field 2 - Father/Husband Name */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>2.</span>
                <span style={{width: '220px', flexShrink: 0, marginRight: '10px'}}>(Name) (Father's / Husband's Name)</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[3] = el}
                    type="text"
                    name="fatherHusbandName"
                    value={formData.fatherHusbandName}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 3)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Field 3 - Full Address */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>3.</span>
                <span style={{width: '180px', flexShrink: 0, marginRight: '10px'}}>Full Address H.No. / Road /Lane</span>
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

              {/* Additional address lines */}
              <div style={{marginLeft: '30px', marginBottom: '8px'}}>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px', marginBottom: '6px'}}>
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
              </div>

              {/* Locality/City/Pin */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center', marginLeft: '30px'}}>
                <span style={{width: '200px', flexShrink: 0, marginRight: '10px'}}>Name of locality/ City/ Form/ Pin Code</span>
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

              {/* Additional locality line */}
              <div style={{marginLeft: '30px', marginBottom: '8px'}}>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[7] = el}
                    type="text"
                    name="cityTownPin"
                    value={formData.cityTownPin}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 7)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Field 4 - Route or Area */}
              <div style={{display: 'flex', marginBottom: '8px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>4.</span>
                <span style={{width: '260px', flexShrink: 0, marginRight: '10px'}}>Route or Area for which the permit is desied</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[8] = el}
                    type="text"
                    name="routeArea"
                    value={formData.routeArea}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 8)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Field 5 - Nature of goods */}
              <div style={{display: 'flex', marginBottom: '10px', alignItems: 'center'}}>
                <span style={{width: '30px', flexShrink: 0}}>5.</span>
                <span style={{width: '260px', flexShrink: 0, marginRight: '10px'}}>The nature of goods proposut to be carried</span>
                <div style={{flex: 1, borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                  <input
                    ref={(el) => inputRefs.current[9] = el}
                    type="text"
                    name="natureOfGoods"
                    value={formData.natureOfGoods}
                    onChange={handleChange}
                    onKeyDown={(e) => handleKeyDown(e, 9)}
                    style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                  />
                </div>
              </div>

              {/* Field 6 - Vehicle Table */}
              <div style={{marginBottom: '10px'}}>
                <div style={{display: 'flex', alignItems: 'flex-start', marginBottom: '6px'}}>
                  <span style={{width: '30px', flexShrink: 0}}>6.</span>
                  <p style={{flex: 1}}>Type and capacity of vehcile (including trailer alternative trailers of articulated vehicle)</p>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th style={{width: '18%'}}>Registration<br/>Marks</th>
                      <th style={{width: '18%'}}>Make Type<br/>and No of<br/>vehicle</th>
                      <th style={{width: '16%'}}>Load<br/>Capacity</th>
                      <th style={{width: '16%'}}>Laden<br/>weight<br/>kg.</th>
                      <th style={{width: '16%'}}>Overrail<br/>length</th>
                      <th style={{width: '16%'}}>Width</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input
                          ref={(el) => inputRefs.current[10] = el}
                          type="text"
                          name="registrationMarks"
                          value={formData.registrationMarks}
                          onChange={handleChange}
                          onKeyDown={(e) => handleKeyDown(e, 10)}
                          style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '2px', textTransform: 'uppercase', fontWeight: '400', textAlign: 'center'}}
                        />
                      </td>
                      <td>
                        <input
                          ref={(el) => inputRefs.current[11] = el}
                          type="text"
                          name="makeType"
                          value={formData.makeType}
                          onChange={handleChange}
                          onKeyDown={(e) => handleKeyDown(e, 11)}
                          style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '2px', textTransform: 'uppercase', fontWeight: '400', textAlign: 'center'}}
                        />
                      </td>
                      <td>
                        <input
                          ref={(el) => inputRefs.current[12] = el}
                          type="text"
                          name="loadCapacity"
                          value={formData.loadCapacity}
                          onChange={handleChange}
                          onKeyDown={(e) => handleKeyDown(e, 12)}
                          style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '2px', textTransform: 'uppercase', fontWeight: '400', textAlign: 'center'}}
                        />
                      </td>
                      <td>
                        <input
                          ref={(el) => inputRefs.current[13] = el}
                          type="text"
                          name="ladenWeight"
                          value={formData.ladenWeight}
                          onChange={handleChange}
                          onKeyDown={(e) => handleKeyDown(e, 13)}
                          style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '2px', textTransform: 'uppercase', fontWeight: '400', textAlign: 'center'}}
                        />
                      </td>
                      <td>
                        <input
                          ref={(el) => inputRefs.current[14] = el}
                          type="text"
                          name="overallLength"
                          value={formData.overallLength}
                          onChange={handleChange}
                          onKeyDown={(e) => handleKeyDown(e, 14)}
                          style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '2px', textTransform: 'uppercase', fontWeight: '400', textAlign: 'center'}}
                        />
                      </td>
                      <td>
                        <input
                          ref={(el) => inputRefs.current[15] = el}
                          type="text"
                          name="width"
                          value={formData.width}
                          onChange={handleChange}
                          onKeyDown={(e) => handleKeyDown(e, 15)}
                          style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '2px', textTransform: 'uppercase', fontWeight: '400', textAlign: 'center'}}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Field 7 - Vehicle possession declaration */}
              <div style={{marginBottom: '8px'}}>
                <div style={{display: 'flex', alignItems: 'flex-start'}}>
                  <span style={{width: '30px', flexShrink: 0}}>7.</span>
                  <div style={{flex: 1}}>
                    <p style={{textAlign: 'justify'}}>I have not yet obtained possession on the vehicle and I understand that the permit will not be issued until have done. I have produced the certificate of registration and further declare that I proposet out cases vehicle manufactured in the year</p>
                    <div style={{borderBottom: '1.5px solid #000', minHeight: '16px', marginTop: '4px', width: '150px'}}>
                      <input
                        ref={(el) => inputRefs.current[16] = el}
                        type="text"
                        name="vehicleYear"
                        value={formData.vehicleYear}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 16)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Field 8 - Suspension/Cancellation */}
              <div style={{marginBottom: '8px'}}>
                <div style={{display: 'flex', alignItems: 'flex-start'}}>
                  <span style={{width: '30px', flexShrink: 0}}>8.</span>
                  <div style={{flex: 1}}>
                    <p style={{marginBottom: '4px'}}>Particulars of any goods carriage permit valid in any State and hold by the applicant which has been the subject of any order of suspension or cancellation</p>
                    <div style={{borderBottom: '1.5px solid #000', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[17] = el}
                        type="text"
                        name="suspensionDetails"
                        value={formData.suspensionDetails}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 17)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase', fontWeight: '400'}}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Field 9 - Certificate declaration */}
              <div style={{marginBottom: '12px'}}>
                <div style={{display: 'flex', alignItems: 'flex-start'}}>
                  <span style={{width: '30px', flexShrink: 0}}>9.</span>
                  <p style={{flex: 1, textAlign: 'justify'}}>I forward herewith the certificate of registration of the vehicle or I will produce the certificate of registration of the vehicle before permit issued.</p>
                </div>
              </div>

              {/* Signature section */}
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <span style={{marginRight: '10px'}}>Date</span>
                  <div style={{borderBottom: '1.5px solid #000', width: '150px', minHeight: '16px'}}></div>
                </div>
                <div style={{textAlign: 'center'}}>
                  <div style={{borderBottom: '1.5px solid #000', width: '250px', height: '40px', marginBottom: '4px'}}></div>
                  <p style={{fontSize: '11px'}}>Signature/thumb impression of the</p>
                  <p style={{fontSize: '11px'}}>Applicant</p>
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
              {!fetchingVehicle && !vehicleError && vehicleSearchNumber.trim().length >= 4 && formData.registrationMarks && (
                <p className="text-xs text-green-600">Data loaded</p>
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

export default Form44Modal
