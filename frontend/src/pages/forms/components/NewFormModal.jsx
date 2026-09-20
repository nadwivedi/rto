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
    const source = (specificSection && document.getElementById(specificSection)) || printRef.current

    // Print a clone so the on-screen form is never touched; copy live input values into it
    const clone = source.cloneNode(true)
    const liveInputs = source.querySelectorAll('input')
    clone.querySelectorAll('input').forEach((input, i) => {
      input.setAttribute('value', printEmpty ? '' : liveInputs[i].value)
    })

    // Carry over the app's own CSS (Tailwind etc.) so every page prints exactly as it looks on screen
    const appStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n')

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <base href="${document.baseURI}">
          <title>New Form - ${formData.vehicleNumber || 'Vehicle Transfer Set'}</title>
          ${appStyles}
          <style>
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page-break {
              page-break-after: always;
              break-after: page;
            }
            .form-sheet {
              margin: 0 auto !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }
            input { background: transparent !important; outline: none !important; }
            .space-y-6 > * { margin-top: 0 !important; margin-bottom: 0 !important; }
            .no-print { display: none !important; }
            @media print {
              @page { margin: 0; size: A4; }
            }
          </style>
        </head>
        <body>
          ${clone.outerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()

    // Wait for the copied stylesheets to load before opening the print dialog
    const startPrint = () => {
      printWindow.print()
      printWindow.close()
    }
    let started = false
    const once = () => {
      if (started) return
      started = true
      setTimeout(startPrint, 200)
    }
    printWindow.onload = once
    setTimeout(once, 1200)
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

  // Page 4 (Form 30) shared styles
  const p4Head = "Georgia, 'Palatino Linotype', 'Book Antiqua', serif"
  const p6Row = { ...p1Row, marginTop: '14px' }
  const p2Row = { ...p1Row, marginTop: '5px' }
  const p4Sheet = {
    width: '210mm',
    minHeight: '297mm',
    padding: '12mm 18mm',
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: '13px',
    lineHeight: '1.55',
    color: '#000'
  }

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
                <div style={{ textAlign: 'center', marginBottom: '22px', fontFamily: "Georgia, 'Palatino Linotype', 'Book Antiqua', serif", color: '#000' }}>
                  <p style={{ fontSize: '17px', fontWeight: 'bold', letterSpacing: '1px' }}>Before,</p>
                  <p style={{ fontSize: '21px', fontWeight: 'bold', letterSpacing: '0.5px', marginTop: '2px' }}>Executive Magistrate / Notary Public</p>
                  <div style={{ width: '300px', margin: '6px auto 0' }}>{p1In(1000, 'courtLocation', { textAlign: 'center' })}</div>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '5px', marginTop: '12px', textDecoration: 'underline', textUnderlineOffset: '4px' }}>(AFFIDAVIT)</p>
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
                {/* Text taken as-is from form.docx (second affidavit) */}
                <div style={{ textAlign: 'center', marginBottom: '22px', fontFamily: "Georgia, 'Palatino Linotype', 'Book Antiqua', serif", color: '#000' }}>
                  <p style={{ fontSize: '17px', fontWeight: 'bold', letterSpacing: '1px' }}>In,</p>
                  <p style={{ fontSize: '21px', fontWeight: 'bold', letterSpacing: '0.5px', marginTop: '2px' }}>The Court of Executive Magistrate / Notary Public</p>
                  <div style={{ width: '300px', margin: '6px auto 0' }}>{p1In(2000, 'courtLocation', { textAlign: 'center' })}</div>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '5px', marginTop: '12px', textDecoration: 'underline', textUnderlineOffset: '4px' }}>AFFIDAVIT</p>
                </div>

                <div style={p1Row}><span>I</span>{p1In(2001, 'sellerName')}<span>S/o</span>{p1In(2002, 'sellerFather')}</div>
                <div style={p1Row}><span>resident of</span>{p1In(2003, 'sellerResidence')}<span>P.O.</span>{p1In(2004, 'sellerPO', { flex: 'none', width: '150px' })}</div>
                <div style={p1Row}><span>P. S.</span>{p1In(2005, 'sellerPS')}<span>District</span>{p1In(2006, 'sellerDistrict')}</div>

                <p style={{ marginTop: '16px' }}>do hereby solemnly affirm and declare as follow :-</p>

                <div style={p1Row}><span>1. That I have sold my vehicle</span>{p1In(2007, 'vehicleMake')}</div>
                <div style={p1Row}><span>Bearing registration No.</span>{p1In(2008, 'vehicleNumber')}</div>
                <div style={p1Row}><span>Engine No.</span>{p1In(2009, 'engineNumber')}<span>Chassis No.</span>{p1In(2010, 'chassisNumber')}</div>
                <div style={p1Row}><span>to Sri</span>{p1In(2011, 'buyerName')}</div>
                <div style={p1Row}><span>S/o</span>{p1In(2012, 'buyerFather')}</div>
                <div style={p1Row}><span>Resident of</span>{p1In(2013, 'buyerResidence')}<span>P.O.</span>{p1In(2014, 'buyerPO', { flex: 'none', width: '150px' })}</div>
                <div style={p1Row}><span>P.S.</span>{p1In(2015, 'buyerPS')}<span>District</span>{p1In(2016, 'buyerDistrict')}</div>

                <p style={{ marginTop: '16px' }}>2.That neither any case not Govt. dues stands against this vehicle up to the date of affidavit and it is I am fully responsible for the same.</p>
                <p style={{ marginTop: '12px' }}>3.That the ownership of the aforesaid vehicle may be transfered in the name of the purchager for which I have got no objection hence this affidavit.</p>
                <p style={{ marginTop: '12px' }}>That the contents of this affidavit are true and correct to the best of my knowledge and belief.</p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '70px' }}>
                  <div style={{ textAlign: 'center', minWidth: '200px' }}>
                    <p style={{ borderTop: '1px solid #000', paddingTop: '4px', fontWeight: 'bold' }}>DEPONENT</p>
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
                  padding: '12mm 18mm',
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: '#000'
                }}
              >
                {/* Text taken as-is from form.docx (Form 29) */}
                <div style={{ textAlign: 'center', fontFamily: "Georgia, 'Palatino Linotype', 'Book Antiqua', serif" }}>
                  <p style={{ fontSize: '26px', fontWeight: 'bold', letterSpacing: '4px' }}>FORM 29</p>
                  <p style={{ fontSize: '14px' }}>[See Rule 55(1)]</p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>NOTICE OF TRANSFER OF OWNERSHIP OF A MOTOR VEHICLE</p>
                </div>
                <p style={{ fontSize: '11.5px', textAlign: 'center', fontStyle: 'italic', margin: '6px 0 14px' }}>(To be made in duplicate and the duplicate copy with the endorsement of the Registering Authority to be returned to the transferor or immediately on making entries of transfer of ownership in certificate of Registration and Form 24)</p>

                <p style={{ fontWeight: 'bold' }}>To</p>
                <div style={{ ...p1Row, marginTop: '2px' }}><span>The Registering Authority</span>{p1In(3000, 'rtoLocation')}<span>(in whose jurisdiction the Transferee resides)</span></div>

                <div style={{ ...p1Row, marginTop: '14px' }}><span>I/We</span>{p1In(3001, 'sellerName')}<span>resident of</span>{p1In(3002, 'sellerResidence')}</div>
                <div style={p1Row}><span>have on the</span>{p1In(3003, 'saleDay', { flex: 'none', width: '110px', textAlign: 'center' })}<span>day of the year</span>{p1In(3004, 'saleMonthYear', { flex: 'none', width: '170px', textAlign: 'center' })}<span>Sold and delivered my / our Vehicle No</span>{p1In(3005, 'vehicleNumber')}</div>
                <div style={p1Row}><span>make</span>{p1In(3006, 'vehicleMake')}<span>Chassis No</span>{p1In(3007, 'chassisNumber')}</div>
                <div style={p1Row}><span>[Engine number or motor number in the case of Battery Operated Vehicles]</span>{p1In(3008, 'engineNumber')}<span>to</span></div>
                <div style={p1Row}><span>Shri / Smt</span>{p1In(3009, 'buyerName')}<span>(Name) Son/Wife/Daughter of</span>{p1In(3010, 'buyerFather')}</div>
                <div style={p1Row}><span>residing at</span>{p1In(3011, 'buyerResidence')}</div>
                <div style={p1Row}><span>P.O.</span>{p1In(3012, 'buyerPO')}<span>P.S.</span>{p1In(3013, 'buyerPS')}<span>Distt.</span>{p1In(3014, 'buyerDistrict')}<span>State</span>{p1In(3015, 'buyerState')}</div>
                <p style={{ fontSize: '11.5px', textAlign: 'center' }}>(House No./Street/Village/Town/Distt. And State)</p>
                <div style={p1Row}><span>under an agreement of hire purchase/lease/ hypothecation with</span>{p1In(3016, 'financierDetails')}</div>

                <p style={{ marginTop: '14px' }}>The Registration Certificate and Insurance Certificate have been handed over to him /her / them.</p>
                <p style={{ marginTop: '8px', textAlign: 'justify' }}>To the best of my/our knowledge and belief the vehicle is not superdari and free from all encumbrances and information furnished is true. I/We undertake to hold my/our self-responsible for any inaccuracy or suppression of information.</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px', fontWeight: 'bold', fontSize: '13px' }}>
                  <div style={{ textAlign: 'center' }}><p style={{ borderTop: '1px solid #000', paddingTop: '3px' }}>Signature of the Financier<br /><span style={{ fontWeight: 'normal' }}>(as his consent)</span></p></div>
                  <div style={{ textAlign: 'center' }}><p style={{ borderTop: '1px solid #000', paddingTop: '3px' }}>Signature or thumb impression of the<br />Registered Owner (Transferor)</p></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <p>Date <strong>{formData.date}</strong></p>
                  <p>Date <strong>{formData.date}</strong></p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', fontWeight: 'bold' }}>I/We (Transferee)</div>

                <div style={{ ...p1Row, marginTop: '14px' }}><span>Copy to the Registering Authority</span>{p1In(3017, 'rtoLocation')}<span>in whose jurisdiction the</span></div>
                <p>transferor resides.</p>
                <p style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '4px' }}>Note. – To be sent to the Registering Authority by Registered Post Acknowledgment Due.</p>

                <div style={{ border: '1.5px solid #000', padding: '8px 12px', marginTop: '14px' }}>
                  <p style={{ textAlign: 'center', fontWeight: 'bold', fontFamily: "Georgia, 'Palatino Linotype', 'Book Antiqua', serif", fontSize: '15px', letterSpacing: '1px' }}>OFFICE ENDORSEMENT</p>
                  <div style={p1Row}><span>Ref.No</span>{p1In(3018, 'endorsementRefNo')}<span>Office of the</span>{p1In(3019, 'endorsementOffice')}</div>
                  <div style={p1Row}><span>The ownership of the vehicle has been transferred to the name of</span>{p1In(3020, 'buyerName')}</div>
                  <div style={p1Row}><span>with the note of the above said agreement with effect from</span>{p1In(3021, 'endorsementEffectDate')}<span>(date).</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '24px', fontSize: '13px' }}>
                    <p>Date ..............................</p>
                    <p style={{ fontWeight: 'bold' }}>Signature of the Registering Authority with Office seal</p>
                  </div>
                </div>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>*Strike out whichever is inapplicable</p>

                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontWeight: 'bold' }}>To</p>
                  <div style={{ ...p1Row, marginTop: '2px' }}><span>The Transferor</span>{p1In(3022, 'sellerName')}</div>
                  <p style={{ fontSize: '12px', fontStyle: 'italic', textAlign: 'center' }}>(To be sent by Registered Post Acknowledgment Due)</p>
                </div>
              </div>
            )}

            {/* ================= PAGE 4: FORM 30 (Part I + Part II, as in form.docx) ================= */}
            {(activeTab === 'all' || activeTab === 'form30') && (
              <>
                {/* ---- Form 30: Part I ---- */}
                <div id="sec-form30" className="bg-white shadow-2xl mx-auto rounded-sm form-sheet page-break" style={p4Sheet}>
                  <div style={{ textAlign: 'center', fontFamily: p4Head }}>
                    <p style={{ fontSize: '26px', fontWeight: 'bold', letterSpacing: '4px' }}>FORM 30</p>
                    <p style={{ fontSize: '14px' }}>[See Rule 55(2) and (3)]</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>APPLICATION FOR INTIMATION AND TRANSFER OF OWNERSHIP OF A MOTOR VEHICLE</p>
                  </div>
                  <p style={{ fontSize: '11.5px', textAlign: 'justify', fontStyle: 'italic', margin: '6px 0 14px' }}>(To be made in duplicate if the vehicle is held under an agreement of hire-purchase / lease / hypothecation. The duplicate copy with the endorsement of the Registering Authority to be returned to the Financier simultaneously on making the entry of the transfer of ownership in the Certificate of Registration and Registration Record in Form 24)</p>

                  <p style={{ fontWeight: 'bold' }}>To</p>
                  <div style={{ ...p1Row, marginTop: '2px' }}><span>The Registering Authority</span>{p1In(4000, 'rtoLocation')}</div>

                  <p style={{ fontFamily: p4Head, fontWeight: 'bold', fontSize: '17px', textAlign: 'center', letterSpacing: '1px', margin: '18px 0 6px' }}>PART I – FOR THE USE OF THE TRANSFEROR</p>

                  <div style={p1Row}><span>Name of the transferor</span>{p1In(4001, 'sellerName')}</div>
                  <div style={p1Row}><span>Son/Wife/Daughter of</span>{p1In(4002, 'sellerFather')}</div>
                  <div style={p1Row}><span>Full Address</span>{p1In(4003, 'sellerResidence')}</div>
                  <div style={p1Row}><span>P.O.</span>{p1In(4004, 'sellerPO')}<span>P.S.</span>{p1In(4005, 'sellerPS')}</div>
                  <div style={p1Row}><span>Dist.</span>{p1In(4006, 'sellerDistrict')}<span>State</span>{p1In(4007, 'sellerState')}<span>PIN</span>{p1In(4008, 'sellerPIN', { flex: 'none', width: '110px' })}</div>

                  <div style={{ ...p1Row, marginTop: '16px' }}>
                    <span>I/We, hereby declare that I/We have on this</span>{p1In(4009, 'saleDay', { flex: 'none', width: '100px', textAlign: 'center' })}
                    <span>day of the year</span>{p1In(4010, 'saleMonthYear', { flex: 'none', width: '170px', textAlign: 'center' })}
                  </div>
                  <div style={p1Row}><span>sold my/our motor vehicle bearing Registration mark</span>{p1In(4011, 'vehicleNumber')}</div>
                  <div style={p1Row}><span>to Shri./Smt.</span>{p1In(4012, 'buyerName')}<span>Son/Wife/Daughter of</span>{p1In(4013, 'buyerFather')}</div>
                  <div style={p1Row}><span>residing at</span>{p1In(4014, 'buyerResidence')}</div>
                  <div style={p1Row}><span>P.O.</span>{p1In(4015, 'buyerPO')}<span>P.S.</span>{p1In(4016, 'buyerPS')}</div>
                  <div style={p1Row}><span>Dist.</span>{p1In(4017, 'buyerDistrict')}<span>State</span>{p1In(4018, 'buyerState')}<span>PIN</span>{p1In(4019, 'buyerPIN', { flex: 'none', width: '110px' })}<span>(full address)</span></div>
                  <p style={{ marginTop: '4px', textAlign: 'justify' }}>and handed over the Certificate of Registration and the Certificate of Insurance to him/her/them.</p>

                  <p style={{ marginTop: '14px', textAlign: 'justify' }}>I/We hereby declare that to the best of my/our knowledge the certificate of registration of the vehicle has not been suspended or cancelled.*</p>
                  <p style={{ marginTop: '10px', textAlign: 'justify' }}>*I/We enclose the “No Objection Certificate” issued by the Registering Authority.</p>
                  <p style={{ marginTop: '10px', textAlign: 'justify' }}>**If the “No Objection Certificate” issued from the Registering Authority is not enclosed, the transferor should file along with this application a declaration as required under sub-section (1) of section 50.</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '46px' }}>
                    <p>Date <strong>{formData.date}</strong></p>
                    <p style={{ fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '3px' }}>Signature or thumb impression of the Transferor</p>
                  </div>

                  <div style={{ ...p1Row, marginTop: '30px' }}><span>*Details of suspension or cancellation</span>{p1In(4020, 'suspensionDetails')}</div>
                  <p style={{ marginTop: '6px' }}>**Strike out whichever is inapplicable.</p>
                </div>

                {/* ---- Form 30: Part II ---- */}
                <div id="sec-form30-part2" className="bg-white shadow-2xl mx-auto rounded-sm form-sheet page-break" style={{ ...p4Sheet, fontSize: '12.5px', lineHeight: '1.45', padding: '11mm 18mm' }}>
                  <p style={{ fontFamily: p4Head, fontWeight: 'bold', fontSize: '17px', textAlign: 'center', letterSpacing: '1px', marginBottom: '6px' }}>PART II – FOR THE USE OF TRANSFEREE</p>

                  <div style={p2Row}><span>Name of the Transferee</span>{p1In(4100, 'buyerName')}</div>
                  <div style={p2Row}><span>Son/Wife/Daughter of</span>{p1In(4101, 'buyerFather')}<span>Age</span>{p1In(4102, 'buyerAge', { flex: 'none', width: '70px', textAlign: 'center' })}</div>
                  <div style={p2Row}><span>Full address</span>{p1In(4103, 'buyerResidence')}</div>
                  <div style={p2Row}><span>P.O.</span>{p1In(4104, 'buyerPO')}<span>P.S.</span>{p1In(4105, 'buyerPS')}</div>
                  <div style={p2Row}><span>Dist.</span>{p1In(4106, 'buyerDistrict')}<span>State</span>{p1In(4107, 'buyerState')}<span>PIN</span>{p1In(4108, 'buyerPIN', { flex: 'none', width: '110px' })}<span>(Proof of address to be enclosed).</span></div>

                  <div style={{ ...p2Row, marginTop: '10px' }}>
                    <span>I/We hereby declare that I/We have on this</span>{p1In(4109, 'saleDay', { flex: 'none', width: '100px', textAlign: 'center' })}
                    <span>day of the year</span>{p1In(4110, 'saleMonthYear', { flex: 'none', width: '170px', textAlign: 'center' })}
                  </div>
                  <div style={p2Row}><span>purchased the motor vehicle bearing registration number</span>{p1In(4111, 'vehicleNumber')}</div>
                  <div style={p2Row}><span>from</span>{p1In(4112, 'sellerName')}</div>
                  <div style={p2Row}>{p1In(4113, 'sellerResidence')}</div>
                  <div style={p2Row}><span>P.O.</span>{p1In(4114, 'sellerPO')}<span>P.S.</span>{p1In(4115, 'sellerPS')}<span>Dist.</span>{p1In(4116, 'sellerDistrict')}<span>(name and full address)</span></div>
                  <p style={{ marginTop: '4px', textAlign: 'justify' }}>and request that necessary entries regarding the transfer of ownership of the vehicle in my/our name may be recorded in the certificate of registration and certificate of fitness of the vehicle, which is enclosed.</p>
                  <p style={{ marginTop: '6px', textAlign: 'justify' }}>The certificate of Insurance is also enclosed. To the best of my knowledge and belief I/We have not suppressed any facts and information furnished is true. The vehicle is not superdari and free from all encumbrances. I/We undertake to hold myself responsible for any inaccuracy of the information.</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '26px' }}>
                    <p>Date <strong>{formData.date}</strong></p>
                    <p style={{ fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '3px' }}>Signature or thumb impression of the Transferee</p>
                  </div>

                  <div style={{ border: '1.5px solid #000', padding: '7px 12px', marginTop: '12px' }}>
                    <p style={{ fontFamily: p4Head, fontWeight: 'bold', fontSize: '13px', textAlign: 'center', textTransform: 'uppercase' }}>Consent of the Financier in the case of motor vehicle subject to an agreement of hire-purchase/lease/hypothecation</p>
                    <p style={{ marginTop: '3px', textAlign: 'justify' }}>I/We being a party to an agreement of hire-purchase/lease/hypothecation in respect of motor vehicle specified above, give consent to the transfer of ownership of the said motor vehicle in the name of the Transferee named above, with whom I/We have entered into an agreement of hire-purchase/lease/hypothecation.</p>
                    <div style={p2Row}>{p1In(4117, 'financierDetails')}</div>
                    <p style={{ textAlign: 'center', fontSize: '11.5px' }}>(Full name and address of the Financier)</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '18px' }}>
                      <p>Date ..............................</p>
                      <p style={{ fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '3px' }}>Signature of the Financier</p>
                    </div>
                  </div>

                  <div style={{ border: '1.5px solid #000', padding: '7px 12px', marginTop: '10px' }}>
                    <p style={{ fontFamily: p4Head, fontWeight: 'bold', fontSize: '15px', textAlign: 'center', letterSpacing: '1px' }}>OFFICE ENDORSEMENT</p>
                    <div style={p2Row}><span>Ref.No</span>{p1In(4118, 'endorsementRefNo')}<span>Office of the</span>{p1In(4119, 'endorsementOffice')}</div>
                    <p style={{ marginTop: '4px', textAlign: 'justify' }}>The transfer of ownership of vehicle under continuation of an endorsement of hire-purchase/lease/hypothecation agreement has been recorded with effect from</p>
                    <div style={p2Row}>{p1In(4120, 'endorsementEffectDate')}<span>in the Registration Certificate of the vehicle and in the Registration Record of this office in Form 24.</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '18px' }}>
                      <p>Date ..............................</p>
                      <p style={{ fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '3px' }}>Signature of the Registering Authority</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <p style={{ fontWeight: 'bold' }}>To</p>
                    <div style={{ ...p2Row, marginTop: '2px' }}><span>The Financier</span>{p1In(4121, 'financierDetails')}</div>
                    <p style={{ fontSize: '11.5px', fontStyle: 'italic', textAlign: 'center' }}>(To be sent by Registered Post Acknowledgment Due)</p>
                  </div>

                  <p style={{ fontSize: '11px', marginTop: '8px', textAlign: 'justify' }}>Specimen signature or thumb impression of the registered owner and the Financier are to be obtained in the original application for affixing and attestation by the Registering Authority with the office seal in Forms 23 and 24, in such manner that the parts of impression of seal or stamp and attestation shall fall upon each signature.</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '30px', marginTop: '6px', fontWeight: 'bold', fontSize: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <p>Specimen signatures of the Financier</p>
                      <p style={{ fontWeight: 'normal', marginTop: '16px' }}>1 ..................................................</p>
                      <p style={{ fontWeight: 'normal', marginTop: '16px' }}>2 ..................................................</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p>Specimen signatures of the Registered Owner</p>
                      <p style={{ fontWeight: 'normal', marginTop: '16px' }}>1 ..................................................</p>
                      <p style={{ fontWeight: 'normal', marginTop: '16px' }}>2 ..................................................</p>
                    </div>
                  </div>
                </div>
              </>
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

            {/* ================= PAGE 6: SALE LETTER (text from public/SALE LETTER new.pdf) ================= */}
            {(activeTab === 'all' || activeTab === 'sale_letter') && (
              <div
                id="sec-sale-letter"
                className="bg-white shadow-2xl mx-auto rounded-sm form-sheet text-black"
                style={{ ...p4Sheet, padding: '16mm 22mm', fontSize: '15px', lineHeight: '1.8' }}
              >
                <p style={{ fontFamily: p4Head, fontSize: '30px', fontWeight: 'bold', letterSpacing: '6px', textAlign: 'center', textDecoration: 'underline', textUnderlineOffset: '5px', marginBottom: '26px' }}>SALE LETTER</p>

                <div style={p6Row}><span>I</span>{p1In(5001, 'sellerName')}</div>
                <div style={p6Row}><span>S/o</span>{p1In(5002, 'sellerFather')}</div>
                <div style={p6Row}><span>At</span>{p1In(5003, 'sellerResidence')}</div>
                <div style={p6Row}><span>P.S.</span>{p1In(5004, 'sellerPS')}<span>Dist.</span>{p1In(5005, 'sellerDistrict')}</div>
                <div style={p6Row}><span>Have sold my vechile</span>{p1In(5006, 'vehicleMake')}<span>No</span>{p1In(5007, 'vehicleNumber')}</div>
                <div style={p6Row}><span>Chassis</span>{p1In(5008, 'chassisNumber')}<span>Engine No</span>{p1In(5009, 'engineNumber')}</div>
                <div style={p6Row}><span>Modle</span>{p1In(5010, 'vehicleModel')}</div>
                <div style={p6Row}><span>To</span>{p1In(5011, 'buyerName')}</div>
                <div style={p6Row}><span>S/o</span>{p1In(5012, 'buyerFather')}</div>
                <div style={p6Row}><span>Address</span>{p1In(5013, 'buyerResidence')}</div>
                <div style={p6Row}><span>P.S.</span>{p1In(5014, 'buyerPS')}<span>Dist.</span>{p1In(5015, 'buyerDistrict')}</div>
                <div style={p6Row}><span>In a sum of Rs</span>{p1In(5016, 'saleAmount', { flex: 'none', width: '150px' })}<span>(in words</span>{p1In(5017, 'saleAmountWords')}<span>)</span></div>
                <div style={p6Row}><span>on dated</span>{p1In(5019, 'saleDate', { flex: 'none', width: '170px', textAlign: 'center' })}</div>

                <p style={{ marginTop: '26px', textAlign: 'justify' }}>I have received full and final payment of this vehicle from purchaserI will fully responsible for any litigation, thief case, accident, dues of tax,Misuse till the date of sale, the purchaser will be fully responsible for any Case ,accidenet, thief case, misuse from the date of purchase.</p>
                <p style={{ marginTop: '16px', textAlign: 'justify' }}>I handed over this sales letter to purchaser for his future needs if any.</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '90px', fontWeight: 'bold' }}>
                  <p style={{ borderTop: '1px solid #000', paddingTop: '4px', minWidth: '170px', textAlign: 'center' }}>Seller Signature</p>
                  <p style={{ borderTop: '1px solid #000', paddingTop: '4px', minWidth: '170px', textAlign: 'center' }}>Purchaser Signature</p>
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

            <div>
              <label className="text-[11px] font-semibold text-gray-700 block mb-0.5">Vehicle Make</label>
              <input
                type="text"
                name="vehicleMake"
                value={formData.vehicleMake}
                onChange={handleChange}
                placeholder="e.g. HERO SPLENDOR"
                className="w-full px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
              />
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
            <div>
              <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">District</label>
              <input
                type="text"
                name="sellerDistrict"
                value={formData.sellerDistrict}
                onChange={handleChange}
                placeholder="Seller District"
                className="w-full px-2 py-1 bg-white border border-purple-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
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
            <div>
              <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">District</label>
              <input
                type="text"
                name="buyerDistrict"
                value={formData.buyerDistrict}
                onChange={handleChange}
                placeholder="Buyer District"
                className="w-full px-2 py-1 bg-white border border-emerald-200 rounded-md text-xs font-medium text-gray-800 uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
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
