import { Link } from 'react-router-dom'
import ProductLanding from '../components/ProductLanding'
import { IconShield, IconCheck, IconWallet, IconCar, IconChart, IconCode, IconMapPin, IconClock } from '../components/Icons'
import { vehicleVerificationApiFaqs } from '../data/vehicleVerificationApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const s = (t) => <strong className="text-slate-700">{t}</strong>
const linkClass = 'font-semibold text-brand-800 hover:underline'

const responseExample = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "DL1LAB3344",
  "data": {
    "REGN_NO": "DL1LAB3344",
    "STATUS": "ACTIVE",
    "REGISTERED_AT": "DELHI (SOUTH) RTO, DELHI",
    "REGN_UPTO": "19-Jun-2030",
    "OWNER_NAME": "RAJESH KUMAR",
    "MAKER_MODEL": "ASHOK LEYLAND DOST+",
    "VEHICLE_CLASS": "GOODS CARRIER",
    "CHASI_NO": "MB1AXCHD5LPXY1234",
    "ENG_NO": "ZDLPXY12345",
    "INSURANCE_UPTO": "18-Jun-2027",
    "PUCC_UPTO": "02-Dec-2026",
    "FIT_UPTO": "18-Jun-2027",
    "TAX_UPTO": "31-Mar-2027",
    "FINANCER_DETAILS": "MAHINDRA & MAHINDRA FINANCIAL SERVICES LTD",
    "BLACKLIST_STATUS": "NA",
    "NOC_DETAILS": "NA"
  },
  "usage": { "limit": 5000, "used": 1890, "remaining": 3110 }
}`

export default function VehicleVerificationApi() {
  return (
    <ProductLanding
      hero={{
        title: `Vehicle Verification API — Verify Any Indian Vehicle by Number from ${LOOKUP_PRICE}`,
        intro: `The RTO Sarthi vehicle verification API checks any Indian vehicle number and returns registration status, chassis and engine number, owner, insurance, PUC, fitness and tax validity, financer, blacklist and NOC as JSON in seconds, so your software can approve the vehicle or flag it, from ${LOOKUP_PRICE} per successful verification.`,
      }}
      buttons={[
        { label: 'Get API Key', href: '/contact' },
        { label: 'Talk to Us', href: '/contact' },
      ]}
      overview={{
        label: 'Vehicle verification by API',
        title: 'Check a vehicle before you accept it',
        description: 'Registered, insured, fit, taxed and clean, verified automatically.',
        paragraphs: [
          <>
            Fleets, cab and delivery platforms, lenders, insurers and used car dealers all take on vehicles they
            have never seen before. Accepting one that is unregistered, uninsured, unfit, under someone else’s
            loan or blacklisted is an expensive mistake.
          </>,
          <>
            The {s('RTO Sarthi vehicle verification API')} checks the vehicle from its number. Your software gets the
            {s(' registration status, chassis and engine number, owner, validity of insurance, PUC, fitness and tax, financer, blacklist and NOC')}
            , and can approve the vehicle or send it for review. It works for vehicles from{' '}
            {s('every state of India')} and starts at {s(`${LOOKUP_PRICE} per successful verification`)}.
          </>,
          <>
            Only need to match an RC copy? See the{' '}
            <Link to="/vehicle-rc-verification-api" className={linkClass}>RC verification API</Link>. Not a developer?
            Verify vehicles in the app with{' '}
            <Link to="/rc-verification-software" className={linkClass}>RC verification software</Link>.
          </>,
          <span className="text-sm">
            RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is
            not affiliated with the Ministry of Road Transport and Highways or NIC.
          </span>,
        ],
      }}
      steps={{
        title: 'How the vehicle verification API works',
        description: 'Live in your software, usually the same day.',
        items: [
          { title: 'Get an API key', description: 'Contact us and choose your verification limit. We create a private API key for your business.' },
          { title: 'Send the vehicle number', description: 'Your onboarding flow, app or backend sends the vehicle number to verify.' },
          { title: 'Approve or flag', description: 'Check status, validity dates, finance and blacklist, then approve the vehicle or send it for review.' },
        ],
      }}
      code={{
        label: 'Sample response',
        title: 'Verification data in the API response',
        description: 'STATUS and REGN_UPTO for registration, *_UPTO dates for validity, FINANCER_DETAILS, BLACKLIST_STATUS and NOC_DETAILS for risk.',
        blocks: [{ label: 'JSON response (verification fields)', code: responseExample }],
        note: 'Sample data, shortened. Details are returned wherever they are available on the vehicle record.',
      }}
      features={{
        label: 'Use cases',
        title: 'What you can do with a vehicle verification API',
        description: 'Verify vehicles from the number plate, for every kind of business.',
        items: [
          { icon: <IconCar />, variant: 'brand', title: 'Driver & vehicle onboarding', description: 'Verify every cab, bike or truck before it joins your ride-hailing, delivery or logistics platform.' },
          { icon: <IconChart />, variant: 'accent', title: 'Fleet compliance', description: 'Check insurance, PUC, fitness and tax for your whole fleet and flag vehicles that are not road-legal.' },
          { icon: <IconWallet />, variant: 'success', title: 'Loans & NBFCs', description: 'Verify registration, owner and existing financer before you lend against a vehicle.' },
          { icon: <IconShield />, variant: 'brand', title: 'Motor insurance', description: 'Confirm the vehicle is registered and active, with matching chassis and engine, before issuing a policy.' },
          { icon: <IconCheck />, variant: 'accent', title: 'Used car buying', description: 'Check blacklist, NOC, finance and registration validity before you buy or list a vehicle.' },
          { icon: <IconClock />, variant: 'success', title: 'Rental & leasing', description: 'Verify vehicles you rent out or take on lease, and recheck validity dates over time.' },
          { icon: <IconCode />, variant: 'brand', title: 'For app developers', description: 'Add vehicle verification to your onboarding or KYC flow with a simple JSON API.' },
          { icon: <IconMapPin />, variant: 'accent', title: 'All states of India', description: 'Two-wheelers, cars and commercial vehicles from any state or union territory, including BH series.' },
        ],
      }}
      checklist={{
        id: 'pricing',
        label: 'Pricing',
        title: `Vehicle verification API from ${LOOKUP_PRICE} per verification`,
        description: 'Every check in one successful verification.',
        price: {
          caption: 'Starting at',
          amount: LOOKUP_PRICE,
          text: 'per successful verification · no monthly fee',
        },
        listTitle: 'What you can verify',
        items: [
          'Registration status', 'Registration validity', 'Registering RTO', 'Owner name',
          'Chassis & engine number', 'Maker, model & class', 'Insurance validity', 'PUC validity',
          'Fitness validity', 'Road tax validity', 'Financer (hypothecation)', 'Blacklist & NOC status',
        ],
        note: 'Details are returned wherever they are available on the vehicle record.',
      }}
      audiences={{
        title: 'Who uses a vehicle verification API?',
        description: 'Any business that takes on vehicles it has not seen before.',
        items: [
          'Cab, delivery & logistics platforms', 'Fleet & transport operators', 'Vehicle loan & NBFC companies',
          'Motor insurance platforms & brokers', 'Used car dealers & marketplaces', 'KYC & background verification firms',
        ],
      }}
      related={[
        { to: '/vehicle-rc-verification-api', label: 'Vehicle RC verification API' },
        { to: '/vehicle-lookup-api', label: 'Vehicle lookup API' },
        { to: '/vahan-api', label: 'Vahan API' },
      ]}
      faq={{
        title: 'Vehicle verification API — FAQ',
        description: 'What you can verify, price and coverage.',
        items: vehicleVerificationApiFaqs,
      }}
      cta={{
        title: `Verify any vehicle by API from ${LOOKUP_PRICE}`,
        text: 'Contact RTO Sarthi on call or WhatsApp for your API key and verify any Indian vehicle number in seconds.',
      }}
    />
  )
}
