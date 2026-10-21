import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import Button from '../components/Button'
import { container, section, glassCard, bodyMuted, h2Section, cn } from '../lib/styles'
import { API_ENDPOINT, DEMO_VEHICLE_NO, apiDocsFaqs } from '../data/vehicleApi'
import { LOOKUP_PRICE } from '../data/vehicleInfo'

const linkClass = 'font-semibold text-brand-800 hover:underline'
const inlineCode = 'rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800 break-all'
const th = 'border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500'
const td = 'border-b border-slate-100 px-3 py-2 align-top text-sm text-slate-700'

const successResponse = `{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "${DEMO_VEHICLE_NO}",
  "data": {
    "REGN_NO": "${DEMO_VEHICLE_NO}",
    "STATUS_AS_ON": "21-Oct-2026",
    "REGISTERED_AT": "RAIPUR RTO, CHHATTISGARH",
    "OWNER_NAME": "RAM KUMAR",
    "OWNER_SERIAL_NO": "1",
    "PRESENT_ADDRESS": "WARD NO 12, TELIBANDHA, RAIPUR, CHHATTISGARH 492001",
    "VEHICLE_CLASS": "GOODS CARRIER (LGV)",
    "VEHICLE_CATEGORY": "LGV",
    "BODY_TYPE_DESC": "OPEN",
    "MAKER_DESC": "TATA MOTORS LTD",
    "MAKER_MODEL": "ACE GOLD",
    "FUEL_DESC": "DIESEL",
    "FUEL_NORMS": "BHARAT STAGE VI",
    "COLOR": "WHITE",
    "CHASI_NO": "MAT445123K1A12345",
    "ENG_NO": "275IDI12ABC345",
    "CUBIC_CAPACITY": "702",
    "SEATING_CAPACITY": "2",
    "UNLADEN_WEIGHT": "1080",
    "MANU_MONTH_YR": "05/2019",
    "REGN_DT": "15-Jun-2019",
    "REGN_UPTO": "14-Jun-2034",
    "FINANCER_DETAILS": "SHRIRAM FINANCE LTD",
    "INSURANCE_COMP": "TATA AIG GENERAL INSURANCE CO. LTD.",
    "INS_POLICY_NO": "0164123456",
    "INSURANCE_UPTO": "12-Mar-2027",
    "PUCC_NO": "CG01200030012345",
    "PUCC_UPTO": "20-Dec-2026",
    "FIT_UPTO": "14-Jun-2027",
    "TAX_UPTO": "31-Mar-2027",
    "PERMIT_NO": "CG2019-GP-1234A",
    "BLACKLIST_STATUS": "NA",
    "NOC_DETAILS": "NA"
  },
  "usage": { "limit": 1000, "used": 101, "remaining": 899 }
}`

const errorExample = `{
  "success": false,
  "message": "API call limit exhausted. Please recharge to continue.",
  "limitExhausted": true,
  "usage": { "limit": 1000, "used": 1000, "remaining": 0 }
}`

const examples = [
  {
    label: 'cURL',
    code: `curl -H "x-api-key: YOUR_API_KEY" \\
  "${API_ENDPOINT}?vno=${DEMO_VEHICLE_NO}"`,
  },
  {
    label: 'Node.js',
    code: `const res = await fetch('${API_ENDPOINT}?vno=${DEMO_VEHICLE_NO}', {
  headers: { 'x-api-key': process.env.RTO_SARTHI_API_KEY }
})
const body = await res.json()

if (body.success) {
  console.log(body.data.OWNER_NAME, body.data.MAKER_MODEL)
  console.log('Calls left:', body.usage.remaining)
} else {
  console.log(res.status, body.message)
}`,
  },
  {
    label: 'PHP',
    code: `<?php
$ch = curl_init('${API_ENDPOINT}?vno=' . urlencode('${DEMO_VEHICLE_NO}'));
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ['x-api-key: ' . getenv('RTO_SARTHI_API_KEY')],
  CURLOPT_TIMEOUT => 30,
]);
$body = json_decode(curl_exec($ch), true);
curl_close($ch);

if ($body['success']) {
  echo $body['data']['OWNER_NAME'] . ' - ' . $body['data']['MAKER_MODEL'];
} else {
  echo $body['message'];
}`,
  },
  {
    label: 'Python',
    code: `import os, requests

res = requests.get(
    "${API_ENDPOINT}",
    params={"vno": "${DEMO_VEHICLE_NO}"},
    headers={"x-api-key": os.environ["RTO_SARTHI_API_KEY"]},
    timeout=30,
)
body = res.json()

if body["success"]:
    print(body["data"]["OWNER_NAME"], body["data"]["MAKER_MODEL"])
    print("Calls left:", body["usage"]["remaining"])
else:
    print(res.status_code, body["message"])`,
  },
  {
    label: 'POST (JSON body)',
    code: `curl -X POST "${API_ENDPOINT}" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"vno": "${DEMO_VEHICLE_NO}"}'`,
  },
]

