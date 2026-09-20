import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

const NewFormModal = ({ onClose }) => {
  const { user } = useAuth()
  const printRef = useRef()
  const inputRefs = useRef([])
  const [vehicleSearchNumber, setVehicleSearchNumber] = useState('')
  const [fetchingVehicle, setFetchingVehicle] = useState(false)
  const [vehicleError, setVehicleError] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 'all', 'buyer', 'seller', 'form29', 'form30', 'transfer_decl', 'sale_letter'

  const [formData, setFormData] = useState({
    // Common / Vehicle Details
    vehicleNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    engineNumber: '',
    chassisNumber: '',
    courtLocation: '',
    rtoLocation: '',

    // Buyer / Transferee Details (Current)
    buyerName: '',
    buyerFather: '',
    buyerResidence: '',
    buyerPO: '',
    buyerPS: '',
    buyerDistrict: '',
    buyerState: '',
    buyerPIN: '',
    buyerPAN: '',
    buyerMobile: '',
    buyerOtherID: '',
    buyerAPResidence: '',
    buyerAPPS: '',
    buyerAPDistrict: '',
    buyerAge: '',

    // Buyer Permanent Details
    buyerPermAddress: '',
    buyerPermPO: '',
    buyerPermPS: '',
    buyerPermDistrict: '',
    buyerPermState: '',
    buyerPermPIN: '',

    // Seller / Transferor Details
    sellerName: '',
    sellerFather: '',
    sellerResidence: '',
    sellerPO: '',
    sellerPS: '',
    sellerDistrict: '',
    sellerState: '',
    sellerPIN: '',
    sellerPAN: '',
    sellerMobile: '',
    sellerOtherID: '',
    sellerAPResidence: '',
    sellerAPPS: '',
    sellerAPDistrict: '',

    // Form 29 & 30 specific
    saleDay: '',
    saleMonthYear: '',
    financierDetails: '',
    suspensionDetails: '',
    endorsementRefNo: '',
    endorsementOffice: '',
    endorsementEffectDate: '',

    // Sale Letter & Transfer Decl Specific
    saleAmount: '',
    saleAmountWords: '',
    saleDate: new Date().toLocaleDateString('en-GB'),
    date: new Date().toLocaleDateString('en-GB')
  })

  // Removed automatic district prefill per user requirement so user can freely specify
  const handleDistrictChange = (e) => {
    const val = e.target.value.toUpperCase()
    setFormData(prev => ({
      ...prev,
      courtLocation: val,
      rtoLocation: val,
      buyerDistrict: val,
      buyerPermDistrict: val,
      sellerDistrict: val,
      endorsementOffice: val ? `RTO ${val}` : ''
    }))
  }

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
            vehicleModel: vehicleData.makerModel || vehicleData.model || prev.vehicleModel,
            engineNumber: vehicleData.engineNumber || prev.engineNumber,
            chassisNumber: vehicleData.chassisNumber || prev.chassisNumber,
            sellerName: vehicleData.ownerName || prev.sellerName,
            sellerFather: vehicleData.sonWifeDaughterOf || prev.sellerFather,
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

  const handlePrint = (printEmpty = false, specificSection = null) => {
    let printContent = printRef.current
    if (specificSection) {
      const el = document.getElementById(specificSection)
      if (el) printContent = el
    }

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
          <title>New Form - ${formData.vehicleNumber || 'Vehicle Transfer Set'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 13px;
              line-height: 1.5;
              padding: 10px;
              font-weight: 500;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page-break {
              page-break-after: always;
              break-after: page;
              margin-bottom: 25px;
            }
            .form-sheet {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              padding: 15mm 15mm;
              min-height: 275mm;
            }
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
            .photo-box {
              width: 90px;
              height: 110px;
              border: 1px dashed #555;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-size: 10px;
              color: #555;
              padding: 4px;
              line-height: 1.2;
            }
            @media print {
              body { padding: 0; margin: 0; }
              .page-break {
                page-break-after: always !important;
                break-after: page !important;
                margin-bottom: 0;
              }
              .form-sheet {
                padding: 12mm 15mm;
                min-height: 285mm;
              }
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

  // Page 1 (form.docx layout): dotted-line field + row style
  const p1Row = { display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '9px' }
  const p1In = (i, name, extra = {}) => (
    <div style={{ flex: 1, minWidth: 0, borderBottom: '1.5px dotted #000', minHeight: '18px', ...extra }}>
      <input
        ref={(el) => (inputRefs.current[i] = el)}
        type="text"
        name={name}
        value={formData[name]}
        onChange={handleChange}
        onKeyDown={(e) => handleKeyDown(e, i)}
        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px', textAlign: extra.textAlign || 'left' }}
      />
    </div>
  )

  const handleClear = () => {
    setFormData({
      vehicleNumber: '',
      vehicleMake: '',
      vehicleModel: '',
      engineNumber: '',
      chassisNumber: '',
      courtLocation: '',
      rtoLocation: '',
      buyerName: '',
      buyerFather: '',
      buyerResidence: '',
      buyerPO: '',
      buyerPS: '',
      buyerDistrict: '',
      buyerState: '',
      buyerPIN: '',
      buyerPAN: '',
      buyerMobile: '',
      buyerOtherID: '',
      buyerAPResidence: '',
      buyerAPPS: '',
      buyerAPDistrict: '',
      buyerAge: '',
      buyerPermAddress: '',
      buyerPermPO: '',
      buyerPermPS: '',
      buyerPermDistrict: '',
      buyerPermState: '',
      buyerPermPIN: '',
      sellerName: '',
      sellerFather: '',
      sellerResidence: '',
      sellerPO: '',
      sellerPS: '',
      sellerDistrict: '',
      sellerState: '',
      sellerPIN: '',
      sellerPAN: '',
      sellerMobile: '',
      sellerOtherID: '',
      sellerAPResidence: '',
      sellerAPPS: '',
      sellerAPDistrict: '',
      saleDay: '',
      saleMonthYear: '',
      financierDetails: '',
      suspensionDetails: '',
      endorsementRefNo: '',
      endorsementOffice: '',
      endorsementEffectDate: '',
      saleAmount: '',
      saleAmountWords: '',
      saleDate: new Date().toLocaleDateString('en-GB'),
      date: new Date().toLocaleDateString('en-GB')
    })
    setVehicleSearchNumber('')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-start justify-center z-[70] overflow-y-auto pt-2 pb-6 px-2">
      <div className="w-full max-w-[1300px] flex flex-col lg:flex-row gap-4">
        {/* Main Document Content */}
        <div className="flex-1 bg-gray-200/80 rounded-2xl p-3 shadow-inner overflow-x-auto">
          {/* Section View Tabs */}
          <div className="flex items-center gap-1.5 mb-3 bg-white p-2 rounded-xl shadow-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📄 All 6 Pages (Combined)
            </button>
            <button
              onClick={() => setActiveTab('buyer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'buyer' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              1. Buyer Affidavit
            </button>
            <button
              onClick={() => setActiveTab('seller')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'seller' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              2. Seller Affidavit
            </button>
            <button
              onClick={() => setActiveTab('form29')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'form29' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              3. FORM 29
            </button>
            <button
              onClick={() => setActiveTab('form30')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'form30' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              4. FORM 30
            </button>
            <button
              onClick={() => setActiveTab('transfer_decl')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'transfer_decl' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              5. Transfer Declaration
            </button>
            <button
              onClick={() => setActiveTab('sale_letter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'sale_letter' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              6. Sale Letter
            </button>
          </div>

          <div ref={printRef} className="space-y-6">
            {/* ================= PAGE 1: BUYER AFFIDAVIT ================= */}
            {(activeTab === 'all' || activeTab === 'buyer') && (
              <div
                id="sec-buyer-affidavit"
                className="bg-white shadow-2xl mx-auto rounded-sm form-sheet page-break"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '18mm 22mm',
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '14px',
                  lineHeight: '1.7',
                  color: '#000'
                }}
              >
                {/* Text taken as-is from form.docx page 1 */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <p style={{ fontWeight: 'bold' }}>Before,</p>
                  <p style={{ fontWeight: 'bold' }}>Executive magistrate/Notary Public</p>
                  <div style={{ width: '260px', margin: '4px auto 0' }}>{p1In(1000, 'courtLocation', { textAlign: 'center' })}</div>
                  <p style={{ fontWeight: 'bold', marginTop: '8px' }}>(Affidavit)</p>
                </div>

                <div style={p1Row}><span>I</span>{p1In(1001, 'buyerName')}</div>
                <div style={p1Row}><span>S/o, D/o, W/o</span>{p1In(1002, 'buyerFather')}</div>
                <div style={p1Row}><span>Residence of</span>{p1In(1003, 'buyerResidence')}<span>P. O.</span>{p1In(1004, 'buyerPO', { flex: 'none', width: '150px' })}</div>
                <div style={p1Row}><span>P. S.</span>{p1In(1005, 'buyerPS')}<span>District</span>{p1In(1006, 'buyerDistrict')}</div>
                <div style={p1Row}><span>(A/P resident of</span>{p1In(1007, 'buyerAPResidence')}</div>
                <div style={p1Row}><span>P. S.</span>{p1In(1008, 'buyerAPPS')}<span>Dist</span>{p1In(1009, 'buyerAPDistrict')}</div>

                <p style={{ marginTop: '14px' }}>Do hareby solemnly affirm and declare a follws -</p>

                <div style={p1Row}><span>1. That have purchased the vehicle</span>{p1In(1010, 'vehicleMake')}</div>
                <div style={p1Row}><span>Boaring registration No.</span>{p1In(1011, 'vehicleNumber')}</div>
                <div style={p1Row}><span>Engine No.</span>{p1In(1012, 'engineNumber')}<span>Chassis No.</span>{p1In(1013, 'chassisNumber')}</div>
                <div style={p1Row}><span>from Sri</span>{p1In(1014, 'sellerName')}</div>
                <div style={p1Row}><span>S/o, D/o, W/o</span>{p1In(1015, 'sellerFather')}</div>
                <div style={p1Row}><span>Resident of</span>{p1In(1016, 'sellerResidence')}</div>
                <div style={p1Row}><span>P. S.</span>{p1In(1017, 'sellerPS')}<span>Distt</span>{p1In(1018, 'sellerDistrict')}</div>
                <div style={p1Row}><span>A/o Resident of</span>{p1In(1019, 'sellerAPResidence')}</div>
                <div style={p1Row}><span>P. S.</span>{p1In(1020, 'sellerAPPS')}<span>Distt</span>{p1In(1021, 'sellerAPDistrict')}</div>

                <p style={{ marginTop: '14px' }}>2.That neither any case nor govt. dues stands against this vehicle up to the date of affidavit and if is l am fully responsible for the same.</p>
                <p style={{ marginTop: '10px' }}>3.That the ownership of the vehiche aforesaid may be transforred in the name of the purchaser above named for which I have got to objection, hence this affidavit.</p>
                <p style={{ marginTop: '10px' }}>That the above content of this affidavit are true and correct to the best of my knowledge and belief.</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '50px' }}>
                  <div>
                    <p>I identified the deponent</p>
                    <p>Who, has signed or given L.T.I.</p>
                    <p>in my presence</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 'bold' }}>DEPONENT</p>
                    <p>(Signature in Full)</p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= PAGE 2: SELLER AFFIDAVIT ================= */}
            {(activeTab === 'all' || activeTab === 'seller') && (
              <div
                id="sec-seller-affidavit"
                className="bg-white shadow-2xl mx-auto rounded-sm form-sheet page-break"
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
                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 'bold' }}>In The Court of</p>
                  <h1 style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    Executive Magistrate / Notary Public
                  </h1>
                  <div style={{ display: 'inline-flex', alignItems: 'baseline', marginTop: '2px', minWidth: '160px', borderBottom: '1px dotted #000' }}>
                    <input
                      ref={(el) => (inputRefs.current[17] = el)}
                      type="text"
                      name="courtLocation"
                      value={formData.courtLocation}
                      onChange={handleChange}
                      onKeyDown={(e) => handleKeyDown(e, 17)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', textAlign: 'center', fontFamily: "'Times New Roman', Times, serif", fontSize: '13px', fontWeight: 'bold' }}
                    />
                  </div>
                  <h2 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px', marginTop: '10px' }}>
                    (Seller Affidavit)
                  </h2>
                </div>

                <div style={{ textAlign: 'justify', lineHeight: '1.8', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 'bold' }}>I</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', margin: '0 6px', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[18] = el)}
                        type="text"
                        name="sellerName"
                        value={formData.sellerName}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 18)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '4px' }}>
                    <span>S/o, D/o, W/o</span>
                    <div style={{ flex: 1, borderBottom: '1.5px dotted #000', marginLeft: '6px', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[19] = el)}
                        type="text"
                        name="sellerFather"
                        value={formData.sellerFather}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 19)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    <span>Residence of</span>
                    <div style={{ flex: 1, minWidth: '160px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[20] = el)}
                        type="text"
                        name="sellerResidence"
                        value={formData.sellerResidence}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 20)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                    <span>P.O.</span>
                    <div style={{ width: '120px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[21] = el)}
                        type="text"
                        name="sellerPO"
                        value={formData.sellerPO}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 21)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    <span>P.S.</span>
                    <div style={{ width: '150px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[22] = el)}
                        type="text"
                        name="sellerPS"
                        value={formData.sellerPS}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 22)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                    <span>Dist</span>
                    <div style={{ flex: 1, minWidth: '140px', borderBottom: '1.5px dotted #000', minHeight: '18px' }}>
                      <input
                        ref={(el) => (inputRefs.current[23] = el)}
                        type="text"
                        name="sellerDistrict"
                        value={formData.sellerDistrict}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 23)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </div>
                  </div>

                  <p style={{ marginTop: '8px' }}>
                    Do hereby solemnly affirm and declare on oath as under: -
                  </p>
                </div>

                <div style={{ textAlign: 'justify', lineHeight: '1.7', marginBottom: '16px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <p>
                      <strong>1.</strong> That I am the registered owner of vehicle make{' '}
                      <span style={{ display: 'inline-block', borderBottom: '1.5px dotted #000', minWidth: '140px' }}>
                        <input
                          ref={(el) => (inputRefs.current[24] = el)}
                          type="text"
                          name="vehicleMake"
                          value={formData.vehicleMake}
                          onChange={handleChange}
                          onKeyDown={(e) => handleKeyDown(e, 24)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                        />
                      </span>{' '}
                      Bearing its Reg. No.{' '}
                      <span style={{ display: 'inline-block', borderBottom: '1.5px dotted #000', minWidth: '140px' }}>
                        <input
                          ref={(el) => (inputRefs.current[25] = el)}
                          type="text"
                          name="vehicleNumber"
                          value={formData.vehicleNumber}
                          onChange={handleChange}
                          onKeyDown={(e) => handleKeyDown(e, 25)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                        />
                      </span>{' '}
                      Engine No.{' '}
                      <span style={{ display: 'inline-block', borderBottom: '1.5px dotted #000', minWidth: '160px' }}>
                        <input
                          ref={(el) => (inputRefs.current[26] = el)}
                          type="text"
                          name="engineNumber"
                          value={formData.engineNumber}
                          onChange={handleChange}
                          onKeyDown={(e) => handleKeyDown(e, 26)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                        />
                      </span>{' '}
                      Chassis No.{' '}
                      <span style={{ display: 'inline-block', borderBottom: '1.5px dotted #000', minWidth: '180px' }}>
                        <input
                          ref={(el) => (inputRefs.current[27] = el)}
                          type="text"
                          name="chassisNumber"
                          value={formData.chassisNumber}
                          onChange={handleChange}
                          onKeyDown={(e) => handleKeyDown(e, 27)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                        />
                      </span>.
                    </p>
                  </div>

                  <p style={{ marginBottom: '8px' }}>
                    <strong>2.</strong> That I have sold the above-mentioned vehicle to Shri/Smt.{' '}
                    <span style={{ display: 'inline-block', borderBottom: '1.5px dotted #000', minWidth: '180px' }}>
                      <input
                        ref={(el) => (inputRefs.current[28] = el)}
                        type="text"
                        name="buyerName"
                        value={formData.buyerName}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 28)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                      />
                    </span>{' '}
                    S/o, W/o, D/o Shri{' '}
                    <span style={{ display: 'inline-block', borderBottom: '1.5px dotted #000', minWidth: '160px' }}>
                      <input
                        ref={(el) => (inputRefs.current[29] = el)}
                        type="text"
                        name="buyerFather"
                        value={formData.buyerFather}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 29)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                      />
                    </span>{' '}
                    R/o{' '}
                    <span style={{ display: 'inline-block', borderBottom: '1.5px dotted #000', minWidth: '180px' }}>
                      <input
                        ref={(el) => (inputRefs.current[30] = el)}
                        type="text"
                        name="buyerResidence"
                        value={formData.buyerResidence}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 30)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </span>{' '}
                    P.O.{' '}
                    <span style={{ display: 'inline-block', borderBottom: '1.5px dotted #000', minWidth: '100px' }}>
                      <input
                        ref={(el) => (inputRefs.current[31] = el)}
                        type="text"
                        name="buyerPO"
                        value={formData.buyerPO}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 31)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </span>{' '}
                    P.S.{' '}
                    <span style={{ display: 'inline-block', borderBottom: '1.5px dotted #000', minWidth: '110px' }}>
                      <input
                        ref={(el) => (inputRefs.current[32] = el)}
                        type="text"
                        name="buyerPS"
                        value={formData.buyerPS}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 32)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </span>{' '}
                    Dist.{' '}
                    <span style={{ display: 'inline-block', borderBottom: '1.5px dotted #000', minWidth: '130px' }}>
                      <input
                        ref={(el) => (inputRefs.current[33] = el)}
                        type="text"
                        name="buyerDistrict"
                        value={formData.buyerDistrict}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 33)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '14px', fontWeight: 'bold', padding: '0 2px' }}
                      />
                    </span>{' '}
                    and have handed over physical delivery along with all relevant documents to the purchaser.
                  </p>

                  <p style={{ marginBottom: '8px' }}>
                    <strong>3.</strong> That I have received full and final sale consideration amount from the purchaser and now have no claim, lien or title on the said vehicle.
                  </p>

                  <p style={{ marginBottom: '8px' }}>
                    <strong>4.</strong> That all taxes, challans and liabilities up to the date of sale have been cleared by me.
                  </p>

                  <p style={{ marginBottom: '8px' }}>
                    <strong>5.</strong> That the vehicle is free from all encumbrances, hire purchase, hypothecation or court attachment.
                  </p>
                </div>

                <div style={{ marginTop: '16px', lineHeight: '1.7', textAlign: 'justify' }}>
                  <p style={{ fontWeight: 'bold' }}>Verification:</p>
                  <p>
                    Verified at <strong>{formData.courtLocation || '.....................'}</strong> on this <strong>{formData.date}</strong> that the contents of above affidavit are true and correct to the best of my knowledge and belief and nothing material has been concealed therein.
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px' }}>
                  <div>
                    <p>Date: <strong>{formData.date}</strong></p>
                    <p>Place: <strong>{formData.courtLocation}</strong></p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ minHeight: '35px', borderBottom: '1px solid #000', minWidth: '180px' }}></p>
                    <p style={{ fontWeight: 'bold', marginTop: '4px' }}>Deponent / Seller</p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= PAGE 3: FORM 29 ================= */}
            {(activeTab === 'all' || activeTab === 'form29') && (
              <div
                id="sec-form29"
                className="bg-white shadow-2xl mx-auto rounded-sm form-sheet page-break"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '14mm 16mm',
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '12px',
                  lineHeight: '1.45',
                  color: '#000'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <h1 style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '2px' }}>FORM 29</h1>
                  <p style={{ fontSize: '11px', marginTop: '1px' }}>[See Rule 55(1)]</p>
                  <h2 style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '3px' }}>NOTICE OF TRANSFER OF OWNERSHIP OF A MOTOR VEHICLE</h2>
                  <p style={{ fontSize: '10px', marginTop: '2px', fontStyle: 'italic' }}>(To be made in duplicate and the duplicate copy with the endorsement of the Registering Authority to be returned to the transferor immediately on making entries of transfer of ownership in certificate of Registration and Form 24)</p>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <p style={{ fontWeight: 'bold' }}>To</p>
                  <p style={{ marginLeft: '20px' }}>The Registering Authority <strong>{formData.rtoLocation || '..............................................................'}</strong> (in whose jurisdiction the Transferee resides)</p>
                </div>

                <div style={{ textAlign: 'justify', lineHeight: '1.6', marginBottom: '10px' }}>
                  <p>
                    I/We <strong>{formData.sellerName || '...................................................'}</strong> resident of <strong>{formData.sellerResidence || '........................................................................................................................'}</strong> have on the{' '}
                    <span style={{ display: 'inline-block', borderBottom: '1.5px dotted #000', minWidth: '60px' }}>
                      <input
                        ref={(el) => (inputRefs.current[34] = el)}
                        type="text"
                        name="saleDay"
                        value={formData.saleDay}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 34)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                      />
                    </span>{' '}
                    day of the year{' '}
                    <span style={{ display: 'inline-block', borderBottom: '1.5px dotted #000', minWidth: '80px' }}>
                      <input
                        ref={(el) => (inputRefs.current[35] = el)}
                        type="text"
                        name="saleMonthYear"
                        value={formData.saleMonthYear}
                        onChange={handleChange}
                        onKeyDown={(e) => handleKeyDown(e, 35)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                      />
                    </span>{' '}
                    Sold and delivered my / our Vehicle No <strong>{formData.vehicleNumber || '........................................'}</strong> make <strong>{formData.vehicleMake || '........................................'}</strong> Chassis No <strong>{formData.chassisNumber || '....................................................................................'}</strong> [Engine number] <strong>{formData.engineNumber || '....................................................................................'}</strong> to Shri / Smt <strong>{formData.buyerName || '....................................................................................'}</strong> Son/Wife/Daughter of <strong>{formData.buyerFather || '....................................................................................'}</strong> residing at <strong>{formData.buyerResidence || '........................................................................................................................................................................'}</strong> (House No./Street/Village/Town/Distt. And State) under an agreement of hire purchase/lease/ hypothecation with <strong>{formData.financierDetails || '................................................................................................................................'}</strong>
                  </p>
                  <p style={{ marginTop: '6px' }}>The Registration Certificate and Insurance Certificate have been handed over to him /her / them.</p>
                  <p style={{ marginTop: '3px' }}>To the best of my/our knowledge and belief the vehicle is not superdari and free from all encumbrances and information furnished is true. I/We undertake to hold my/our self-responsible for any inaccuracy or suppression of information.</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', marginBottom: '12px' }}>
                  <div style={{ width: '45%' }}>
                    <p style={{ borderBottom: '1.5px dotted #000', minHeight: '20px' }}></p>
                    <p style={{ fontWeight: 'bold', fontSize: '11px' }}>Signature of the Financier (as his consent)</p>
                  </div>
                  <div style={{ width: '48%', textAlign: 'right' }}>
                    <p style={{ borderBottom: '1.5px dotted #000', minHeight: '20px' }}></p>
                    <p style={{ fontWeight: 'bold', fontSize: '11px' }}>Signature or thumb impression of Registered Owner (Transferor)</p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <p>Date: <strong>{formData.date}</strong></p>
                  <p style={{ fontWeight: 'bold' }}>I/We (Transferee)</p>
                </div>

                <div style={{ marginBottom: '10px', borderTop: '1px dashed #666', paddingTop: '8px' }}>
                  <p>Copy to the Registering Authority <strong>{formData.rtoLocation || '..............................................................'}</strong> in whose jurisdiction the transferor resides.</p>
                  <p style={{ marginTop: '2px' }}>Note: To be sent to the Registering Authority by Registered Post Acknowledgment Due.</p>
                </div>

                <div style={{ border: '1px solid #000', padding: '6px 10px', marginTop: '8px' }}>
                  <h3 style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>OFFICE ENDORSEMENT</h3>
                  <p style={{ fontSize: '11px' }}>Ref. No. <strong>{formData.endorsementRefNo || '.....................'}</strong> Office of the <strong>{formData.endorsementOffice || '..................................................'}</strong></p>
                  <p style={{ fontSize: '11px', marginTop: '2px' }}>The ownership of the vehicle has been transferred to the name of <strong>{formData.buyerName || '..................................................'}</strong> with effect from <strong>{formData.endorsementEffectDate || '.....................'}</strong></p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px' }}>
                    <p>Date: <strong>{formData.date}</strong></p>
                    <p style={{ fontWeight: 'bold' }}>Registering Authority (Office Seal)</p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= PAGE 4: FORM 30 ================= */}
            {(activeTab === 'all' || activeTab === 'form30') && (
              <div
                id="sec-form30"
                className="bg-white shadow-2xl mx-auto rounded-sm form-sheet page-break"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '12mm 15mm',
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '11px',
                  lineHeight: '1.4',
                  color: '#000'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h1 style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' }}>FORM 30</h1>
                  <p style={{ fontSize: '10px' }}>[See Rule 55(2) and 55(3)]</p>
                  <h2 style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px' }}>APPLICATION FOR INTIMATION AND TRANSFER OF OWNERSHIP OF A MOTOR VEHICLE</h2>
                  <p style={{ fontSize: '9.5px', fontStyle: 'italic' }}>(To be made in duplicate if the vehicle is held under an agreement of Hire Purchase/Lease/Hypothecation)</p>
                </div>

                <div style={{ borderBottom: '1px solid #333', paddingBottom: '6px', marginBottom: '6px' }}>
                  <h3 style={{ textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>PART I - FOR THE USE OF THE TRANSFEROR</h3>
                  <p style={{ fontWeight: 'bold' }}>To</p>
                  <p style={{ marginLeft: '16px' }}>The Registering Authority <strong>{formData.rtoLocation || '..............................................................'}</strong></p>

                  <div style={{ marginTop: '4px', textAlign: 'justify', lineHeight: '1.45' }}>
                    <p>
                      I/We <strong>{formData.sellerName || '...................................................'}</strong> Son/Wife/Daughter of <strong>{formData.sellerFather || '...................................................'}</strong> residing at <strong>{formData.sellerResidence || '........................................................................................................................'}</strong> have on the <strong>{formData.saleDay || '.......'}</strong> day of <strong>{formData.saleMonthYear || '.......'}</strong> sold and delivered my/our motor vehicle No. <strong>{formData.vehicleNumber || '........................................'}</strong> make <strong>{formData.vehicleMake || '........................................'}</strong> Chassis No. <strong>{formData.chassisNumber || '....................................................................................'}</strong> Engine No. <strong>{formData.engineNumber || '....................................................................................'}</strong> to Shri/Smt. <strong>{formData.buyerName || '....................................................................................'}</strong> Son/Wife/Daughter of <strong>{formData.buyerFather || '....................................................................................'}</strong> residing at <strong>{formData.buyerResidence || '........................................................................................................................'}</strong>.
                    </p>
                    <p style={{ marginTop: '2px' }}>I/We hereby declare that I/We have submitted the transfer intimation along with relevant documents.</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                    <p>Date: <strong>{formData.date}</strong></p>
                    <p style={{ fontWeight: 'bold' }}>Signature or thumb impression of the Transferor</p>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid #333', paddingBottom: '6px', marginBottom: '6px' }}>
                  <h3 style={{ textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>PART II - FOR THE USE OF THE TRANSFEREE</h3>
                  <p style={{ fontWeight: 'bold' }}>To</p>
                  <p style={{ marginLeft: '16px' }}>The Registering Authority <strong>{formData.rtoLocation || '..............................................................'}</strong></p>

                  <div style={{ marginTop: '4px', textAlign: 'justify', lineHeight: '1.45' }}>
                    <p>
                      I/We <strong>{formData.buyerName || '...................................................'}</strong> Son/Wife/Daughter of <strong>{formData.buyerFather || '...................................................'}</strong> Age{' '}
                      <span style={{ display: 'inline-block', borderBottom: '1.5px dotted #000', minWidth: '40px' }}>
                        <input
                          ref={(el) => (inputRefs.current[36] = el)}
                          type="text"
                          name="buyerAge"
                          value={formData.buyerAge}
                          onChange={handleChange}
                          onKeyDown={(e) => handleKeyDown(e, 36)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'Times New Roman', Times, serif", fontSize: '11px', fontWeight: 'bold', textAlign: 'center', padding: '0 2px' }}
                        />
                      </span>{' '}
                      residing at <strong>{formData.buyerResidence || '........................................................................................................................'}</strong> hereby declare that I/We have on this <strong>{formData.saleDay || '.......'}</strong> day of the year <strong>{formData.saleMonthYear || '.......'}</strong> purchased the motor vehicle bearing registration number <strong>{formData.vehicleNumber || '.....................'}</strong> from <strong>{formData.sellerName || '.....................'}</strong>.
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                    <p>Date: <strong>{formData.date}</strong></p>
                    <p style={{ fontWeight: 'bold' }}>Signature or thumb impression of the Transferee</p>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #444', paddingTop: '4px', marginBottom: '4px' }}>
                  <h4 style={{ textAlign: 'center', fontSize: '10.5px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>CONSENT OF THE FINANCIER</h4>
                  <p style={{ fontSize: '10px', lineHeight: '1.3' }}>I/We being a party to an agreement of hire-purchase/lease/hypothecation give consent to the transfer of ownership.</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '6px', fontSize: '10.5px' }}>
                    <p>Date: <strong>{formData.date}</strong></p>
                    <p style={{ fontWeight: 'bold' }}>Signature of the Financier</p>
                  </div>
                </div>

                <div style={{ border: '1px solid #000', padding: '4px 6px', marginTop: '4px' }}>
                  <h4 style={{ textAlign: 'center', fontSize: '10.5px', fontWeight: 'bold', marginBottom: '2px' }}>OFFICE ENDORSEMENT</h4>
                  <p style={{ fontSize: '10px' }}>Ref.No. <strong>{formData.endorsementRefNo || '.....................'}</strong> Office of the <strong>{formData.endorsementOffice || '..........................................'}</strong></p>
                  <p style={{ fontSize: '10px', marginTop: '1px' }}>The transfer of ownership of vehicle has been recorded with effect from <strong>{formData.endorsementEffectDate || '.....................'}</strong> in the Registration Record.</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '6px', fontSize: '10px' }}>
                    <p>Date: <strong>{formData.date}</strong></p>
                    <p style={{ fontWeight: 'bold' }}>Signature of the Registering Authority</p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= PAGE 5: TRANSFER DECLARATION (हस्तांतरण घोषणा) ================= */}
            {(activeTab === 'all' || activeTab === 'transfer_decl') && (
              <div
                id="sec-transfer-declaration"
                className="bg-white shadow-2xl mx-auto rounded-sm form-sheet page-break text-black"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '12mm 15mm',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontSize: '12px',
                  lineHeight: '1.45',
                  color: '#000'
                }}
              >
                <div className="text-center mb-3">
                  <h1 className="text-[17px] font-bold tracking-wide border-b-2 border-black inline-block pb-0.5">
                    वाहन स्वामित्व हस्तांतरण से संबंधित -
                  </h1>
                </div>

                <div className="space-y-2 mb-3 text-[12px]">
                  <div className="flex flex-wrap items-baseline gap-1 leading-6">
                    <span>1. मैं प्रमाणित करता हूँ कि वाहन संख्या</span>
                    <input
                      ref={el => (inputRefs.current[37] = el)}
                      type="text"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 37)}
                      className="border-b border-black font-bold uppercase px-1 text-center w-36 focus:outline-none focus:bg-amber-50"
                    />
                    <span>चेसिस संख्या</span>
                    <input
                      ref={el => (inputRefs.current[38] = el)}
                      type="text"
                      name="chassisNumber"
                      value={formData.chassisNumber}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 38)}
                      className="border-b border-black font-bold uppercase px-1 text-center flex-1 min-w-[150px] focus:outline-none focus:bg-amber-50"
                    />
                  </div>

                  <div className="flex flex-wrap items-baseline gap-1 leading-6">
                    <span>दिनांक</span>
                    <input
                      ref={el => (inputRefs.current[39] = el)}
                      type="text"
                      name="saleDate"
                      value={formData.saleDate}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 39)}
                      className="border-b border-black font-bold px-1 text-center w-28 focus:outline-none focus:bg-amber-50"
                    />
                    <span>को</span>
                    <input
                      ref={el => (inputRefs.current[40] = el)}
                      type="text"
                      name="buyerName"
                      value={formData.buyerName}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 40)}
                      className="border-b border-black font-bold uppercase px-1 flex-1 min-w-[200px] focus:outline-none focus:bg-amber-50"
                    />
                    <span>को विक्रय कर दिया हूँ।</span>
                  </div>

                  <div>
                    2. उक्त वाहन पर किसी भी प्रकार का Civil/ Criminal Case किसी भी न्यायालय अथवा थाना में दर्ज नहीं है।
                  </div>

                  <div>
                    3. उक्त वाहन किसी भी गैर कानूनी गतिविधि में ना तो लगा हुआ था और ना ही लगाया जायेगा।
                  </div>

                  <div>
                    4. उक्त वाहन का मार्गकर/फिटनेस/ बीमा/ परमिट/ प्रदूषण आदि सभी प्रकार के कागजात अद्यतन हैं तथा छाया प्रति संलग्न है। उक्त वाहन किसी थाने अथवा किसी मामले में जब्त नहीं है।
                  </div>
                </div>

                <div className="mb-2 text-[11.5px] italic">
                  उपरोक्त कथन पूरी तरह सत्य एवं दुरुस्त है इसमें किसी भी प्रकार की गलती पाये जाने पर इसकी सारी जवाबदेही मेरी होगी तथा मुझपर कानूनी कार्रवाई की जा सकती है।
                </div>

                <div className="flex justify-end mb-3">
                  <div className="text-right pt-4">
                    <div className="font-bold text-[12px]">वाहन स्वामी का हस्ताक्षर</div>
                  </div>
                </div>

                <div className="mb-1 text-[11.5px] italic">
                  वाहन मालिक का उपरोक्त कथन पूर्णतः सत्य एवं दुरुस्त है तथा मेरी जानकारी में है, मैं इससे सहमत हूँ। तथा सोच समझकर वाहन खरीदा हूँ।
                </div>

                <div className="flex justify-end mb-3">
                  <div className="text-right pt-3">
                    <div className="font-bold text-[12px]">वाहन क्रेता का हस्ताक्षर</div>
                  </div>
                </div>

                {/* 2 Columns: Seller Left, Buyer Right */}
                <div className="grid grid-cols-2 gap-3 border-t-2 border-black pt-3">
                  {/* Left: Seller Details */}
                  <div className="border-r border-gray-400 pr-3">
                    <div className="font-bold text-[11px] mb-2 leading-tight">
                      वाहन स्वामी का नाम/ पता <span className="font-normal">(कृपया अंग्रेजी के बड़े अक्षर में भरें)</span>
                    </div>

                    <div className="flex gap-2 mb-2 items-start">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[11px] whitespace-nowrap">नाम :-</span>
                          <input
                            ref={el => (inputRefs.current[41] = el)}
                            type="text"
                            name="sellerName"
                            value={formData.sellerName}
                            onChange={handleChange}
                            onKeyDown={e => handleKeyDown(e, 41)}
                            className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                          />
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[11px] whitespace-nowrap">पिता/पति :-</span>
                          <input
                            ref={el => (inputRefs.current[42] = el)}
                            type="text"
                            name="sellerFather"
                            value={formData.sellerFather}
                            onChange={handleChange}
                            onKeyDown={e => handleKeyDown(e, 42)}
                            className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                          />
                        </div>
                      </div>
                      <div className="photo-box flex-shrink-0 w-[85px] h-[100px] border border-dashed border-gray-600 flex flex-col items-center justify-center text-center p-1 text-[9px] text-gray-500">
                        <span>Paste recent</span>
                        <span>passport size</span>
                        <span>photo</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-baseline gap-1">
                        <span className="whitespace-nowrap">पता :-</span>
                        <input
                          ref={el => (inputRefs.current[43] = el)}
                          type="text"
                          name="sellerResidence"
                          value={formData.sellerResidence}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 43)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="whitespace-nowrap">पोस्ट :-</span>
                        <input
                          ref={el => (inputRefs.current[44] = el)}
                          type="text"
                          name="sellerPO"
                          value={formData.sellerPO}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 44)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 w-24 focus:outline-none focus:bg-amber-50"
                        />
                        <span className="whitespace-nowrap ml-1">थाना :-</span>
                        <input
                          ref={el => (inputRefs.current[45] = el)}
                          type="text"
                          name="sellerPS"
                          value={formData.sellerPS}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 45)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="whitespace-nowrap">जिला :-</span>
                        <input
                          ref={el => (inputRefs.current[46] = el)}
                          type="text"
                          name="sellerDistrict"
                          value={formData.sellerDistrict}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 46)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="whitespace-nowrap">राज्य :-</span>
                        <input
                          ref={el => (inputRefs.current[47] = el)}
                          type="text"
                          name="sellerState"
                          value={formData.sellerState}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 47)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 w-24 focus:outline-none focus:bg-amber-50"
                        />
                        <span className="whitespace-nowrap ml-1">पिन कोड :-</span>
                        <input
                          ref={el => (inputRefs.current[48] = el)}
                          type="text"
                          name="sellerPIN"
                          value={formData.sellerPIN}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 48)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="flex items-baseline gap-1 pt-1">
                        <span className="whitespace-nowrap">पैन नं. :-</span>
                        <input
                          ref={el => (inputRefs.current[49] = el)}
                          type="text"
                          name="sellerPAN"
                          value={formData.sellerPAN}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 49)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 w-24 focus:outline-none focus:bg-amber-50"
                        />
                        <span className="whitespace-nowrap ml-1">मो. सं. :-</span>
                        <input
                          ref={el => (inputRefs.current[50] = el)}
                          type="text"
                          name="sellerMobile"
                          value={formData.sellerMobile}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 50)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="flex items-baseline gap-1 pt-1">
                        <span className="whitespace-nowrap">अन्य पहचान पत्र संख्या :-</span>
                        <input
                          ref={el => (inputRefs.current[51] = el)}
                          type="text"
                          name="sellerOtherID"
                          value={formData.sellerOtherID}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 51)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Buyer Details */}
                  <div className="pl-1">
                    <div className="font-bold text-[11px] mb-2 leading-tight">
                      वाहन क्रेता का वर्तमान पता <span className="font-normal">(कृपया अंग्रेजी के बड़े अक्षर में भरें)</span>
                    </div>

                    <div className="flex gap-2 mb-2 items-start">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[11px] whitespace-nowrap">नाम :-</span>
                          <input
                            ref={el => (inputRefs.current[52] = el)}
                            type="text"
                            name="buyerName"
                            value={formData.buyerName}
                            onChange={handleChange}
                            onKeyDown={e => handleKeyDown(e, 52)}
                            className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                          />
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[11px] whitespace-nowrap">पिता/पति :-</span>
                          <input
                            ref={el => (inputRefs.current[53] = el)}
                            type="text"
                            name="buyerFather"
                            value={formData.buyerFather}
                            onChange={handleChange}
                            onKeyDown={e => handleKeyDown(e, 53)}
                            className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                          />
                        </div>
                      </div>
                      <div className="photo-box flex-shrink-0 w-[85px] h-[100px] border border-dashed border-gray-600 flex flex-col items-center justify-center text-center p-1 text-[9px] text-gray-500">
                        <span>Paste recent</span>
                        <span>passport size</span>
                        <span>photo</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-baseline gap-1">
                        <span className="whitespace-nowrap">पता :-</span>
                        <input
                          ref={el => (inputRefs.current[54] = el)}
                          type="text"
                          name="buyerResidence"
                          value={formData.buyerResidence}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 54)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="whitespace-nowrap">पोस्ट :-</span>
                        <input
                          ref={el => (inputRefs.current[55] = el)}
                          type="text"
                          name="buyerPO"
                          value={formData.buyerPO}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 55)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 w-24 focus:outline-none focus:bg-amber-50"
                        />
                        <span className="whitespace-nowrap ml-1">थाना :-</span>
                        <input
                          ref={el => (inputRefs.current[56] = el)}
                          type="text"
                          name="buyerPS"
                          value={formData.buyerPS}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 56)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="whitespace-nowrap">जिला :-</span>
                        <input
                          ref={el => (inputRefs.current[57] = el)}
                          type="text"
                          name="buyerDistrict"
                          value={formData.buyerDistrict}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 57)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="whitespace-nowrap">राज्य :-</span>
                        <input
                          ref={el => (inputRefs.current[58] = el)}
                          type="text"
                          name="buyerState"
                          value={formData.buyerState}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 58)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 w-24 focus:outline-none focus:bg-amber-50"
                        />
                        <span className="whitespace-nowrap ml-1">पिन कोड :-</span>
                        <input
                          ref={el => (inputRefs.current[59] = el)}
                          type="text"
                          name="buyerPIN"
                          value={formData.buyerPIN}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 59)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="font-bold text-[11px] pt-1.5 pb-0.5 border-t border-gray-300">
                        वाहन क्रेता का स्थाई पता <span className="font-normal">(कृपया अंग्रेजी के बड़े अक्षर में भरें)</span>
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="whitespace-nowrap">पता :-</span>
                        <input
                          ref={el => (inputRefs.current[60] = el)}
                          type="text"
                          name="buyerPermAddress"
                          value={formData.buyerPermAddress}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 60)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="whitespace-nowrap">पोस्ट :-</span>
                        <input
                          ref={el => (inputRefs.current[61] = el)}
                          type="text"
                          name="buyerPermPO"
                          value={formData.buyerPermPO}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 61)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 w-24 focus:outline-none focus:bg-amber-50"
                        />
                        <span className="whitespace-nowrap ml-1">थाना :-</span>
                        <input
                          ref={el => (inputRefs.current[62] = el)}
                          type="text"
                          name="buyerPermPS"
                          value={formData.buyerPermPS}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 62)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="whitespace-nowrap">जिला :-</span>
                        <input
                          ref={el => (inputRefs.current[63] = el)}
                          type="text"
                          name="buyerPermDistrict"
                          value={formData.buyerPermDistrict}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 63)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="whitespace-nowrap">राज्य :-</span>
                        <input
                          ref={el => (inputRefs.current[64] = el)}
                          type="text"
                          name="buyerPermState"
                          value={formData.buyerPermState}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 64)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 w-24 focus:outline-none focus:bg-amber-50"
                        />
                        <span className="whitespace-nowrap ml-1">पिन कोड :-</span>
                        <input
                          ref={el => (inputRefs.current[65] = el)}
                          type="text"
                          name="buyerPermPIN"
                          value={formData.buyerPermPIN}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 65)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="flex items-baseline gap-1 pt-1">
                        <span className="whitespace-nowrap">पैन नं. :-</span>
                        <input
                          ref={el => (inputRefs.current[66] = el)}
                          type="text"
                          name="buyerPAN"
                          value={formData.buyerPAN}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 66)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 w-24 focus:outline-none focus:bg-amber-50"
                        />
                        <span className="whitespace-nowrap ml-1">मो. सं. :-</span>
                        <input
                          ref={el => (inputRefs.current[67] = el)}
                          type="text"
                          name="buyerMobile"
                          value={formData.buyerMobile}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 67)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>

                      <div className="flex items-baseline gap-1 pt-1">
                        <span className="whitespace-nowrap">अन्य पहचान पत्र संख्या :-</span>
                        <input
                          ref={el => (inputRefs.current[68] = el)}
                          type="text"
                          name="buyerOtherID"
                          value={formData.buyerOtherID}
                          onChange={handleChange}
                          onKeyDown={e => handleKeyDown(e, 68)}
                          className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 focus:outline-none focus:bg-amber-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= PAGE 6: SALE LETTER ================= */}
            {(activeTab === 'all' || activeTab === 'sale_letter') && (
              <div
                id="sec-sale-letter"
                className="bg-white shadow-2xl mx-auto rounded-sm form-sheet text-black"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '24mm 26mm',
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '15px',
                  lineHeight: '2.3',
                  color: '#000'
                }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold tracking-widest uppercase underline decoration-2 underline-offset-4">
                    SALE LETTER
                  </h1>
                </div>

                <div className="space-y-4 text-justify">
                  <div className="flex flex-wrap items-baseline gap-1">
                    <span>I</span>
                    <input
                      ref={el => (inputRefs.current[69] = el)}
                      type="text"
                      name="sellerName"
                      value={formData.sellerName}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 69)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 min-w-[200px] focus:outline-none focus:bg-amber-50"
                    />
                  </div>

                  <div className="flex flex-wrap items-baseline gap-1">
                    <span>S/o</span>
                    <input
                      ref={el => (inputRefs.current[70] = el)}
                      type="text"
                      name="sellerFather"
                      value={formData.sellerFather}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 70)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 min-w-[200px] focus:outline-none focus:bg-amber-50"
                    />
                  </div>

                  <div className="flex flex-wrap items-baseline gap-1">
                    <span>At</span>
                    <input
                      ref={el => (inputRefs.current[71] = el)}
                      type="text"
                      name="sellerResidence"
                      value={formData.sellerResidence}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 71)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 min-w-[200px] focus:outline-none focus:bg-amber-50"
                    />
                  </div>

                  <div className="flex flex-wrap items-baseline gap-1">
                    <span>Have sold my vechile</span>
                    <input
                      ref={el => (inputRefs.current[72] = el)}
                      type="text"
                      name="vehicleMake"
                      value={formData.vehicleMake}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 72)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 w-36 focus:outline-none focus:bg-amber-50"
                    />
                    <span>No</span>
                    <input
                      ref={el => (inputRefs.current[73] = el)}
                      type="text"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 73)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 min-w-[150px] focus:outline-none focus:bg-amber-50"
                    />
                  </div>

                  <div className="flex flex-wrap items-baseline gap-1">
                    <span>Chassis</span>
                    <input
                      ref={el => (inputRefs.current[74] = el)}
                      type="text"
                      name="chassisNumber"
                      value={formData.chassisNumber}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 74)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 min-w-[150px] focus:outline-none focus:bg-amber-50"
                    />
                    <span>Engine No</span>
                    <input
                      ref={el => (inputRefs.current[75] = el)}
                      type="text"
                      name="engineNumber"
                      value={formData.engineNumber}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 75)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 min-w-[150px] focus:outline-none focus:bg-amber-50"
                    />
                  </div>

                  <div className="flex flex-wrap items-baseline gap-1">
                    <span>Modle</span>
                    <input
                      ref={el => (inputRefs.current[76] = el)}
                      type="text"
                      name="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 76)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 min-w-[200px] focus:outline-none focus:bg-amber-50"
                    />
                  </div>

                  <div className="flex flex-wrap items-baseline gap-1">
                    <span>To</span>
                    <input
                      ref={el => (inputRefs.current[77] = el)}
                      type="text"
                      name="buyerName"
                      value={formData.buyerName}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 77)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 min-w-[200px] focus:outline-none focus:bg-amber-50"
                    />
                  </div>

                  <div className="flex flex-wrap items-baseline gap-1">
                    <span>S/o</span>
                    <input
                      ref={el => (inputRefs.current[78] = el)}
                      type="text"
                      name="buyerFather"
                      value={formData.buyerFather}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 78)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 min-w-[200px] focus:outline-none focus:bg-amber-50"
                    />
                  </div>

                  <div className="flex flex-wrap items-baseline gap-1">
                    <span>Address</span>
                    <input
                      ref={el => (inputRefs.current[79] = el)}
                      type="text"
                      name="buyerResidence"
                      value={formData.buyerResidence}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 79)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 min-w-[200px] focus:outline-none focus:bg-amber-50"
                    />
                  </div>

                  <div className="flex flex-wrap items-baseline gap-1">
                    <span>In a sum of Rs</span>
                    <input
                      ref={el => (inputRefs.current[80] = el)}
                      type="text"
                      name="saleAmount"
                      value={formData.saleAmount}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 80)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 w-32 focus:outline-none focus:bg-amber-50"
                    />
                    <span>(in words</span>
                    <input
                      ref={el => (inputRefs.current[81] = el)}
                      type="text"
                      name="saleAmountWords"
                      value={formData.saleAmountWords}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 81)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 flex-1 min-w-[150px] focus:outline-none focus:bg-amber-50"
                    />
                    <span>)</span>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-1">
                    <span>on dated</span>
                    <input
                      ref={el => (inputRefs.current[82] = el)}
                      type="text"
                      name="saleDate"
                      value={formData.saleDate}
                      onChange={handleChange}
                      onKeyDown={e => handleKeyDown(e, 82)}
                      className="border-b border-dotted border-black font-bold uppercase px-1 w-40 focus:outline-none focus:bg-amber-50"
                    />
                    <span>.</span>
                  </div>

                  <p className="mt-4 leading-relaxed">
                    I have received full and final payment of this vehicle from purchaser. I will fully 
                    responsible for any litigation, thief case, accident, dues of tax, Misuse till the date of 
                    sale, the purchaser will be fully responsible for any Case ,accidenet, thief case, misuse 
                    from the date of purchase.
                  </p>

                  <p className="mt-2 leading-relaxed">
                    I handed over this sales letter to purchaser for his future needs if any.
                  </p>
                </div>

                <div className="mt-16 flex justify-between items-end pt-10">
                  <div className="text-center font-bold">
                    Seller Signature
                  </div>
                  <div className="text-center font-bold">
                    Purchaser Signature
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls Section */}
        <div className="w-full lg:w-96 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 h-fit max-h-[calc(100vh-30px)] overflow-y-auto sticky top-2 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl">📄</span>
                <h3 className="font-bold text-gray-900 text-base">New Form Controls</h3>
              </div>
              <p className="text-[11px] text-gray-500">Live Fast-Fill for All 6 Pages</p>
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

          {/* 1. Vehicle Search & Vehicle Details */}
          <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-sky-900 uppercase tracking-wide flex items-center gap-1">
                🔍 Vehicle Details & Search
              </label>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-700 block mb-0.5">Vehicle Reg. No.</label>
              <input
                type="text"
                placeholder="e.g. CG04HA1234"
                value={vehicleSearchNumber || formData.vehicleNumber}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase()
                  setVehicleSearchNumber(val)
                  setFormData(prev => ({ ...prev, vehicleNumber: val }))
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
              />
              {fetchingVehicle && (
                <p className="text-[11px] text-sky-600 mt-1 font-medium animate-pulse">Fetching vehicle data...</p>
              )}
              {vehicleError && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{vehicleError}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Engine No.</label>
                <input
                  type="text"
                  name="engineNumber"
                  value={formData.engineNumber}
                  onChange={handleChange}
                  placeholder="Engine No."
                  className="w-full px-2 py-1 bg-white border border-sky-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Chassis No.</label>
                <input
                  type="text"
                  name="chassisNumber"
                  value={formData.chassisNumber}
                  onChange={handleChange}
                  placeholder="Chassis No."
                  className="w-full px-2 py-1 bg-white border border-sky-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* 2. District Name (Common Sync across all 6 pages) */}
          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                📍 District Name (Court / RTO / Dist)
              </label>
            </div>
            <input
              type="text"
              name="courtLocation"
              value={formData.courtLocation || formData.sellerDistrict || ''}
              onChange={handleDistrictChange}
              placeholder="Enter District Name (e.g. RAIPUR, DURG)"
              className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
            />
            <p className="text-[10px] text-amber-800">
              ✍️ Type district here to fill court & district across all 6 pages (or leave blank).
            </p>
          </div>

          {/* 3. Seller / Transferor Details */}
          <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                👤 Seller / Owner Details
              </span>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Seller Name</label>
              <input
                type="text"
                name="sellerName"
                value={formData.sellerName}
                onChange={handleChange}
                placeholder="Seller Name"
                className="w-full px-2 py-1 bg-white border border-purple-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">S/o, D/o, W/o (Father/Husband)</label>
              <input
                type="text"
                name="sellerFather"
                value={formData.sellerFather}
                onChange={handleChange}
                placeholder="Father / Husband Name"
                className="w-full px-2 py-1 bg-white border border-purple-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Resident / Address</label>
              <input
                type="text"
                name="sellerResidence"
                value={formData.sellerResidence}
                onChange={handleChange}
                placeholder="Seller Full Address"
                className="w-full px-2 py-1 bg-white border border-purple-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">P.O. (Post Office)</label>
                <input
                  type="text"
                  name="sellerPO"
                  value={formData.sellerPO}
                  onChange={handleChange}
                  placeholder="Post Office"
                  className="w-full px-2 py-1 bg-white border border-purple-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">P.S. (Police Station)</label>
                <input
                  type="text"
                  name="sellerPS"
                  value={formData.sellerPS}
                  onChange={handleChange}
                  placeholder="Police Station"
                  className="w-full px-2 py-1 bg-white border border-purple-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* 4. Buyer / Transferee Details */}
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                👥 Buyer / Purchaser Details
              </span>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Buyer Name</label>
              <input
                type="text"
                name="buyerName"
                value={formData.buyerName}
                onChange={handleChange}
                placeholder="Buyer Name"
                className="w-full px-2 py-1 bg-white border border-emerald-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">S/o, D/o, W/o (Father/Husband)</label>
              <input
                type="text"
                name="buyerFather"
                value={formData.buyerFather}
                onChange={handleChange}
                placeholder="Father / Husband Name"
                className="w-full px-2 py-1 bg-white border border-emerald-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Resident / Address</label>
              <input
                type="text"
                name="buyerResidence"
                value={formData.buyerResidence}
                onChange={handleChange}
                placeholder="Buyer Full Address"
                className="w-full px-2 py-1 bg-white border border-emerald-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">P.O. (Post Office)</label>
                <input
                  type="text"
                  name="buyerPO"
                  value={formData.buyerPO}
                  onChange={handleChange}
                  placeholder="Post Office"
                  className="w-full px-2 py-1 bg-white border border-emerald-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">P.S. (Police Station)</label>
                <input
                  type="text"
                  name="buyerPS"
                  value={formData.buyerPS}
                  onChange={handleChange}
                  placeholder="Police Station"
                  className="w-full px-2 py-1 bg-white border border-emerald-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => handlePrint(false)}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print All 6 Pages (Filled)
            </button>

            <button
              onClick={() => handlePrint(true)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-slate-300 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Print Blank Form Set
            </button>

            <button
              onClick={handleClear}
              className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-semibold text-xs transition-all border border-rose-200 cursor-pointer"
            >
              Clear All Fields
            </button>
          </div>

          <div className="text-[10px] text-gray-400 text-center border-t border-gray-100 pt-2">
            💡 Live two-way sync between sidebar and document pages.
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewFormModal
