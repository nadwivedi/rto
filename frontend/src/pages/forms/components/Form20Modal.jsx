import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const Form20Modal = ({ onClose }) => {
  const printRef = useRef()
  const inputRefs = useRef([])
  const [currentPage, setCurrentPage] = useState(1)
  const [vehicleSearchNumber, setVehicleSearchNumber] = useState('')
  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    relation: '',
    age: '',
    permanentAddress: '',
    tempAddress: '',
    dealerName: '',
    exArmy: '',
    vehicleClass: '',
    withGear: '',
    newVehicle: '',
    exArmyVehicle: '',
    importedVehicle: '',
    bodyType: '',
    vehicleType: '',
    makerName: '',
    manufactureDate: '',
    cylinders: '',
    horsePower: '',
    cubicCapacity: '',
    makerClass: '',
    chassisNumber: '',
    engineNumber: '',
    seatingCapacity: '',
    fuelUsed: '',
    unladenWeight: '',
    prevReg: '',
    colour: '',
    frontAxle: '',
    rearAxle: '',
    otherAxle: '',
    tandomAxle: '',
    grossCertified: '',
    grossRegistered: '',
    maxFrontAxle: '',
    maxRearAxle: '',
    maxOtherAxle: '',
    maxTandomAxle: '',
    overallLength: '',
    overallWidth: '',
    overallHeight: '',
    overallHand: '',
    semiBodyType: '',
    semiUnladenWeight: '',
    semiTyres: '',
    semiMaxAxle: '',
    insuranceNo: '',
    insuranceDate: '',
    insuranceCompany: '',
    validFrom: '',
    validTo: '',
    formDate: '',
    hirePurchase: '',
    hypothecation: '',
    certDate: '',
    inspectorName: '',
    inspectorDesignation: '',
    refNumber: '',
    officeName: '',
    endorseDate: '',
    theVehicle: '',
    endorseChassisNo: '',
    engineNo2: '',
    regNumber: '',
    regName: '',
    agreement: ''
  })

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
            relation: vehicleData.sonWifeDaughterOf || prev.relation,
            permanentAddress: vehicleData.address || prev.permanentAddress,
            chassisNumber: vehicleData.chassisNumber || prev.chassisNumber,
            engineNumber: vehicleData.engineNumber || prev.engineNumber,
            makerName: vehicleData.makerModel || prev.makerName,
            manufactureDate: vehicleData.manufactureYear || prev.manufactureDate,
            unladenWeight: vehicleData.unladenWeight || prev.unladenWeight,
            colour: vehicleData.colour || prev.colour,
            seatingCapacity: vehicleData.seatingCapacity || prev.seatingCapacity,
            fuelUsed: vehicleData.fuelType || prev.fuelUsed,
            cylinders: vehicleData.numberOfCylinders || prev.cylinders,
            cubicCapacity: vehicleData.cubicCapacity || prev.cubicCapacity
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
          <title>FORM 20 - Motor Vehicle Registration</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.4; padding: 5px 20px; }
            .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
            input {
              border: none !important;
              background: transparent;
              outline: none;
              width: 100%;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12px;
              padding: 0 2px;
              transform: scaleY(1.333) !important;
            }
            div[style*="border-bottom"] {
              border-bottom: 2px solid #000 !important;
              min-height: 13px !important;
              transform: scaleY(0.75) !important;
              transform-origin: bottom !important;
            }
            div[style*="border-bottom"] span {
              transform: scaleY(1.333) !important;
            }
            span[style*="marginRight: '40px'"] {
              margin-right: 40px !important;
            }
            div[style*="flex: 0.9"] {
              flex: 0.9 !important;
            }
            .no-print { display: none !important; }
            @media print {
              body { padding: 3mm 10mm; margin: 0; }
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

          {/* Page Navigation - Above form */}
          <div className="flex justify-center gap-4 mb-2 no-print">
            <button
              onClick={() => setCurrentPage(1)}
              className={`px-6 py-2 rounded-lg font-medium ${currentPage === 1 ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
            >
              PAGE 1
            </button>
            <button
              onClick={() => setCurrentPage(2)}
              className={`px-6 py-2 rounded-lg font-medium ${currentPage === 2 ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
            >
              PAGE 2
            </button>
          </div>

          <div
            ref={printRef}
            className="bg-white shadow-lg mx-auto"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '20mm',
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: '12px',
              lineHeight: '1.4'
            }}
          >
            {currentPage === 1 && (
              <div className="form-container">
                {/* Title */}
                <div style={{textAlign: 'center', marginBottom: '5px'}}>
                  <h1 style={{fontSize: '18px', fontWeight: 'bold', letterSpacing: '4px'}}>FORM - 20</h1>
                  <p style={{fontSize: '11px', marginTop: '2px'}}>(See Rule 47)</p>
                  <h2 style={{fontSize: '13px', fontWeight: 'bold', marginTop: '5px'}}>Form of Application for Registration of a Motor Vehicle</h2>
                </div>

                {/* To Section */}
                <div style={{marginBottom: '12px'}}>
                  <p>To,</p>
                  <p style={{marginLeft: '24px'}}>The Registering Authority Raipur</p>
                </div>

                {/* Field 1 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>1.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Full name of person to be registered as registered owner</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[0] = el}
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 0)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>son / wife / daughter of</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[1] = el}
                      type="text"
                      name="relation"
                      value={formData.relation}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 1)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 2 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>2.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px', lineHeight: '1.2'}}>Age of the person to be registered as Registered owner (Proof of age to be attached)</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[2] = el}
                      type="text"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 2)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 3 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>3.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px', lineHeight: '1.2'}}>Permanent address of the person to be registered as registered owner (Evidence to be produced)</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[3] = el}
                      type="text"
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 3)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 4 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>4.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px', lineHeight: '1.2'}}>Temporary address of the person to be registered as registered owner</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[4] = el}
                      type="text"
                      name="tempAddress"
                      value={formData.tempAddress}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 4)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 5 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>5.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px', lineHeight: '1.2'}}>Name & address of the Dealer or Manufacturer from whoms the vehicle was Purchased (Sale certificate and certificate of road Worthiness issued by the manufacturer to be enclosed)</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[5] = el}
                      type="text"
                      name="dealerName"
                      value={formData.dealerName}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 5)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 6 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>6.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px', lineHeight: '1.2'}}>If ex-army vehicle or imported vehicle enclosed proof if locally manufacturer trailer, semi trailer enclosed the approval of design by the State Transport Authority and note the proceedings number and date of approval</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[6] = el}
                      type="text"
                      name="exArmy"
                      value={formData.exArmy}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 6)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 7 */}
                <div style={{display: 'flex', marginBottom: '4px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>7.</span>
                  <div style={{width: '280px', flexShrink: 0, marginRight: '40px', lineHeight: '1.2'}}>
                    <div>Class of vehicle</div>
                    <div>(if motor cycle, Whether with or without gear)</div>
                  </div>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[7] = el}
                      type="text"
                      name="vehicleClass"
                      value={formData.vehicleClass}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 7)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 8 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>8.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>The motor vehicle is</span>
                  <div style={{flex: 1}}></div>
                </div>
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>a) A new vehicle</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[8] = el}
                      type="text"
                      name="newVehicle"
                      value={formData.newVehicle}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 8)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>b) Ex - Army vehicle :</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[9] = el}
                      type="text"
                      name="exArmyVehicle"
                      value={formData.exArmyVehicle}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 9)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>c) Imported vehicle</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[10] = el}
                      type="text"
                      name="importedVehicle"
                      value={formData.importedVehicle}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 10)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 9 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>9.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Type of body</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[11] = el}
                      type="text"
                      name="bodyType"
                      value={formData.bodyType}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 11)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 10 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>10.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Type of vehicle</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[12] = el}
                      type="text"
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 12)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 11 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>11.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Maker's Name</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[13] = el}
                      type="text"
                      name="makerName"
                      value={formData.makerName}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 13)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 12 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>12.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Month and year of manufacturer</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[14] = el}
                      type="text"
                      name="manufactureDate"
                      value={formData.manufactureDate}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 14)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 13 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>13.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Number of cylinders</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[15] = el}
                      type="text"
                      name="cylinders"
                      value={formData.cylinders}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 15)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 14 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>14.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Horse Power</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[16] = el}
                      type="text"
                      name="horsePower"
                      value={formData.horsePower}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 16)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 15 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>15.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Cubic capacity</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[17] = el}
                      type="text"
                      name="cubicCapacity"
                      value={formData.cubicCapacity}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 17)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 16 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>16.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Maker's classification or if not known wheel base</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[18] = el}
                      type="text"
                      name="makerClass"
                      value={formData.makerClass}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 18)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 17 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>17.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Chassis Number (Affix pencil print)</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[19] = el}
                      type="text"
                      name="chassisNumber"
                      value={formData.chassisNumber}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 19)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 18 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>18.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Engine Number</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[20] = el}
                      type="text"
                      name="engineNumber"
                      value={formData.engineNumber}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 20)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 19 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>19.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Seating Capacity (including driver)</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[21] = el}
                      type="text"
                      name="seatingCapacity"
                      value={formData.seatingCapacity}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 21)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 20 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>20.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Fuel used in the engine</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[22] = el}
                      type="text"
                      name="fuelUsed"
                      value={formData.fuelUsed}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 22)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 21 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>21.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Unloaded weight</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[23] = el}
                      type="text"
                      name="unladenWeight"
                      value={formData.unladenWeight}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 23)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 22 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>22.</span>
                  <div style={{width: '280px', flexShrink: 0, marginRight: '40px', lineHeight: '1.2'}}>
                    <div>Particular of previous registration</div>
                    <div>registered number (if any)</div>
                  </div>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[24] = el}
                      type="text"
                      name="prevReg"
                      value={formData.prevReg}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 24)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 23 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>23.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Colour or colours of body wings and front end</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[25] = el}
                      type="text"
                      name="colour"
                      value={formData.colour}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 25)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                <p style={{fontSize: '10px', fontStyle: 'italic', marginLeft: '30px', marginBottom: '2px', marginTop: '2px'}}>I hereby declare that the vehicle has not been registered in any state in india</p>
                <p style={{fontSize: '10px', fontStyle: 'italic', marginLeft: '30px', marginBottom: '4px'}}>Additional particulars to be completed only in the case of transport vehicle other than motor car</p>

                {/* Field 24 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>24.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Number description and size of tyres</span>
                  <div style={{flex: 1}}></div>
                </div>
                <div style={{display: 'flex', marginBottom: '3px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>(a) Front axle</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[26] = el}
                      type="text"
                      name="frontAxle"
                      value={formData.frontAxle}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 26)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>
                <div style={{display: 'flex', marginBottom: '3px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>(b) Rear axle</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[27] = el}
                      type="text"
                      name="rearAxle"
                      value={formData.rearAxle}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 27)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>
                <div style={{display: 'flex', marginBottom: '3px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>(c) Any other axle</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[28] = el}
                      type="text"
                      name="otherAxle"
                      value={formData.otherAxle}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 28)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>
                <div style={{display: 'flex', marginBottom: '3px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>(d) Tandem axle</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[29] = el}
                      type="text"
                      name="tandomAxle"
                      value={formData.tandomAxle}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 29)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 25 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>25.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Gross weight of vehicle</span>
                  <div style={{flex: 1}}></div>
                </div>
                <div style={{display: 'flex', marginBottom: '3px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>a) As certified by the Manufacture</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px', display: 'flex', alignItems: 'baseline'}}>
                    <input
                      ref={(el) => inputRefs.current[30] = el}
                      type="text"
                      name="grossCertified"
                      value={formData.grossCertified}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 30)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                    <span style={{marginLeft: '8px', flexShrink: 0}}>Kgms</span>
                  </div>
                </div>
                <div style={{display: 'flex', marginBottom: '3px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>b) To be registered</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px', display: 'flex', alignItems: 'baseline'}}>
                    <input
                      ref={(el) => inputRefs.current[31] = el}
                      type="text"
                      name="grossRegistered"
                      value={formData.grossRegistered}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 31)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                    <span style={{marginLeft: '8px', flexShrink: 0}}>Kgms</span>
                  </div>
                </div>

                <div className="flex justify-end mt-6 no-print">
                  <button onClick={() => setCurrentPage(2)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                    NEXT PAGE →
                  </button>
                </div>
              </div>
            )}

            {currentPage === 2 && (
              <div className="form-container">
                {/* Field 26 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>26.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Maximum axle Weight</span>
                  <div style={{flex: 1}}></div>
                </div>
                <div style={{display: 'flex', marginBottom: '2px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>a) Front axle</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px', display: 'flex', alignItems: 'baseline'}}>
                    <input
                      ref={(el) => inputRefs.current[32] = el}
                      type="text"
                      name="maxFrontAxle"
                      value={formData.maxFrontAxle}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 32)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                    <span style={{marginLeft: '8px', flexShrink: 0}}>Kgms</span>
                  </div>
                </div>
                <div style={{display: 'flex', marginBottom: '2px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>b) Rear axle</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px', display: 'flex', alignItems: 'baseline'}}>
                    <input
                      ref={(el) => inputRefs.current[33] = el}
                      type="text"
                      name="maxRearAxle"
                      value={formData.maxRearAxle}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 33)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                    <span style={{marginLeft: '8px', flexShrink: 0}}>Kgms</span>
                  </div>
                </div>
                <div style={{display: 'flex', marginBottom: '2px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>c) Any other axle</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px', display: 'flex', alignItems: 'baseline'}}>
                    <input
                      ref={(el) => inputRefs.current[34] = el}
                      type="text"
                      name="maxOtherAxle"
                      value={formData.maxOtherAxle}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 34)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                    <span style={{marginLeft: '8px', flexShrink: 0}}>Kgms</span>
                  </div>
                </div>
                <div style={{display: 'flex', marginBottom: '2px', alignItems: 'baseline', marginLeft: '30px'}}>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>d) Tandem axle</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px', display: 'flex', alignItems: 'baseline'}}>
                    <input
                      ref={(el) => inputRefs.current[35] = el}
                      type="text"
                      name="maxTandomAxle"
                      value={formData.maxTandomAxle}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 35)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                    <span style={{marginLeft: '8px', flexShrink: 0}}>Kgms</span>
                  </div>
                </div>

                {/* Field 27 */}
                <div style={{display: 'flex', marginBottom: '2px', marginTop: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>27.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>a) Overall length</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[36] = el}
                      type="text"
                      name="overallLength"
                      value={formData.overallLength}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 36)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>
                <div style={{display: 'flex', marginBottom: '2px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}></span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>b) Overall width</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[37] = el}
                      type="text"
                      name="overallWidth"
                      value={formData.overallWidth}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 37)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>
                <div style={{display: 'flex', marginBottom: '2px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}></span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>c) Overall height</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[38] = el}
                      type="text"
                      name="overallHeight"
                      value={formData.overallHeight}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 38)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>
                <div style={{display: 'flex', marginBottom: '2px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}></span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>d) Overall hand</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[39] = el}
                      type="text"
                      name="overallHand"
                      value={formData.overallHand}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 39)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                <p style={{fontSize: '11px', fontStyle: 'normal', margin: '8px 0 6px 0', marginLeft: '30px'}}>
                  The above particulars are to be filled in for a rigid frame motor vehicle of two or more axles or an articulated vehicle of three or more axles, or to the extend applicable for trailer, where a second semi trailer or additional semi - trailer are to be registered with an articulated motor vehicle, the following particulars are to be furnished of each semi-trailer.
                </p>

                {/* Field 28 */}
                <div style={{display: 'flex', marginBottom: '3px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>28.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Type of body</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[40] = el}
                      type="text"
                      name="semiBodyType"
                      value={formData.semiBodyType}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 40)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 29 */}
                <div style={{display: 'flex', marginBottom: '3px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>29.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Unloading weight</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[41] = el}
                      type="text"
                      name="semiUnladenWeight"
                      value={formData.semiUnladenWeight}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 41)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 30 */}
                <div style={{display: 'flex', marginBottom: '3px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>30.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Number description and size of tyres on each axle</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[42] = el}
                      type="text"
                      name="semiTyres"
                      value={formData.semiTyres}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 42)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 31 */}
                <div style={{display: 'flex', marginBottom: '3px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>31.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>Maximum axle weight in respect of each axle</span>
                  <div style={{flex: 0.9, borderBottom: '2px solid #000', minHeight: '16px'}}>
                    <input
                      ref={(el) => inputRefs.current[43] = el}
                      type="text"
                      name="semiMaxAxle"
                      value={formData.semiMaxAxle}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 43)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 32 */}
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px', alignItems: 'baseline'}}>
                  <div style={{display: 'flex', gap: '6px', flexShrink: 0}}>
                    <span>32.</span>
                    <span>The Vehicle is covered by a valid certificate Insurance certificate or Cover note of insurance under Chapter XI of the Act</span>
                  </div>
                  <div style={{borderBottom: '2px solid #000', minHeight: '16px', width: '120px'}}>
                    <input
                      ref={(el) => inputRefs.current[44] = el}
                      type="text"
                      name="insuranceNo"
                      value={formData.insuranceNo}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 44)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                  <span>No.</span>
                  <div style={{borderBottom: '2px solid #000', minHeight: '16px', width: '100px'}}>
                    <input
                      ref={(el) => inputRefs.current[45] = el}
                      type="text"
                      name="insuranceDate"
                      value={formData.insuranceDate}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 45)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                  <span>Date</span>
                  <div style={{borderBottom: '2px solid #000', minHeight: '16px', width: '80px'}}>
                    <input
                      ref={(el) => inputRefs.current[46] = el}
                      type="text"
                      name="insuranceCompany"
                      value={formData.insuranceCompany}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 46)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                  <span>of</span>
                  <span>(Name of Company)</span>
                  <div style={{borderBottom: '2px solid #000', minHeight: '16px', width: '120px'}}>
                    <input
                      ref={(el) => inputRefs.current[47] = el}
                      type="text"
                      name="validFrom"
                      value={formData.validFrom}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 47)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                  <span>valid from</span>
                  <div style={{borderBottom: '2px solid #000', minHeight: '16px', width: '100px'}}>
                    <input
                      ref={(el) => inputRefs.current[48] = el}
                      type="text"
                      name="validTo"
                      value={formData.validTo}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 48)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                  <span>to</span>
                  <div style={{borderBottom: '2px solid #000', minHeight: '16px', width: '100px'}}>
                    <input
                      ref={(el) => inputRefs.current[49] = el}
                      type="text"
                      name="validToEnd"
                      value={formData.validToEnd}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 49)}
                      style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                    />
                  </div>
                </div>

                {/* Field 33 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>33.</span>
                  <span>The vehicle is exempted from insurance the relevant order is enclosed</span>
                </div>

                {/* Field 34 */}
                <div style={{display: 'flex', marginBottom: '6px', alignItems: 'baseline'}}>
                  <span style={{width: '30px', flexShrink: 0}}>34.</span>
                  <span style={{width: '280px', flexShrink: 0, marginRight: '40px'}}>I have paid the prescribed fee of Rupees</span>
                  <div style={{flex: 1, display: 'flex', gap: '10px', alignItems: 'baseline'}}>
                    <span>valid from</span>
                    <div style={{borderBottom: '2px solid #000', minHeight: '16px', width: '100px'}}>
                      <input
                        ref={(el) => inputRefs.current[47] = el}
                        type="text"
                        name="validFrom"
                        value={formData.validFrom}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 47)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                    <span>to</span>
                    <div style={{borderBottom: '2px solid #000', minHeight: '16px', width: '100px'}}>
                      <input
                        ref={(el) => inputRefs.current[48] = el}
                        type="text"
                        name="validTo"
                        value={formData.validTo}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 48)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                  </div>
                </div>

                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '20px'}}>
                  <div style={{display: 'flex', alignItems: 'baseline'}}>
                    <span>Date</span>
                    <div style={{borderBottom: '2px solid #000', marginLeft: '16px', width: '150px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[49] = el}
                        type="text"
                        name="formDate"
                        value={formData.formDate}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 49)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div>Signature of the person to be registered</div>
                    <div>as registered owner</div>
                  </div>
                </div>

                {/* Note Section */}
                <div style={{marginTop: '12px', fontSize: '10px'}}>
                  <div style={{marginBottom: '3px', fontWeight: 'normal'}}>Note <span style={{marginLeft: '8px'}}>The motor vehicle above prescribed is</span></div>
                  <div style={{display: 'flex', alignItems: 'baseline', marginBottom: '3px', marginLeft: '20px'}}>
                    <span style={{width: '20px', flexShrink: 0}}>i)</span>
                    <span style={{width: '350px', flexShrink: 0, marginRight: '20px'}}>Subject to hire purchase agreement / lease agreement with</span>
                    <div style={{borderBottom: '2px solid #000', minHeight: '16px', width: '200px'}}>
                      <input
                        ref={(el) => inputRefs.current[50] = el}
                        type="text"
                        name="hirePurchase"
                        value={formData.hirePurchase}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 50)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '10px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'baseline', marginBottom: '3px', marginLeft: '20px'}}>
                    <span style={{width: '20px', flexShrink: 0}}>ii)</span>
                    <span style={{width: '350px', flexShrink: 0, marginRight: '20px'}}>Subject to hypothecation in favour of</span>
                    <div style={{borderBottom: '2px solid #000', minHeight: '16px', width: '200px'}}>
                      <input
                        ref={(el) => inputRefs.current[51] = el}
                        type="text"
                        name="hypothecation"
                        value={formData.hypothecation}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 51)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '10px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                  </div>
                  <div style={{marginLeft: '20px', lineHeight: '1.3', marginBottom: '0px'}}>
                    <span style={{width: '20px', display: 'inline-block'}}>iii)</span>
                    <span>Note held under hire purchase agreement or lease agreement or subject to hypothecation.  Strike out whatever is inapplicable,if the</span>
                  </div>
                </div>

                <div style={{fontSize: '10px', marginTop: '0px', lineHeight: '1.2', marginLeft: '40px'}}>
                 vehicle is subject to any such agreement the signature of the person with whom the agreement has been entered into is to be obtained.
                </div>

                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px'}}>
                  <div>
                    <div>Signature of the person with whom as agreement of Hire -</div>
                    <div>Purchase Lease or hypothecation has been entered into</div>
                    <div>Specimen signature of the person to be registered as registered owner</div>
                  </div>
                  <div style={{textAlign: 'right'}}>Signature of the owner</div>
                </div>

                <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '12px'}}>
                  <div style={{textAlign: 'center'}}>
                    <div>(1)</div>
                    <div style={{borderBottom: '2px solid #000', width: '100px', height: '30px', marginTop: '4px'}}></div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div>(2)</div>
                    <div style={{borderBottom: '2px solid #000', width: '100px', height: '30px', marginTop: '4px'}}></div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div>(3)</div>
                    <div style={{borderBottom: '2px solid #000', width: '100px', height: '30px', marginTop: '4px'}}></div>
                  </div>
                </div>

                {/* Certificate Section */}
                <div style={{textAlign: 'center', marginTop: '12px', borderTop: '2px solid #000', paddingTop: '8px'}}>
                  <h3 style={{fontWeight: 'bold', fontSize: '14px'}}>CERTIFICATE</h3>
                  <h4 style={{fontWeight: 'bold', fontSize: '13px'}}>INSPECTED THE VEHICLE</h4>
                </div>

                <div style={{marginTop: '8px', fontSize: '11px', textAlign: 'center'}}>
                  <div>Certificate that the particulars contained in the application are true and that the vehicle complains with the</div>
                  <div>requirements of the motor vehicle Act 1988 and rules made there under</div>
                </div>

                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '10px'}}>
                  <div style={{display: 'flex', alignItems: 'baseline'}}>
                    <span>Date</span>
                    <div style={{borderBottom: '2px solid #000', marginLeft: '16px', width: '150px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[52] = el}
                        type="text"
                        name="certDate"
                        value={formData.certDate}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 52)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>Signature of the Inspecting Authority</div>
                </div>

                <div style={{display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '8px'}}>
                  <div style={{display: 'flex', alignItems: 'baseline'}}>
                    <span>Name</span>
                    <div style={{borderBottom: '2px solid #000', marginLeft: '8px', width: '150px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[53] = el}
                        type="text"
                        name="inspectorName"
                        value={formData.inspectorName}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 53)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                  </div>
                  <div style={{display: 'flex', alignItems: 'baseline'}}>
                    <span>Designation</span>
                    <div style={{borderBottom: '2px solid #000', marginLeft: '8px', width: '120px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[54] = el}
                        type="text"
                        name="inspectorDesignation"
                        value={formData.inspectorDesignation}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 54)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                  </div>
                </div>

                {/* Office Endorsement */}
                <div style={{textAlign: 'center', marginTop: '12px', borderTop: '2px solid #000', paddingTop: '8px'}}>
                  <h3 style={{fontWeight: 'bold', fontSize: '14px'}}>FOR OFFICE ENDORSEMENT</h3>
                </div>

                <div style={{marginTop: '12px', fontSize: '11px'}}>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'baseline', marginBottom: '6px'}}>
                    <span>Ref. Number</span>
                    <div style={{borderBottom: '2px solid #000', width: '150px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[55] = el}
                        type="text"
                        name="refNumber"
                        value={formData.refNumber}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 55)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                    <span>office of the</span>
                    <div style={{borderBottom: '2px solid #000', width: '120px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[56] = el}
                        type="text"
                        name="officeName"
                        value={formData.officeName}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 56)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                    <span>dated</span>
                    <div style={{borderBottom: '2px solid #000', width: '100px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[57] = el}
                        type="text"
                        name="endorseDate"
                        value={formData.endorseDate}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 57)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                  </div>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'baseline', marginBottom: '6px'}}>
                    <span>The</span>
                    <div style={{borderBottom: '2px solid #000', width: '180px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[58] = el}
                        type="text"
                        name="theVehicle"
                        value={formData.theVehicle}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 58)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                    <span>bearing chasses number</span>
                    <div style={{borderBottom: '2px solid #000', width: '200px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[59] = el}
                        type="text"
                        name="endorseChassisNo"
                        value={formData.endorseChassisNo}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 59)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                    <span>and</span>
                  </div>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'baseline', marginBottom: '6px'}}>
                    <span>Number</span>
                    <div style={{borderBottom: '2px solid #000', width: '200px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[60] = el}
                        type="text"
                        name="engineNo2"
                        value={formData.engineNo2}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 60)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                    <span>has been assigned the registration number</span>
                    <div style={{borderBottom: '2px solid #000', width: '200px', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[61] = el}
                        type="text"
                        name="regNumber"
                        value={formData.regNumber}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 61)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '6px'}}>
                    <span>and registered in the name of</span>
                    <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[62] = el}
                        type="text"
                        name="regName"
                        value={formData.regName}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 62)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '6px'}}>
                    <span>and vehicle is subject to an agreement of hire purchase / lease / hypothecation</span>
                    <div style={{flex: 1, borderBottom: '2px solid #000', minHeight: '16px'}}>
                      <input
                        ref={(el) => inputRefs.current[63] = el}
                        type="text"
                        name="agreement"
                        value={formData.agreement}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 63)}
                        style={{border:'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "Arial, Helvetica, sans-serif", fontSize: '12px', padding: '0 2px', textTransform: 'uppercase'}}
                      />
                    </div>
                  </div>
                  <div style={{marginTop: '8px'}}>To,</div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '8px'}}>
                    <div>
                      <div>(Name and address of the financier)</div>
                      <div>By registered post to dealer under proper acknowledgement</div>
                    </div>
                    <div style={{textAlign: 'right'}}>Registering Authority</div>
                  </div>
                </div>

                <div className="flex justify-between mt-6 no-print">
                  <button onClick={() => setCurrentPage(1)} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium">
                    ← PREVIOUS PAGE
                  </button>
                </div>
              </div>
            )}
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
              {!fetchingVehicle && !vehicleError && vehicleSearchNumber.trim().length >= 4 && formData.chassisNumber && (
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

export default Form20Modal