const fields = [
  ['REGN_NO', 'Registration (vehicle) number'],
  ['STATUS_AS_ON', 'Date the record status was taken'],
  ['REGISTERED_AT', 'Registering RTO and state'],
  ['OWNER_NAME', 'Registered owner'],
  ['OWNER_SERIAL_NO', 'Owner number: 1 for first owner, 2 for second, and so on'],
  ['PRESENT_ADDRESS', 'Owner’s address'],
  ['VEHICLE_CLASS', 'Vehicle class, e.g. MOTOR CAR (LMV), M-CYCLE/SCOOTER (2WN)'],
  ['VEHICLE_CATEGORY', 'Vehicle category'],
  ['BODY_TYPE_DESC', 'Body type'],
  ['MAKER_DESC', 'Manufacturer'],
  ['MAKER_MODEL', 'Model and variant'],
  ['FUEL_DESC', 'Fuel type'],
  ['FUEL_NORMS', 'Emission norms (BS IV, BS VI…)'],
  ['COLOR', 'Colour'],
  ['CHASI_NO', 'Chassis number'],
  ['ENG_NO', 'Engine number'],
  ['CUBIC_CAPACITY', 'Engine capacity in cc'],
  ['SEATING_CAPACITY', 'Seating capacity'],
  ['UNLADEN_WEIGHT', 'Unladen weight in kg'],
  ['MANU_MONTH_YR', 'Month and year of manufacture'],
  ['REGN_DT', 'Registration date'],
  ['REGN_UPTO', 'Registration valid up to'],
  ['FINANCER_DETAILS', 'Financer (hypothecation)'],
  ['INSURANCE_COMP', 'Insurance company'],
  ['INS_POLICY_NO', 'Insurance policy number'],
  ['INSURANCE_UPTO', 'Insurance valid up to'],
  ['PUCC_NO', 'PUC certificate number'],
  ['PUCC_UPTO', 'PUC valid up to'],
  ['FIT_UPTO', 'Fitness valid up to'],
  ['TAX_UPTO', 'Road tax valid up to (LTT = lifetime tax)'],
  ['PERMIT_NO', 'Permit number, for commercial vehicles'],
  ['BLACKLIST_STATUS', 'Blacklist status'],
  ['NOC_DETAILS', 'NOC details'],
]

const errors = [
  ['200', 'Vehicle details found', 'Yes'],
  ['400', 'Vehicle number missing or invalid', 'No'],
  ['401', 'API key missing or wrong', 'No'],
  ['403', 'Call limit used up (limitExhausted: true), or key switched off', 'No'],
  ['404', 'Vehicle not found', 'No'],
  ['502', 'Vehicle information service busy, try again', 'No'],
]

const toc = [
  ['quick-start', 'Quick start'],
  ['authentication', 'Authentication'],
  ['request', 'Request'],
  ['response', 'Response'],
  ['fields', 'Response fields'],
  ['errors', 'Errors'],
  ['examples', 'Code examples'],
  ['best-practices', 'Best practices'],
  ['faq', 'FAQ'],
]

