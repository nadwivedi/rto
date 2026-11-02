import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NewFormModal from './components/NewFormModal'
import Form46Modal from './components/Form46Modal'
import Form20Modal from './components/Form20Modal'
import Form44Modal from './components/Form44Modal'
import Form45Modal from './components/Form45Modal'
import Form48Modal from './components/Form48Modal'
import Form29Modal from './components/Form29Modal'
import Form30Modal from './components/Form30Modal'
import BuyerAffidavitModal from './components/BuyerAffidavitModal'
import SellerAffidavitModal from './components/SellerAffidavitModal'
import SapathPatraModal from './components/SapathPatraModal'
import KaryalayFormModal from './components/KaryalayFormModal'
import KaryalayForm2Modal from './components/KaryalayForm2Modal'

const Forms = () => {
  const navigate = useNavigate()
  const [isNewFormOpen, setIsNewFormOpen] = useState(false)
  const [isForm46Open, setIsForm46Open] = useState(false)
  const [isForm20Open, setIsForm20Open] = useState(false)
  const [isForm44Open, setIsForm44Open] = useState(false)
  const [isForm45Open, setIsForm45Open] = useState(false)
  const [isForm48Open, setIsForm48Open] = useState(false)
  const [isForm29Open, setIsForm29Open] = useState(false)
  const [isForm30Open, setIsForm30Open] = useState(false)
  const [isBuyerAffidavitOpen, setIsBuyerAffidavitOpen] = useState(false)
  const [isSellerAffidavitOpen, setIsSellerAffidavitOpen] = useState(false)
  const [isSapathPatraOpen, setIsSapathPatraOpen] = useState(false)
  const [isKaryalayFormOpen, setIsKaryalayFormOpen] = useState(false)
  const [isKaryalayForm2Open, setIsKaryalayForm2Open] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const forms = [
    {
      id: 'new-form',
      name: 'New Form',
      description: 'Complete Vehicle Transfer & Affidavit Form Set (Buyer Affidavit, Seller Affidavit, Form 29, Form 30, Transfer Declaration, Sale Letter in 1 Form)',
      icon: '📄',
      isModal: true,
      category: 'Transfer'
    },
    {
      id: 'form-29',
      name: 'Form 29',
      description: 'Notice of Transfer of Ownership of a Motor Vehicle (See Rule 55(1))',
      icon: '🔄',
      isModal: true,
      category: 'Transfer'
    },
    {
      id: 'form-30',
      name: 'Form 30',
      description: 'Application for Intimation and Transfer of Ownership (Part I & II, Financier Consent)',
      icon: '📝',
      isModal: true,
      category: 'Transfer'
    },
    {
      id: 'buyer-affidavit',
      name: 'Buyer Affidavit (क्रेता शपथ-पत्र)',
      description: 'Vehicle Purchase Affidavit - Before Executive Magistrate / Notary Public',
      icon: '📜',
      isModal: true,
      category: 'Affidavit'
    },
    {
      id: 'seller-affidavit',
      name: 'Seller Affidavit (विक्रेता शपथ-पत्र)',
      description: 'Vehicle Sale Affidavit - In The Court of Executive Magistrate / Notary Public',
      icon: '📜',
      isModal: true,
      category: 'Affidavit'
    },
    {
      id: 'form-20',
      name: 'Form 20',
      description: 'Form of Application for Registration of a Motor Vehicle',
      icon: '📋',
      isModal: true,
      category: 'Registration'
    },
    {
      id: 'form-44',
      name: 'Form 44',
      description: 'Application for Grant of Goods Carriage Permits (M.P.M.V.R.-44)',
      icon: '🚛',
      isModal: true,
      category: 'Permit'
    },
    {
      id: 'form-45',
      name: 'Form 45',
      description: 'Application in Respect of a Temporary Permit (M.P.M.V.R.-45)',
      icon: '🎫',
      isModal: true,
      category: 'Permit'
    },
    {
      id: 'form-46',
      name: 'Form 46',
      description: 'Application for grant of authorisation tourist Permit or National Permit',
      icon: '🚗',
      isModal: true,
      category: 'Permit'
    },
    {
      id: 'form-48',
      name: 'Form 48',
      description: 'Application for the Grant of National Permit',
      icon: '🚚',
      isModal: true,
      category: 'Permit'
    },
    {
      id: 'sapath-patra',
      name: 'Sapath Patra (शपथ-पत्र)',
      description: 'Affidavit Form for RTO - Notary District Civil Office',
      icon: '📜',
      isModal: true,
      category: 'Affidavit'
    },
    {
      id: 'karyalay-form',
      name: 'Karyalay Form (कार्यालय फॉर्म)',
      description: 'Office Secretary Form - Regional Transport Authority Division',
      icon: '📋',
      isModal: true,
      category: 'Office'
    },
    {
      id: 'karyalay-form-2',
      name: 'Karyalay Form 2 (कार्यालय फॉर्म 2)',
      description: 'Office Secretary Form - National Permit Authorization Certificate',
      icon: '📝',
      isModal: true,
      category: 'Office'
    }
  ]

  const categories = ['All', 'Transfer', 'Affidavit', 'Registration', 'Permit', 'Office']

  const handleFormClick = (form) => {
    if (form.isModal) {
      if (form.id === 'new-form') {
        setIsNewFormOpen(true)
      } else if (form.id === 'form-29') {
        setIsForm29Open(true)
      } else if (form.id === 'form-30') {
        setIsForm30Open(true)
      } else if (form.id === 'buyer-affidavit') {
        setIsBuyerAffidavitOpen(true)
      } else if (form.id === 'seller-affidavit') {
        setIsSellerAffidavitOpen(true)
      } else if (form.id === 'form-46') {
        setIsForm46Open(true)
      } else if (form.id === 'form-20') {
        setIsForm20Open(true)
      } else if (form.id === 'form-44') {
        setIsForm44Open(true)
      } else if (form.id === 'form-45') {
        setIsForm45Open(true)
      } else if (form.id === 'form-48') {
        setIsForm48Open(true)
      } else if (form.id === 'sapath-patra') {
        setIsSapathPatraOpen(true)
      } else if (form.id === 'karyalay-form') {
        setIsKaryalayFormOpen(true)
      } else if (form.id === 'karyalay-form-2') {
        setIsKaryalayForm2Open(true)
      }
    }
  }

  const handleDirectPrint = (formId, e) => {
    e.stopPropagation()
    const printWindow = window.open('', '_blank')

    if (formId === 'new-form') {
      setIsNewFormOpen(true)
      return
    }

    if (formId === 'form-29') {
      printWindow.document.write(`
        <html>
          <head>
            <title>FORM 29 - Notice of Transfer of Ownership</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Times New Roman', serif; font-size: 13px; line-height: 1.5; padding: 20px; }
              .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
              input { border: none !important; background: transparent; outline: none; width: 100%; font-family: 'Times New Roman', serif; font-size: 13px; padding: 0 2px; }
              @media print { body { padding: 10mm; margin: 0; } @page { margin: 0; size: A4; } }
            </style>
          </head>
          <body>
            <div class="form-container">
              <div style="text-align: center; margin-bottom: 14px;">
                <h1 style="font-size: 18px; font-weight: bold; letter-spacing: 2px;">FORM 29</h1>
                <p style="font-size: 12px; margin-top: 2px;">[See Rule 55(1)]</p>
                <h2 style="font-size: 14px; font-weight: bold; margin-top: 4px;">NOTICE OF TRANSFER OF OWNERSHIP OF A MOTOR VEHICLE</h2>
                <p style="font-size: 11px; margin-top: 4px; font-style: italic;">(To be made in duplicate and the duplicate copy with the endorsement of the Registering Authority to be returned to the transferor immediately on making entries of transfer of ownership in certificate of Registration and Form 24)</p>
              </div>
              <div style="margin-bottom: 12px;">
                <p style="font-weight: bold;">To</p>
                <p style="margin-left: 24px;">The Registering Authority .............................................................. (in whose jurisdiction the Transferee resides)</p>
              </div>
              <div style="margin-bottom: 12px; text-align: justify; lineHeight: 1.7;">
                <p>I/We ................................................................................................. resident of ........................................................................................................................ have on the .................... day of the year .................... Sold and delivered my / our Vehicle No ........................................ make ........................................ Chassis No .................................................................................... [Engine number or motor number in the case of Battery Operated Vehicles] .................................................................................... to Shri / Smt .................................................................................... Son/Wife/Daughter of .................................................................................... residing at ........................................................................................................................................................................ (House No./Street/Village/Town/Distt. And State) under an agreement of hire purchase/lease/ hypothecation with ................................................................................................................................................</p>
                <p style="margin-top: 8px;">The Registration Certificate and Insurance Certificate have been handed over to him /her / them.</p>
                <p style="margin-top: 4px;">To the best of my/our knowledge and belief the vehicle is not superdari and free from all encumbrances and information furnished is true. I/We undertake to hold my/our self-responsible for any inaccuracy or suppression of information.</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 24px; margin-bottom: 16px;">
                <div style="width: 45%;">
                  <p style="border-bottom: 1.5px dotted #000; min-height: 25px;"></p>
                  <p style="font-weight: bold;">Signature of the Financier (as his consent)</p>
                </div>
                <div style="width: 48%; text-align: right;">
                  <p style="border-bottom: 1.5px dotted #000; min-height: 25px;"></p>
                  <p style="font-weight: bold;">Signature or thumb impression of Registered Owner (Transferor)</p>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 14px;">
                <p>Date: ..............................</p>
                <p style="font-weight: bold;">I/We (Transferee)</p>
              </div>
              <div style="margin-bottom: 14px; border-top: 1px dashed #666; padding-top: 10px;">
                <p>Copy to the Registering Authority .............................................................. in whose jurisdiction the transferor resides.</p>
                <p style="font-size: 11px; font-style: italic;">Note. – To be sent to the Registering Authority by Registered Post Acknowledgment Due.</p>
              </div>
              <div style="border: 1.5px solid #000; padding: 10px 12px; margin-top: 10px;">
                <h3 style="text-align: center; font-size: 13px; font-weight: bold;">OFFICE ENDORSEMENT</h3>
                <p style="margin-top: 6px;">Ref.No. ................................................. Office of the ....................................................................</p>
                <p style="margin-top: 6px;">The ownership of the vehicle has been transferred to the name of .................................................................................... with the note of the above said agreement with effect from ....................................................</p>
                <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                  <p>Date: ..............................</p>
                  <p style="font-weight: bold;">Signature of the Registering Authority with Office seal</p>
                </div>
              </div>
              <div style="margin-top: 12px;">
                <p style="font-weight: bold;">To</p>
                <p style="margin-left: 24px;">The Transferor ......................................................................................................................................... (To be sent by Registered Post Acknowledgment Due)</p>
              </div>
            </div>
          </body>
        </html>
      `)
    } else if (formId === 'form-30') {
      printWindow.document.write(`
        <html>
          <head>
            <title>FORM 30 - Application for Intimation and Transfer of Ownership</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.45; padding: 15px; }
              .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
              @media print { body { padding: 8mm; margin: 0; } @page { margin: 0; size: A4; } }
            </style>
          </head>
          <body>
            <div class="form-container">
              <div style="text-align: center; margin-bottom: 10px;">
                <h1 style="font-size: 17px; font-weight: bold;">FORM 30</h1>
                <p style="font-size: 11px;">[See Rule 55(2) and (3)]</p>
                <h2 style="font-size: 13px; font-weight: bold; margin-top: 2px;">APPLICATION FOR INTIMATION AND TRANSFER OF OWNERSHIP OF A MOTOR VEHICLE</h2>
              </div>
              <p style="font-weight: bold;">To, The Registering Authority ..............................................................</p>
              <div style="border-top: 1.5px solid #000; padding-top: 6px; margin-top: 8px;">
                <h3 style="text-align: center; font-size: 12px; font-weight: bold;">PART I – FOR THE USE OF THE TRANSFEROR</h3>
                <p style="margin-top: 4px;">Name of the transferor: ............................................................................................................</p>
                <p style="margin-top: 4px;">Son/Wife/Daughter of: ............................................................................................................</p>
                <p style="margin-top: 4px;">Full Address: ......................................................................................................................................</p>
                <p style="margin-top: 6px; text-align: justify;">I/We, hereby declare that I/We have on this .................... day of the year .................... sold my/our motor vehicle bearing Registration mark ........................................ to Shri./Smt .................................................................................... Son/Wife/Daughter of .................................................................................... residing at ................................................................................................................................................................ (full address) and handed over the Certificate of Registration and the Certificate of Insurance to him/her/them.</p>
                <p style="margin-top: 4px;">I/We hereby declare that to the best of my/our knowledge the certificate of registration of the vehicle has not been suspended or cancelled.</p>
                <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                  <p>Date: ..............................</p>
                  <p style="font-weight: bold;">Signature or thumb impression of the Transferor</p>
                </div>
              </div>
              <div style="border-top: 1.5px solid #000; padding-top: 6px; margin-top: 10px;">
                <h3 style="text-align: center; font-size: 12px; font-weight: bold;">PART II – FOR THE USE OF TRANSFEREE</h3>
                <p style="margin-top: 4px;">Name of the Transferee: ............................................................................................................</p>
                <p style="margin-top: 4px;">Son/Wife/Daughter of: ................................................................................ Age: ....................</p>
                <p style="margin-top: 4px;">Full address: ......................................................................................................................................</p>
                <p style="margin-top: 6px; text-align: justify;">I/We hereby declare that I/We have on this .................... day of the year .................... purchased the motor vehicle bearing registration number ........................................ from .................................................................................................................................................... (name and full address) and request that necessary entries regarding the transfer of ownership of the vehicle in my/our name may be recorded in the certificate of registration and certificate of fitness of the vehicle, which is enclosed.</p>
                <p style="margin-top: 4px;">The certificate of Insurance is also enclosed. To the best of my knowledge and belief I/We have not suppressed any facts and information furnished is true. The vehicle is not superdari and free from all encumbrances. I/We undertake to hold myself responsible for any inaccuracy of the information.</p>
                <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                  <p>Date: ..............................</p>
                  <p style="font-weight: bold;">Signature or thumb impression of the Transferee</p>
                </div>
              </div>
              <div style="border-top: 1px dashed #444; padding-top: 6px; margin-top: 8px;">
                <h4 style="text-align: center; font-size: 11px; font-weight: bold;">CONSENT OF THE FINANCIER</h4>
                <p style="font-size: 11px; margin-top: 4px;">I/We being a party to an agreement of hire-purchase/lease/hypothecation in respect of motor vehicle specified above, give consent to the transfer of ownership of the said motor vehicle in the name of the Transferee named above.</p>
                <p style="font-size: 11px; margin-top: 4px;">(Full name and address of the Financier): ........................................................................................................................</p>
                <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 11px;">
                  <p>Date: ..............................</p>
                  <p style="font-weight: bold;">Signature of the Financier</p>
                </div>
              </div>
              <div style="border: 1px solid #000; padding: 6px 10px; margin-top: 8px; font-size: 11px;">
                <h4 style="text-align: center; font-size: 11.5px; font-weight: bold;">OFFICE ENDORSEMENT</h4>
                <p>Ref.No. ........................................ Office of the ....................................................................</p>
                <p style="margin-top: 3px;">The transfer of ownership of vehicle under continuation of an endorsement of hire-purchase /lease/ hypothecation agreement has been recorded with effect from .............................. in Form 24.</p>
                <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                  <p>Date: ..............................</p>
                  <p style="font-weight: bold;">Signature of the Registering Authority</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `)
    } else if (formId === 'buyer-affidavit') {
      printWindow.document.write(`
        <html>
          <head>
            <title>AFFIDAVIT - Vehicle Purchase (क्रेता शपथ-पत्र)</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.7; padding: 25px; }
              .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
              @media print { body { padding: 12mm; margin: 0; } @page { margin: 0; size: A4; } }
            </style>
          </head>
          <body>
            <div class="form-container">
              <div style="text-align: center; margin-bottom: 18px;">
                <p style="font-weight: bold;">Before,</p>
                <h1 style="font-size: 16px; font-weight: bold;">Executive Magistrate / Notary Public</h1>
                <h2 style="font-size: 16px; font-weight: bold; letter-spacing: 3px; margin-top: 10px;">(AFFIDAVIT)</h2>
              </div>
              <div style="text-align: justify; line-height: 1.8;">
                <p>I .....................................................................................................................................................................</p>
                <p>S/o, D/o, W/o ............................................................................................................................................</p>
                <p>Residence of ........................................................................ P. O. ................................................................</p>
                <p>P. S. .................................................................... District ....................................................................</p>
                <p>(A/P resident of ............................................................ P. S. ............................ Dist ............................)</p>
                <p style="margin-top: 8px; font-weight: bold;">Do hereby solemnly affirm and declare as follows :-</p>
                <p style="margin-top: 6px;">1. That I have purchased the vehicle ....................................................................................................</p>
                <p>Bearing registration No. ............................................................................................................................</p>
                <p>Engine No. ............................................................ Chassis No. ............................................................</p>
                <p>from Sri ................................................................................................................................................</p>
                <p>S/o, D/o, W/o ............................................................................................................................................</p>
                <p>Resident of ................................................................ P. S. ............................ Distt ............................</p>
                <p>A/o Resident of ............................................................ P. S. ............................ Distt ............................</p>
                <p style="margin-top: 8px;">2. That neither any case nor govt. dues stands against this vehicle up to the date of affidavit and if is I am fully responsible for the same.</p>
                <p style="margin-top: 8px;">3. That the ownership of the vehicle aforesaid may be transferred in the name of the purchaser above named for which I have got no objection, hence this affidavit.</p>
                <p style="margin-top: 10px; font-style: italic;">That the above content of this affidavit are true and correct to the best of my knowledge and belief.</p>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                <div style="width: 50%;">
                  <p style="font-weight: bold;">I identified the deponent</p>
                  <p style="font-size: 12px;">Who, has signed or given L.T.I. (Signature in Full) in my presence</p>
                  <p style="margin-top: 30px; border-bottom: 1.5px dotted #000; width: 70%;"></p>
                </div>
                <div style="width: 45%; text-align: center;">
                  <p style="font-weight: bold; font-size: 15px;">DEPONENT</p>
                  <p style="margin-top: 40px; border-bottom: 1.5px dotted #000;"></p>
                  <p style="font-size: 12px; margin-top: 4px; font-weight: bold;">(Signature in Full)</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `)
    } else if (formId === 'seller-affidavit') {
      printWindow.document.write(`
        <html>
          <head>
            <title>AFFIDAVIT - Vehicle Sale (विक्रेता शपथ-पत्र)</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.8; padding: 25px; }
              .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
              @media print { body { padding: 12mm; margin: 0; } @page { margin: 0; size: A4; } }
            </style>
          </head>
          <body>
            <div class="form-container">
              <div style="text-align: center; margin-bottom: 20px;">
                <p style="font-weight: bold;">In,</p>
                <h1 style="font-size: 16px; font-weight: bold;">The Court of Executive Magistrate / Notary Public</h1>
                <h2 style="font-size: 18px; font-weight: bold; letter-spacing: 4px; margin-top: 14px;">AFFIDAVIT</h2>
              </div>
              <div style="text-align: justify; line-height: 1.85;">
                <p>I ................................................................................ S/o ................................................................................</p>
                <p>resident of ........................................................................ P.O. ................................................................</p>
                <p>P. S. .................................................................... District ....................................................................</p>
                <p style="margin-top: 8px; font-weight: bold;">do hereby solemnly affirm and declare as follow :-</p>
                <p style="margin-top: 6px;">1. That I have sold my vehicle ............................................................................................................</p>
                <p>Bearing registration No. ............................................................................................................................</p>
                <p>Engine No. ............................................................ Chassis No. ............................................................</p>
                <p>to Sri ................................................................................................................................................</p>
                <p>S/o ....................................................................................................................................................</p>
                <p>Resident of ................................................................ P.O. ............................ P.S. ............................</p>
                <p>District ................................................................................................................................................</p>
                <p style="margin-top: 10px;">2. That neither any case nor Govt. dues stands against this vehicle up to the date of affidavit and it is I am fully responsible for the same.</p>
                <p style="margin-top: 10px;">3. That the ownership of the aforesaid vehicle may be transfered in the name of the purchager for which I have got no objection hence this affidavit.</p>
                <p style="margin-top: 12px; font-style: italic;">That the contents of this affidavit are true and correct to the best of my knowledge and belief.</p>
              </div>
              <div style="display: flex; justify-content: flex-end; margin-top: 60px;">
                <div style="width: 45%; text-align: center;">
                  <p style="font-weight: bold; font-size: 15px;">DEPONENT</p>
                  <p style="margin-top: 40px; border-bottom: 1.5px dotted #000;"></p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `)
    } else if (formId === 'form-20') {
      printWindow.document.write(`
        <html>
          <head>
            <title>FORM 20 - Motor Vehicle Registration</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.4; padding: 20px; }
              .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
              @media print { body { padding: 10mm; margin: 0; } @page { margin: 0; size: A4; } }
            </style>
          </head>
          <body>
            <div class="form-container">
              <div style="text-align: center; margin-bottom: 15px;">
                <h1 style="font-size: 18px; font-weight: bold; letter-spacing: 4px;">FORM - 20</h1>
                <p style="font-size: 11px; margin-top: 3px;">(See Rule 47)</p>
                <h2 style="font-size: 13px; font-weight: bold; margin-top: 5px;">Form of Application for Registration of a Motor Vehicle</h2>
              </div>
              <p>To, The Registering Authority</p>
              <p style="margin-top: 10px;">1. Full name of person to be registered as Registered owner: ................................................................</p>
              <p style="margin-top: 4px;">2. Son / Wife / Daughter of: ....................................................................................................................</p>
              <p style="margin-top: 4px;">3. Permanent address: ............................................................................................................................</p>
              <p style="margin-top: 4px;">4. Temporary address: ............................................................................................................................</p>
              <p style="margin-top: 4px;">5. Class of vehicle: .................................................... 6. Type of body: ....................................................</p>
              <p style="margin-top: 4px;">7. Maker's name: .................................................... 8. Month and year of manufacture: ............................</p>
              <p style="margin-top: 4px;">9. Number of cylinders: ............................................ 10. Horsepower: ....................................................</p>
              <p style="margin-top: 4px;">11. Chassis number: ................................................ 12. Engine number: ................................................</p>
              <p style="margin-top: 4px;">13. Fuel used: ............................................................ 14. Seating capacity: ................................................</p>
              <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                <p>Date: ..............................</p>
                <p style="font-weight: bold;">Signature of the Applicant</p>
              </div>
            </div>
          </body>
        </html>
      `)
    } else if (formId === 'form-46') {
      printWindow.document.write(`
        <html>
          <head>
            <title>FORM 46 - Tourist Permit or National Permit</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.4; padding: 20px; }
              .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
              @media print { body { padding: 10mm; margin: 0; } @page { margin: 0; size: A4; } }
            </style>
          </head>
          <body>
            <div class="form-container">
              <div style="text-align: center; margin-bottom: 15px;">
                <h1 style="font-size: 18px; font-weight: bold;">FORM 46</h1>
                <p style="font-size: 11px;">See Rule (83) (1) and 87 (1)</p>
                <h2 style="font-size: 13px; font-weight: bold; margin-top: 5px;">Form of application for grant of authorisation tourist Permit or National Permit</h2>
              </div>
              <p>To, The Regional / State Transport Authority</p>
              <p style="margin-top: 10px;">1. Name of the applicant (in full): ........................................................................................................</p>
              <p style="margin-top: 4px;">2. Son/Wife/Daughter of: ........................................................................................................................</p>
              <p style="margin-top: 4px;">3. Address: ................................................................................................................................................</p>
              <p style="margin-top: 4px;">4. Registration mark: .................................................... 5. Engine No: ....................................................</p>
              <p style="margin-top: 4px;">6. Chassis No: ................................................................ 7. Permit No: ....................................................</p>
              <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                <p>Date: ..............................</p>
                <p style="font-weight: bold;">Signature of the Applicant</p>
              </div>
            </div>
          </body>
        </html>
      `)
    } else if (formId === 'form-44') {
      printWindow.document.write(`
        <html>
          <head>
            <title>FORM M.P.M.V.R.-44 (GCPA) - Goods Carriage Permits</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Times New Roman', Times, serif; font-size: 13px; line-height: 1.5; padding: 20px; font-weight: 600; color: #000; }
              .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
              @media print { body { padding: 10mm; margin: 0; } @page { margin: 0; size: A4; } }
            </style>
          </head>
          <body>
            <div class="form-container">
              <div style="text-align: center; margin-bottom: 15px;">
                <h1 style="font-size: 18px; font-weight: bold;">FORM M.P.M.V.R.- 44 (GCPA)</h1>
                <p style="font-size: 11px;">[See Rule 72 (1), (C)]</p>
                <h2 style="font-size: 13px; font-weight: bold; margin-top: 8px;">An application in respect of Grant of goods Carriage permits</h2>
              </div>
              <p>To, The Regional Transport Authority</p>
              <p style="margin-top: 10px;">1. Full Name: ............................................................................................................................................</p>
              <p style="margin-top: 4px;">2. Father's/Husband's Name: ................................................................................................................</p>
              <p style="margin-top: 4px;">3. Address: ................................................................................................................................................</p>
              <p style="margin-top: 4px;">4. Registration mark: .................................................... 5. Laden weight: ................................................</p>
              <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                <p>Date: ..............................</p>
                <p style="font-weight: bold;">Signature of Applicant</p>
              </div>
            </div>
          </body>
        </html>
      `)
    } else if (formId === 'form-45') {
      printWindow.document.write(`
        <html>
          <head>
            <title>FORM M.P.M.V.R.-45 (T.P.A.) - Temporary Permit Application</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Times New Roman', Times, serif; font-size: 13px; line-height: 1.5; padding: 20px; font-weight: 600; color: #000; }
              .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
              @media print { body { padding: 10mm; margin: 0; } @page { margin: 0; size: A4; } }
            </style>
          </head>
          <body>
            <div class="form-container">
              <div style="text-align: center; margin-bottom: 15px;">
                <h1 style="font-size: 18px; font-weight: bold;">FORM M.P.M.V.R.-45 (T.P.A.)</h1>
                <p style="font-size: 11px;">(See Rule 72 (1) (D))</p>
                <h2 style="font-size: 13px; font-weight: bold; margin-top: 8px;">APPLICATION IN RESPECT OF A TEMPORARY PERMIT</h2>
              </div>
              <p>To, The Regional Transport Authority</p>
              <p style="margin-top: 10px;">1. Full Name: ............................................................................................................................................</p>
              <p style="margin-top: 4px;">2. Age: .................................................... 3. Father's Name: ................................................................</p>
              <p style="margin-top: 4px;">4. Address: ................................................................................................................................................</p>
              <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                <p>Date: ..............................</p>
                <p style="font-weight: bold;">Signature of Applicant</p>
              </div>
            </div>
          </body>
        </html>
      `)
    } else if (formId === 'form-48') {
      printWindow.document.write(`
        <html>
          <head>
            <title>FORM 48 - Application for National Permit</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.4; padding: 20px; }
              .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
              @media print { body { padding: 10mm; margin: 0; } @page { margin: 0; size: A4; } }
            </style>
          </head>
          <body>
            <div class="form-container">
              <div style="text-align: center; margin-bottom: 15px;">
                <h1 style="font-size: 18px; font-weight: bold;">FORM 48</h1>
                <p style="font-size: 11px;">[Refer Rule 86]</p>
                <h2 style="font-size: 13px; font-weight: bold; margin-top: 5px;">APPLICATION FOR THE GRANT OF NATIONAL PERMIT</h2>
              </div>
              <p>To, The Regional/State Transport Authority</p>
              <p style="margin-top: 10px;">1. Name of applicant: ........................................................................................................................</p>
              <p style="margin-top: 4px;">2. Father's/Husband's name: ................................................................................................................</p>
              <p style="margin-top: 4px;">3. Full Address: ..........................................................................................................................................</p>
              <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                <p>Date: ..............................</p>
                <p style="font-weight: bold;">Signature of Applicant</p>
              </div>
            </div>
          </body>
        </html>
      `)
    } else if (formId === 'sapath-patra') {
      printWindow.document.write(`
        <html>
          <head>
            <title>शपथ-पत्र (Sapath Patra)</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Noto Sans Devanagari', 'Mangal', sans-serif; font-size: 14px; line-height: 1.6; padding: 20px; }
              .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
              @media print { body { padding: 10mm; margin: 0; } @page { margin: 0; size: A4; } }
            </style>
          </head>
          <body>
            <div class="form-container">
              <div style="text-align: center; margin-bottom: 15px;">
                <h1 style="font-size: 20px; font-weight: bold;">शपथ-पत्र</h1>
                <p style="font-size: 13px;">समक्ष : नोटरी जिला कचहरी</p>
              </div>
              <p>मैं ................................................................ उम्र ......... वर्ष, निवासी ................................................................ जिला ................................................................</p>
              <p style="margin-top: 8px;">1. यह कि मैं उपरोक्त पते का स्थायी निवासी हूँ।</p>
              <p style="margin-top: 4px;">2. यह कि वाहन क्रमांक .................................................... चेचिस नं. ....................................................</p>
              <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                <p>दिनांक : ..............................</p>
                <p style="font-weight: bold;">शपथकर्ता</p>
              </div>
            </div>
          </body>
        </html>
      `)
    } else if (formId === 'karyalay-form' || formId === 'karyalay-form-2') {
      printWindow.document.write(`
        <html>
          <head>
            <title>कार्यालय फॉर्म (Karyalay Form)</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Noto Sans Devanagari', 'Mangal', sans-serif; font-size: 13px; line-height: 1.5; padding: 20px; }
              .form-container { width: 100%; max-width: 800px; margin: 0 auto; }
              @media print { body { padding: 10mm; margin: 0; } @page { margin: 0; size: A4; } }
            </style>
          </head>
          <body>
            <div class="form-container">
              <div style="text-align: center; margin-bottom: 15px;">
                <h1 style="font-size: 18px; font-weight: bold;">कार्यालय प्राधिकृत सचिव</h1>
                <h2 style="font-size: 14px; font-weight: bold;">क्षेत्रीय परिवहन प्राधिकार संभाग, रायपुर (छ.ग.)</h2>
              </div>
              <p>प्रति,</p>
              <p style="margin-left: 20px;">सचिव, क्षेत्रीय परिवहन प्राधिकार संभाग, रायपुर</p>
              <p style="margin-top: 15px;">विषय : नेशनल परमिट प्राधिकार प्रमाण पत्र जारी करने बाबत।</p>
              <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                <p>दिनांक : ..............................</p>
                <p style="font-weight: bold;">हस्ताक्षर आवेदक</p>
              </div>
            </div>
          </body>
        </html>
      `)
    }

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // Filter forms based on search query and category
  const filteredForms = forms.filter(form => {
    const matchesSearch =
      form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'All' || form.category.toLowerCase() === selectedCategory.toLowerCase()

    return matchesSearch && matchesCategory
  })

  const categoryMeta = {
    Transfer: { label: 'Ownership Transfer', desc: 'Sell or buy a vehicle — notices, applications and the complete transfer set.', tile: 'bg-orange-50 text-orange-600 ring-orange-100', chip: 'bg-orange-50 text-orange-700' },
    Affidavit: { label: 'Affidavits', desc: 'Buyer, seller and RTO affidavits for notary or executive magistrate.', tile: 'bg-violet-50 text-violet-600 ring-violet-100', chip: 'bg-violet-50 text-violet-700' },
    Registration: { label: 'Registration', desc: 'Apply for registration of a new motor vehicle.', tile: 'bg-sky-50 text-sky-600 ring-sky-100', chip: 'bg-sky-50 text-sky-700' },
    Permit: { label: 'Permits', desc: 'Goods carriage, temporary, tourist and national permit applications.', tile: 'bg-emerald-50 text-emerald-600 ring-emerald-100', chip: 'bg-emerald-50 text-emerald-700' },
    Office: { label: 'Office Forms', desc: 'Regional Transport Authority office letters and certificates.', tile: 'bg-slate-100 text-slate-600 ring-slate-200', chip: 'bg-slate-100 text-slate-700' }
  }

  const countFor = (cat) => (cat === 'All' ? forms.length : forms.filter(f => f.category === cat).length)

  // "Buyer Affidavit (क्रेता शपथ-पत्र)" -> ['Buyer Affidavit', 'क्रेता शपथ-पत्र']
  const splitName = (name) => {
    const match = name.match(/^(.*?)\s*\((.*)\)\s*$/)
    return match ? [match[1], match[2]] : [name, null]
  }

  // With "All" selected and no search, show the forms grouped into sections
  const sections = selectedCategory === 'All' && !searchQuery
    ? categories
        .filter(c => c !== 'All')
        .map(cat => ({ cat, items: filteredForms.filter(f => f.category === cat) }))
        .filter(s => s.items.length)
    : [{ cat: null, items: filteredForms }]

  const heading = { fontFamily: "'Poppins', sans-serif" }

  const renderCard = (form) => {
    const [title, hindi] = splitName(form.name)
    const meta = categoryMeta[form.category] || categoryMeta.Office
    return (
      <div
        key={form.id}
        onClick={() => handleFormClick(form)}
        className="group flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-3.5 transition-all duration-200 hover:border-blue-300 hover:shadow-[0_8px_24px_-12px_rgba(31,42,60,0.25)]"
      >
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ring-1 ${meta.tile}`}>
            {form.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 style={heading} className="truncate text-sm font-semibold text-[#1f2a3c] group-hover:text-blue-600">
                {title}
              </h3>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.chip}`}>
                {form.category}
              </span>
            </div>
            {hindi && <p className="text-xs font-medium text-slate-400">{hindi}</p>}
          </div>
        </div>

        <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-600">
          {form.description}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-blue-700">
            Fill Form
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </span>
          <button
            onClick={(e) => handleDirectPrint(form.id, e)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            title="Print Blank / Quick Form"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Blank
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f6fa] px-3 pt-3 pb-10 sm:px-4 lg:pt-5">
      <div className="mx-auto max-w-6xl">
        {/* Dark header band: title, search and category tabs in one compact block */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1f2a3c] to-[#2b3a52] px-4 py-4 sm:px-6 sm:py-5">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white"
                  title="Back to Dashboard"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 style={heading} className="text-lg font-semibold leading-tight text-white sm:text-xl">
                    RTO Forms <span className="text-amber-300">·</span> <span className="text-slate-300 font-medium text-base">आरटीओ फॉर्म्स</span>
                  </h1>
                  <p className="text-xs text-slate-400 sm:text-[13px]">
                    {forms.length} official forms — fill online, print on A4
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="flex h-9 min-w-0 flex-1 items-center rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-400 lg:w-80 lg:flex-none">
                  <svg className="ml-3 h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search Form 29, Affidavit, Permit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mr-1.5 cursor-pointer rounded p-1 text-slate-400 hover:text-slate-700"
                      title="Clear"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => navigate('/vehicle-transfer')}
                  className="hidden h-9 cursor-pointer whitespace-nowrap rounded-lg bg-white/10 px-3 text-xs font-semibold text-slate-100 hover:bg-white/20 sm:block"
                >
                  Vehicle Transfer
                </button>
                <button
                  onClick={() => navigate('/vehicle-registration')}
                  className="hidden h-9 cursor-pointer whitespace-nowrap rounded-lg bg-white/10 px-3 text-xs font-semibold text-slate-100 hover:bg-white/20 sm:block"
                >
                  Vehicles
                </button>
              </div>
            </div>

            {/* Category tabs */}
            <div className="mt-4 flex items-center gap-1.5 overflow-x-auto border-t border-white/10 pt-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-white text-[#1f2a3c]'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat === 'All' ? 'All Forms' : cat}
                  <span className={`rounded px-1 text-[10px] ${selectedCategory === cat ? 'bg-[#1f2a3c]/10 text-[#1f2a3c]' : 'bg-white/10 text-slate-300'}`}>
                    {countFor(cat)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forms */}
        {filteredForms.length > 0 ? (
          <div className="mt-5 space-y-6">
            {sections.map(({ cat, items }) => (
              <section key={cat || 'results'}>
                {cat ? (
                  <div className="mb-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-slate-200 pb-2">
                    <h2 style={heading} className="text-[15px] font-semibold text-[#1f2a3c]">
                      {categoryMeta[cat].label}
                      <span className="ml-1.5 text-xs font-medium text-slate-400">{items.length}</span>
                    </h2>
                    <p className="text-xs text-slate-500">{categoryMeta[cat].desc}</p>
                  </div>
                ) : (
                  <p className="mb-2.5 text-[13px] text-slate-500">
                    <span className="font-semibold text-[#1f2a3c]">{items.length}</span> form{items.length !== 1 ? 's' : ''}
                    {selectedCategory !== 'All' && <> in <span className="font-semibold text-[#1f2a3c]">{selectedCategory}</span></>}
                    {searchQuery && <> matching &ldquo;<span className="font-semibold text-[#1f2a3c]">{searchQuery}</span>&rdquo;</>}
                  </p>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map(renderCard)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
            <p style={heading} className="text-base font-semibold text-[#1f2a3c]">
              No forms found{searchQuery ? ` for "${searchQuery}"` : ''}
            </p>
            <p className="mt-1 text-[13px] text-slate-500">Try another keyword or pick a different category.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All') }}
              className="mt-4 cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Show all forms
            </button>
          </div>
        )}
      </div>

      {/* Form Modals */}
      {isNewFormOpen && <NewFormModal onClose={() => setIsNewFormOpen(false)} />}
      {isForm29Open && <Form29Modal onClose={() => setIsForm29Open(false)} />}
      {isForm30Open && <Form30Modal onClose={() => setIsForm30Open(false)} />}
      {isBuyerAffidavitOpen && <BuyerAffidavitModal onClose={() => setIsBuyerAffidavitOpen(false)} />}
      {isSellerAffidavitOpen && <SellerAffidavitModal onClose={() => setIsSellerAffidavitOpen(false)} />}
      {isForm20Open && <Form20Modal onClose={() => setIsForm20Open(false)} />}
      {isForm44Open && <Form44Modal onClose={() => setIsForm44Open(false)} />}
      {isForm45Open && <Form45Modal onClose={() => setIsForm45Open(false)} />}
      {isForm46Open && <Form46Modal onClose={() => setIsForm46Open(false)} />}
      {isForm48Open && <Form48Modal onClose={() => setIsForm48Open(false)} />}
      {isSapathPatraOpen && <SapathPatraModal onClose={() => setIsSapathPatraOpen(false)} />}
      {isKaryalayFormOpen && <KaryalayFormModal onClose={() => setIsKaryalayFormOpen(false)} />}
      {isKaryalayForm2Open && <KaryalayForm2Modal onClose={() => setIsKaryalayForm2Open(false)} />}
    </div>
  )
}

export default Forms
