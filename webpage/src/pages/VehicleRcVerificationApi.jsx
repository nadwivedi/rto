import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconShield, IconCheck, IconWallet, IconCar, IconChart, IconCode, IconMapPin, IconDocument } from '../components/Icons'
import { rcVerificationApiFaqs } from '../data/rcVerificationApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "MH12QW4521",
  "data": {
    "REGN_NO": "MH12QW4521",
    "STATUS": "ACTIVE",
    "REGISTERED_AT": "PUNE RTO, MAHARASHTRA",
    "OWNER_NAME": "SURESH PATIL",
    "OWNER_SERIAL_NO": "1",
    "MAKER_DESC": "MARUTI SUZUKI INDIA LTD",
    "MAKER_MODEL": "SWIFT VXI",
    "VEHICLE_CLASS": "MOTOR CAR (LMV)",
    "CHASI_NO": "MA3EWDE1S00654321",
    "ENG_NO": "K12MN7654321",
    "REGN_DT": "14-Mar-2021",
    "REGN_UPTO": "13-Mar-2036",
    "FINANCER_DETAILS": "HDFC BANK LTD",
    "INSURANCE_UPTO": "13-Mar-2027",
    "BLACKLIST_STATUS": "NA",
    "NOC_DETAILS": "NA"
  },
  "usage": { "limit": 2000, "used": 734, "remaining": 1266 }
}`

export default function VehicleRcVerificationApi() {
  return (
    <ProductLanding
      hero={{
        title: `Vehicle RC Verification API — Verify RC by Vehicle Number from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi vehicle RC verification API verifies the registration certificate of any Indian vehicle number and returns owner, maker and model, chassis and engine number, registration validity, financer, insurance, blacklist and NOC as JSON in seconds, from ${LOOKUP_PRICE} per successful verification.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'RC verification by API',
        title: 'Verify any RC before you trust it',
        description: 'Owner, chassis, engine and status checked automatically in your software.',
        paragraphs: [
          <>
            Loan companies, insurers, used car platforms and fleet operators all receive RC copies from customers.
            A photo or photocopy can be old, edited or for a different vehicle. {s('RC verification')} means
            checking the details against the registration record, not trusting the paper.
          </>,
          <>
            The {s('RTO Sarthi vehicle RC verification API')} does that from the vehicle number. Your software gets
            the owner name, chassis and engine number, maker and model, registration date and validity, financer,
            blacklist and NOC status, ready to match with the customer’s documents. It works for vehicles from{' '}
            {s('every state of India')} and starts at {s(`${LOOKUP_PRICE} per successful verification`)}.
          </>,
          <>
            Not a developer? RTO agents and dealers can verify RCs in the app with{' '}
            <Link to="/rc-verification-software" className={linkClass}>RC verification software</Link>. For every
            field the API returns, see the{' '}
            <Link to="/vahan-api" className={linkClass}>Vahan API</Link> page.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the RC verification API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your verification limit. We create a private API key for your business.' },
          { title: 'Send the vehicle number', description: 'Your app, loan system or CRM sends the number from the customer’s RC.' },
          { title: 'Match the RC details', description: 'Compare owner, chassis, engine and status with the submitted RC and flag any mismatch.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'RC details in the API response',
        description: 'OWNER_NAME, CHASI_NO and ENG_NO to match the RC, STATUS, BLACKLIST_STATUS and NOC_DETAILS to check it.',
        blocks: [{ label: 'JSON response (RC fields)', code: responseExample }],
        note: 'Sample data, shortened. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can do with an RC verification API',
        description: 'Verify vehicles from the number plate, for every kind of business.',
        items: [
          { icon: <IconWallet />, variant: 'brand', title: 'Vehicle loan & NBFC checks', description: 'Verify the RC owner, financer and hypothecation before you approve or close a vehicle loan.' },
          { icon: <IconShield />, variant: 'accent', title: 'Insurance onboarding', description: 'Confirm chassis, engine, model and owner before issuing or renewing a motor policy.' },
          { icon: <IconCar />, variant: 'success', title: 'Used car buying & selling', description: 'Check the RC, owner serial number, blacklist and NOC before you buy or list a vehicle.' },
          { icon: <IconChart />, variant: 'brand', title: 'Fleet & driver onboarding', description: 'Verify every truck, cab or bike added to your fleet or aggregator platform.' },
          { icon: <IconDocument />, variant: 'accent', title: 'Catch fake RC copies', description: 'Match the RC photo the customer uploaded against the registration record.' },
          { icon: <IconCode />, variant: 'success', title: 'For app developers', description: 'Add RC verification by vehicle number to your website, app or CRM with simple JSON.' },
          { icon: <IconMapPin />, variant: 'brand', title: 'All states of India', description: 'Two-wheelers, cars and commercial vehicles from any state or union territory, including BH series.' },
          { icon: <IconCheck />, variant: 'accent', title: `From ${LOOKUP_PRICE}, pay on success`, description: 'Prepaid limit with no monthly fee. Vehicles not found are returned to your limit.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle RC verification API from ${LOOKUP_PRICE} per verification`,
        description: 'Full RC details in every successful verification.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful verification · no monthly fee',
        },
        listTitle: 'RC details returned',
        items: [
          'Registration status', 'Registering RTO', 'Owner name & serial number', 'Maker & model',
          'Chassis number', 'Engine number', 'Registration date & validity', 'Financer (hypothecation)',
          'Blacklist status', 'NOC details', 'Insurance & PUC validity', 'Fitness & road tax validity',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a vehicle RC verification API?',
        description: 'Anyone who needs to trust a vehicle’s RC.',
        items: [
          'Vehicle loan & NBFC companies', 'Motor insurance platforms & brokers', 'Used car dealers & marketplaces',
          'Fleet, cab & logistics operators', 'Vehicle rental & aggregator apps', 'KYC & verification platforms',
        ],
      }}
      related={[
        { to: '/vehicle-verification-api', label: 'Vehicle verification API' },
        { to: '/vehicle-lookup-api', label: 'Vehicle lookup API' },
        { to: '/vahan-api', label: 'Vahan API' },
        { to: '/rc-verification-software', label: 'RC verification software' },
      ]}
      faq={{
        title: 'Vehicle RC verification API — FAQ',
        description: 'RC details, matching, price and coverage.',
        items: rcVerificationApiFaqs,
      }}
      cta={{
        title: `Verify vehicle RC by API from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and verify the RC of any vehicle number in seconds.',
      }}
    />
  )
}