function CodeBlock({ label, code }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked: the code can still be selected by hand
    }
  }
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <button type="button" onClick={copy} className="text-xs font-semibold text-slate-300 hover:text-white">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function DocSection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className={cn(h2Section, 'text-xl sm:text-2xl lg:text-[1.625rem]')}>{title}</h2>
      {children}
    </section>
  )
}

function Table({ head, rows, mono = 0 }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td key={i} className={cn(td, i < mono && 'whitespace-nowrap font-mono text-[13px] text-slate-900')}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function VehicleApiDocs() {
  const [tab, setTab] = useState(0)

  return (
    <>
      <PageHero
        title="RTO Sarthi Vehicle API Documentation — Endpoint, GET Request and JSON Response"
      >
        <Button href="/contact" variant="primary" size="lg">Get API Key</Button>
        <Button href="#quick-start" variant="ghost" size="lg">Quick Start</Button>
      </PageHero>

      <div className={section}>
        <div className={cn(container, 'lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10')}>
          <nav aria-label="On this page" className="mb-8 lg:mb-0">
            <div className="lg:sticky lg:top-24">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">On this page</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm lg:block lg:space-y-1.5">
                {toc.map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="text-slate-600 hover:text-brand-800">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="min-w-0 space-y-12">
            <DocSection id="quick-start" title="Quick start">
              <p className={bodyMuted}>
                The RTO Sarthi vehicle API returns the RC details of any Indian vehicle number as JSON. One
                endpoint, one header, one vehicle number per call. Pricing starts at {LOOKUP_PRICE} per successful
                call, and calls that return no vehicle details are not counted.
              </p>
              <ol className={cn(bodyMuted, 'list-decimal space-y-1 pl-5')}>
                <li><Link to="/contact" className={linkClass}>Contact us</Link> for your API key and choose how many calls you need.</li>
                <li>Send a GET request with the vehicle number and your key in the <code className={inlineCode}>x-api-key</code> header.</li>
                <li>Read the vehicle details from <code className={inlineCode}>data</code> and your calls left from <code className={inlineCode}>usage.remaining</code>.</li>
              </ol>
              <CodeBlock
                label="Your first call"
                code={`curl -H "x-api-key: YOUR_API_KEY" "${API_ENDPOINT}?vno=${DEMO_VEHICLE_NO}"`}
              />
            </DocSection>

            <DocSection id="authentication" title="Authentication">
              <p className={bodyMuted}>
                Every request needs your API key in the <code className={inlineCode}>x-api-key</code> header. Each
                key has its own call limit, bought in advance.
              </p>
              <CodeBlock label="Header" code="x-api-key: YOUR_API_KEY" />
              <div className={cn(glassCard, 'border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 hover:border-amber-200')}>
                Keep your key secret. Call the API from your server, not from browser JavaScript or a mobile app,
                where anyone could copy the key and use your calls. If a key leaks, contact us and we will replace it.
              </div>
            </DocSection>

            <DocSection id="request" title="Request: get vehicle details by vehicle number">
              <CodeBlock label="GET request" code={`GET ${API_ENDPOINT}?vno=${DEMO_VEHICLE_NO}\nx-api-key: YOUR_API_KEY`} />
              <Table
                head={['Parameter', 'Where', 'Required', 'Description']}
                mono={1}
                rows={[
                  ['vno', 'Query (GET) or JSON body (POST)', 'Yes', `Indian vehicle number, e.g. ${DEMO_VEHICLE_NO} or 23BH4512AB. Spaces and dashes are removed and letters made upper case.`],
                  ['x-api-key', 'Header', 'Yes', 'Your API key.'],
                ]}
              />
              <p className={bodyMuted}>
                <code className={inlineCode}>POST</code> to the same URL with a JSON body{' '}
                <code className={inlineCode}>{`{"vno": "${DEMO_VEHICLE_NO}"}`}</code> also works. See the{' '}
                <a href="#examples" className={linkClass}>code examples</a>.
              </p>
            </DocSection>

            <DocSection id="response" title="Response: vehicle details as JSON">
              <p className={bodyMuted}>
                A successful call returns HTTP 200 with <code className={inlineCode}>success: true</code>, the cleaned
                vehicle number, the vehicle details in <code className={inlineCode}>data</code>, and your call usage.
              </p>
              <CodeBlock label={`200 OK · ${DEMO_VEHICLE_NO}`} code={successResponse} />
              <p className="text-sm text-slate-600">
                Sample data. Fields are returned wherever they are available on the vehicle record; a field may be
                missing or <code className={inlineCode}>NA</code> for some vehicles.
              </p>
              <Table
                head={['Usage field', 'Description']}
                mono={1}
                rows={[
                  ['usage.limit', 'Total calls bought on your key'],
                  ['usage.used', 'Calls used so far (successful calls only)'],
                  ['usage.remaining', 'Calls left. Recharge before it reaches 0'],
                ]}
              />
            </DocSection>

            <DocSection id="fields" title="Response fields in data">
              <Table head={['Field', 'Description']} mono={1} rows={fields} />
            </DocSection>

            <DocSection id="errors" title="Errors and HTTP status codes">
              <p className={bodyMuted}>
                On an error, <code className={inlineCode}>success</code> is <code className={inlineCode}>false</code>{' '}
                and <code className={inlineCode}>message</code> says what went wrong. Only HTTP 200 uses up a call.
              </p>
              <Table head={['Status', 'Meaning', 'Counted']} mono={1} rows={errors} />
              <CodeBlock label="403 · limit used up" code={errorExample} />
            </DocSection>

            <DocSection id="examples" title="Code examples">
              <div className="flex flex-wrap gap-2" role="tablist">
                {examples.map((e, i) => (
                  <button
                    key={e.label}
                    type="button"
                    role="tab"
                    aria-selected={tab === i}
                    onClick={() => setTab(i)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm font-semibold',
                      tab === i ? 'border-brand-800 bg-brand-800 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300',
                    )}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
              {examples.map((e, i) => (
                <div key={e.label} role="tabpanel" hidden={tab !== i}>
                  <CodeBlock label={e.label} code={e.code} />
                </div>
              ))}
            </DocSection>

            <DocSection id="best-practices" title="Best practices">
              <ul className={cn(bodyMuted, 'list-disc space-y-1.5 pl-5')}>
                <li>Store the key in an environment variable on your server, never in front-end code.</li>
                <li>Set a timeout of about 30 seconds. On a 502, wait a few seconds and try once more.</li>
                <li>Save the response in your database if you need the same vehicle again, instead of calling twice.</li>
                <li>Watch <code className={inlineCode}>usage.remaining</code> and recharge before it runs out, so your users never see a 403.</li>
                <li>Use owner details only for genuine work such as insurance, finance or verification, as Indian data protection law requires.</li>
              </ul>
            </DocSection>

            <DocSection id="faq" title="FAQ">
              <div className="space-y-3">
                {apiDocsFaqs.map((f) => (
                  <details key={f.q} className={cn(glassCard, 'group p-5')}>
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                      <h3 className="font-display text-base font-semibold text-slate-900 sm:text-lg">{f.q}</h3>
                      <span className="text-brand-700 transition-transform group-open:rotate-45" aria-hidden>+</span>
                    </summary>
                    <p className={cn(bodyMuted, 'mt-2')}>{f.a}</p>
                  </details>
                ))}
              </div>
            </DocSection>

            <div className={cn(glassCard, 'p-6 text-center')}>
              <p className="font-display text-lg font-semibold text-slate-900">Ready to integrate?</p>
              <p className={cn(bodyMuted, 'mt-1')}>
                Get your API key from {LOOKUP_PRICE} per call. See what the API can do on the{' '}
                <Link to="/vehicle-information-api" className={linkClass}>vehicle information API</Link>,{' '}
                <Link to="/vehicle-details-api" className={linkClass}>vehicle details API</Link> and{' '}
                <Link to="/vahan-api" className={linkClass}>Vahan API</Link> pages.
              </p>
              <Button href="/contact" variant="primary" size="lg" className="mt-4">Get API Key</Button>
            </div>
            <p className="text-xs text-slate-500">
              RTO Sarthi is an independent private software company. It is not the Vahan or Parivahan portal and is not
              affiliated with the Ministry of Road Transport and Highways or NIC.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
