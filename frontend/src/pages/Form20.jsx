import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const Form20 = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const printRef = useRef()

  const [formData, setFormData] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

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
          <title>FORM 20 - MOTOR VEHICLE REGISTRATION</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', serif; font-size: 11px; line-height: 1.2; padding: 15px 20px; }
            .form-container { width: 100%; }
            .title { text-align: center; margin-bottom: 12px; }
            .title h1 { font-size: 14px; font-weight: bold; letter-spacing: 8px; }
            .title h2 { font-size: 12px; font-weight: bold; margin-top: 2px; }
            .title p { font-size: 11px; }
            .to { margin-bottom: 10px; }
            .row { display: flex; margin-bottom: 1px; }
            .num { width: 25px; flex-shrink: 0; padding-top: 6px; }
            .label { width: 280px !important; flex-shrink: 0; margin-right: 15px; }
            .line { flex: 1; border-bottom: 1px solid #000; min-height: 14px; }
            .sub-row { display: flex; margin-left: 25px; margin-bottom: 6px; }
            .sub-label { width: 255px !important; flex-shrink: 0; margin-right: 15px; }
            .no-print { display: none !important; }
            .indent { margin-left: 12px; }
            input {
              border: none !important;
              background: transparent;
              outline: none;
              width: 100%;
              font-family: 'Times New Roman', serif;
              font-size: 11px;
            }
            .note { font-size: 10px; margin-left: 25px; }
            .section-title { text-align: center; font-weight: bold; margin: 12px 0 8px; border-top: 1px solid #000; padding-top: 8px; }
            .sig-row { display: flex; justify-content: space-around; margin-top: 8px; }
            .sig-box { text-align: center; width: 100px; }
            .sig-line { border-bottom: 1px solid #000; height: 25px; margin-top: 5px; }
            .flex-between { display: flex; justify-content: space-between; margin: 8px 0; }
            .border-note { border-left: 2px solid #000; padding-left: 6px; margin: 6px 25px; font-size: 10px; }
            @media print {
              body { padding: 10px 15px; }
              @page { margin: 8mm; size: A4; }
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
    <div className="min-h-screen pt-4 lg:pt-6 px-4 pb-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <button onClick={() => navigate('/forms')} className="flex items-center text-gray-600 hover:text-gray-800">
            <span className="mr-2">←</span> Back to Forms
          </button>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => handlePrint(true)} className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium">
              📄 PRINT EMPTY
            </button>
            <button onClick={() => handlePrint(false)} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              🖨️ PRINT FILLED
            </button>
            <button onClick={() => handlePrint(false)} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              📥 DOWNLOAD PDF
            </button>
          </div>
        </div>

        {/* Page Navigation */}
        <div className="flex justify-center gap-4 mb-4">
          <button onClick={() => setCurrentPage(1)} className={`px-6 py-2 rounded-lg font-medium ${currentPage === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            PAGE 1
          </button>
          <button onClick={() => setCurrentPage(2)} className={`px-6 py-2 rounded-lg font-medium ${currentPage === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            PAGE 2
          </button>
        </div>

        {/* Form Content */}
        <div ref={printRef} className="bg-white shadow-lg p-8" style={{fontFamily: "'Times New Roman', serif", fontSize: '13px', lineHeight: '1.3'}}>

          {currentPage === 1 && (
            <div className="form-container">
              {/* Title */}
              <div className="title text-center mb-4">
                <h1 className="text-base font-bold" style={{letterSpacing: '8px'}}>FORM -20</h1>
                <p className="text-sm">(See Rule 47)</p>
                <h2 className="text-sm font-bold mt-1">Form of Application for Registration of a Motor Vehicle</h2>
              </div>

              <p className="mb-4">To,<br/><span className="ml-8">The Registering Authority</span></p>

              {/* Field 1 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">1.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Full Name of person to be registered as</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="fullName" value={formData.fullName || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>registered owner</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>son / wife / daughter of</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="relation" value={formData.relation || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 2 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">2.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Age of the person to be registered as</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="age" value={formData.age || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>Registered owner</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>(Proof of age to be attached)</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>

              {/* Field 3 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">3.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Permanent address of the person to be</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="permanentAddress1" value={formData.permanentAddress1 || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>registered as registered owner</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="permanentAddress2" value={formData.permanentAddress2 || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>(Evidence to be produced)</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>

              {/* Field 4 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">4.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Temporary address of the person to be</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="tempAddress1" value={formData.tempAddress1 || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>registered as registered owner</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="tempAddress2" value={formData.tempAddress2 || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 5 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">5.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Name & address of the Dealer or Manufacture</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="dealerName" value={formData.dealerName || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>From whoms the vehicle was Purchased</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="dealerAddress1" value={formData.dealerAddress1 || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>(Sale certificate and certificate of road</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>worthines issued by the manufacture to be</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>enclosed.</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>

              {/* Field 6 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">6.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>If ex-army vehicle or Imported Vehicle</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="exArmy1" value={formData.exArmy1 || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>Enclosed proof. if locally manufacturer trailer</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>semi trailer enclosed the approval of design</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>by the state transport Authority and note</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>the proceedings number and date of approval</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>

              {/* Field 7 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">7.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Class of vehicle</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="vehicleClass" value={formData.vehicleClass || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>(if motor vehicle, Whether with or without gear)</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="withGear" value={formData.withGear || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 8 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">8.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>The Motor Vehicle is</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>a) A new vehicle:</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="newVehicle" value={formData.newVehicle || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>b) Ex-army vehicle:</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="exArmyVehicle" value={formData.exArmyVehicle || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>c) Imported vehicle:</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="importedVehicle" value={formData.importedVehicle || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 9 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">9.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Type of body</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="bodyType" value={formData.bodyType || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 10 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">10.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Type of vehicle</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="vehicleType" value={formData.vehicleType || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 11 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">11.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Maker's name</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="makerName" value={formData.makerName || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 12 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">12.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Month and year of manufacture</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="manufactureDate" value={formData.manufactureDate || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 13 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">13.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Number of cylinders</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="cylinders" value={formData.cylinders || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 14 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">14.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Horse power</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="horsePower" value={formData.horsePower || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 15 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">15.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Cubic capacity</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="cubicCapacity" value={formData.cubicCapacity || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 16 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">16.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Maker's classification or if not known</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="makerClass" value={formData.makerClass || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>wheel base</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>

              {/* Field 17 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">17.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Chassis number</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="chassisNumber" value={formData.chassisNumber || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>(Affix pencil print)</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>

              {/* Field 18 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">18.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Engine number</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="engineNumber" value={formData.engineNumber || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 19 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">19.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Seating capacity</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="seatingCapacity" value={formData.seatingCapacity || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>(including driver)</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>

              {/* Field 20 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">20.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Fuel used in the engine</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="fuelUsed" value={formData.fuelUsed || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 21 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">21.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Unloded weight</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="unladenWeight" value={formData.unladenWeight || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 22 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">22.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Particular of previous registration and</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="prevReg" value={formData.prevReg || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>registered number (if any)</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>

              {/* Field 23 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">23.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Colour or colours of body wings and front end</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="colour" value={formData.colour || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <p className="text-xs ml-7 mb-1">I hereby declare that the vehicle has not been registered in any state in India.</p>
              <p className="text-xs ml-7 mb-2">Additional particulars to be completed only in the case of transport vehicle other than motor car</p>

              {/* Field 24 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">24.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Number description and size of tyres</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>a) Front axle</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="frontAxle" value={formData.frontAxle || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>b) Rear axle</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="rearAxle" value={formData.rearAxle || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>c) Any other axle</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="otherAxle" value={formData.otherAxle || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>d) Tandom axle</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="tandomAxle" value={formData.tandomAxle || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              {/* Field 25 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">25.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Gross weight of Vehicle</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>a) As certified by the Manufacture</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="grossCertified" value={formData.grossCertified || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
                <span className="ml-2">Kgms</span>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>b) to be registered</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="grossRegistered" value={formData.grossRegistered || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
                <span className="ml-2">Kgms</span>
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
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">26.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Maximum axle Weight</span>
                <div className="line flex-1 border-b border-black"></div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>a) Front axle</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="maxFrontAxle" value={formData.maxFrontAxle || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>b) Rear axle</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="maxRearAxle" value={formData.maxRearAxle || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
                <span className="ml-2">Kgms</span>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>c) Any other axle</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="maxOtherAxle" value={formData.maxOtherAxle || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
                <span className="ml-2">Kgms</span>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>d) Tendom axle</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="maxTandomAxle" value={formData.maxTandomAxle || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
                <span className="ml-2">Kgms</span>
              </div>

              {/* Field 27 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">27.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>a) Overall length</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="overallLength" value={formData.overallLength || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>b) Overall width</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="overallWidth" value={formData.overallWidth || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>c) Overall height</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="overallHeight" value={formData.overallHeight || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>d) Overall hand</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="overallHand" value={formData.overallHand || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              <p className="text-xs border-l-2 border-black pl-2 my-3 ml-7">
                The above particulars are to be filled in for a rigid frame motor vehicle of two or more axles or an articulated vehicle of three or more axles, or to the extent applicable for trailer, where a second semi-trailer or additional semi-trailer are to be registered with an articulated motor vehicle, the following particulars are to be furnished of each semi-trailer.
              </p>

              {/* Fields 28-34 */}
              <div className="row flex">
                <span className="num w-7 flex-shrink-0">28.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Type of body</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="semiBodyType" value={formData.semiBodyType || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              <div className="row flex">
                <span className="num w-7 flex-shrink-0">29.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Unloding weight</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="semiUnladenWeight" value={formData.semiUnladenWeight || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              <div className="row flex">
                <span className="num w-7 flex-shrink-0">30.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Number description and size of tyres on</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="semiTyres1" value={formData.semiTyres1 || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '340px', flexShrink: 0}}>each axle</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="semiTyres2" value={formData.semiTyres2 || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              <div className="row flex">
                <span className="num w-7 flex-shrink-0">31.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>Maximum axle weight in respect of each axle</span>
                <div className="line flex-1 border-b border-black">
                  <input type="text" name="semiMaxAxle" value={formData.semiMaxAxle || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              <div className="row flex">
                <span className="num w-7 flex-shrink-0">32.</span>
                <span className="label" style={{width: '340px', flexShrink: 0}}>The vehicle is covered by a valid certificate</span>
                <span className="ml-4">Insurance Certificate or cover note</span>
              </div>
              <div className="row flex ml-7">
                <span className="label" style={{width: '200px', flexShrink: 0}}>of insurance under-chapter XI of the Act.</span>
                <span>No.</span>
                <div className="border-b border-black mx-2" style={{width: '80px'}}>
                  <input type="text" name="insuranceNo" value={formData.insuranceNo || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
                <span>Date</span>
                <div className="border-b border-black ml-2" style={{width: '80px'}}>
                  <input type="text" name="insuranceDate" value={formData.insuranceDate || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>
              <div className="row flex ml-7">
                <span>(Name of Company</span>
                <div className="border-b border-black mx-2" style={{width: '200px'}}>
                  <input type="text" name="insuranceCompany" value={formData.insuranceCompany || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
                <span>)</span>
              </div>

              <div className="row flex">
                <span className="num w-7 flex-shrink-0">33.</span>
                <span>The vehicle is exempted from insurance - the relevant order is enclosed.</span>
              </div>

              <div className="row flex">
                <span className="num w-7 flex-shrink-0">34.</span>
                <span>I have paid the prescribed fee of Rupees</span>
                <span className="ml-8">valid from</span>
                <div className="border-b border-black mx-2" style={{width: '80px'}}>
                  <input type="text" name="validFrom" value={formData.validFrom || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
                <span>to</span>
                <div className="border-b border-black ml-2" style={{width: '80px'}}>
                  <input type="text" name="validTo" value={formData.validTo || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <div className="flex items-end">
                  <span>Date</span>
                  <div className="border-b border-black ml-2" style={{width: '120px'}}>
                    <input type="text" name="formDate" value={formData.formDate || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                </div>
                <div className="text-center">
                  <div>Signature of the Person to be Registered</div>
                  <div>As registered owners,</div>
                </div>
              </div>

              <div className="mt-4 text-sm">
                <div>Note:- The motor vehicle above prescribed is:</div>
                <div className="flex items-end mt-1">
                  <span>i) Subject to hire purchase agreement / tease agree with</span>
                  <div className="border-b border-black ml-2 flex-1">
                    <input type="text" name="hirePurchase" value={formData.hirePurchase || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                </div>
                <div className="flex items-end mt-1">
                  <span>ii) Subject to hypothecation in favour of</span>
                  <div className="border-b border-black ml-2 flex-1">
                    <input type="text" name="hypothecation" value={formData.hypothecation || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                </div>
                <p className="text-xs mt-1">
                  III) Note held under hire purchase agreement or lease agreement or subject to hypothecation.
                  Strike out whatever is inapplicable, if the vehicle is subject to any such agreement the signature of the person with whom the agreement has been entered in to be obtained.
                </p>
              </div>

              <div className="flex justify-between mt-4 text-sm">
                <div>
                  <div>Signature of the person with whom an agreement of Hire</div>
                  <div>Purchase, Lease or Hypothecation has been entered in to.</div>
                  <div>Specimen signature of the person to be registered as registered owner.</div>
                </div>
                <div className="text-right">Signature of the owner</div>
              </div>

              <div className="flex justify-around mt-4">
                <div className="text-center">
                  <div>(1) (वेचने वाला)</div>
                  <div className="border-b border-black w-28 h-6 mt-1 mx-auto"></div>
                </div>
                <div className="text-center">
                  <div>(2) (वेचने वाला)</div>
                  <div className="border-b border-black w-28 h-6 mt-1 mx-auto"></div>
                </div>
                <div className="text-center">
                  <div>(3) (वेचने वाला)</div>
                  <div className="border-b border-black w-28 h-6 mt-1 mx-auto"></div>
                </div>
              </div>

              {/* Certificate */}
              <div className="text-center mt-6 border-t pt-3">
                <h3 className="font-bold">CERTIFICATE</h3>
                <h4 className="font-bold">INSPECTED THE VEHICLE</h4>
              </div>

              <p className="mt-3 text-sm">
                Certified that the particulars contained in the application are true and that the vehicle complaies with the requirements of the motor vehicle Act. 1988 and rules made there under.
              </p>

              <div className="flex justify-between mt-4">
                <div className="flex items-end">
                  <span>Date</span>
                  <div className="border-b border-black ml-2" style={{width: '120px'}}>
                    <input type="text" name="certDate" value={formData.certDate || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                </div>
                <div className="text-right">Signature of the Inspecting Authority</div>
              </div>

              <div className="flex justify-center gap-8 mt-3">
                <div className="flex items-end">
                  <span>Name</span>
                  <div className="border-b border-black ml-2" style={{width: '150px'}}>
                    <input type="text" name="inspectorName" value={formData.inspectorName || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                </div>
                <div className="flex items-end">
                  <span>Designation</span>
                  <div className="border-b border-black ml-2" style={{width: '120px'}}>
                    <input type="text" name="inspectorDesignation" value={formData.inspectorDesignation || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                </div>
              </div>

              {/* Office Endorsement */}
              <div className="text-center mt-6 border-t pt-3">
                <h3 className="font-bold">FOR OFFICE ENDORSEMENT</h3>
              </div>

              <div className="mt-3 text-sm space-y-1">
                <div className="flex items-end flex-wrap gap-1">
                  <span>Ref. Number</span>
                  <div className="border-b border-black" style={{width: '100px'}}>
                    <input type="text" name="refNumber" value={formData.refNumber || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                  <span>office of the -</span>
                  <div className="border-b border-black" style={{width: '80px'}}>
                    <input type="text" name="officeName" value={formData.officeName || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                  <span>Dated</span>
                  <div className="border-b border-black" style={{width: '80px'}}>
                    <input type="text" name="endorseDate" value={formData.endorseDate || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                </div>
                <div className="flex items-end flex-wrap gap-1">
                  <span>The</span>
                  <div className="border-b border-black" style={{width: '100px'}}>
                    <input type="text" name="theVehicle" value={formData.theVehicle || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                  <span>bearing chasses number</span>
                  <div className="border-b border-black" style={{width: '120px'}}>
                    <input type="text" name="endorseChassisNo" value={formData.endorseChassisNo || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                  <span>and</span>
                </div>
                <div className="flex items-end flex-wrap gap-1">
                  <span>number</span>
                  <div className="border-b border-black" style={{width: '120px'}}>
                    <input type="text" name="engineNo2" value={formData.engineNo2 || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                  <span>has been assigned the registration number</span>
                  <div className="border-b border-black" style={{width: '100px'}}>
                    <input type="text" name="regNumber" value={formData.regNumber || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                </div>
                <div className="flex items-end gap-1">
                  <span>and registered in the name of</span>
                  <div className="border-b border-black flex-1">
                    <input type="text" name="regName" value={formData.regName || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                </div>
                <div className="flex items-end gap-1">
                  <span>and vehicle is subject to an agreement of hire purchase/ lease/ hypothecation</span>
                  <div className="border-b border-black" style={{width: '100px'}}>
                    <input type="text" name="agreement" value={formData.agreement || ''} onChange={handleChange} className="w-full outline-none bg-transparent" style={{border:'none'}} />
                  </div>
                </div>
                <div>To,</div>
                <div className="flex justify-between mt-2">
                  <div>
                    <div>(Name and address of the financier)</div>
                    <div>By registered post to dealer under proper acknowledgement.</div>
                  </div>
                  <div className="text-right">Registering Authority</div>
                </div>
              </div>

              <div className="flex justify-between mt-6 no-print">
                <button onClick={() => setCurrentPage(1)} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium">
                  ← PREVIOUS PAGE
                </button>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => handlePrint(true)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium">
                    📄 PRINT EMPTY
                  </button>
                  <button onClick={() => handlePrint(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    🖨️ PRINT FILLED
                  </button>
                  <button onClick={() => handlePrint(false)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                    📥 DOWNLOAD PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Form20
