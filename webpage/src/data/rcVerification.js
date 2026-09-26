import { LOOKUP_PRICE } from './vehicleInfo'

export const RC_VERIFICATION_PATH = '/rc-verification-software'

export const rcVerificationFaqs = [
  {
    q: 'What is RC verification?',
    a: 'RC verification means checking a vehicle’s registration certificate details against the current registration record: owner name, chassis number, engine number, registration validity, hypothecation (HP) and blacklist status. It confirms the RC is genuine and the details are correct.',
  },
  {
    q: 'How much does RC verification cost in RTO Sarthi?',
    a: `RC verification costs just ${LOOKUP_PRICE} per vehicle. The same search also gives road tax, fitness, PUC and insurance status and lets you download the RC and Vehicle Particulars PDF.`,
  },
  {
    q: 'Which is the cheapest RC verification software for RTO agents?',
    a: `RTO Sarthi offers RC verification at ${LOOKUP_PRICE} per vehicle, which is lower than many RC verification services that charge around ₹3 or more per check. It is also built into complete RTO agent software, not a separate tool.`,
  },
  {
    q: 'Why should RTO agents verify RC before transfer?',
    a: 'Before ownership transfer the agent should confirm that the seller is the registered owner, the chassis and engine numbers match, the vehicle is not blacklisted and whether hypothecation must be removed first. Verifying the RC avoids rejected applications and fraud.',
  },
  {
    q: 'How do I verify RC online by vehicle number?',
    a: 'Log in to RTO Sarthi, open Vehicle Details (RC Lookup), enter the vehicle number and search. Match the owner, chassis and engine number with the physical RC and check registration validity, HP and blacklist status.',
  },
  {
    q: 'What is bulk RC verification?',
    a: `Bulk RC verification lets you verify a list of vehicle numbers together instead of one by one. It is useful for dealers, financers, fleet owners and insurance agents who handle many vehicles. Each vehicle is charged at ${LOOKUP_PRICE}.`,
  },
  {
    q: 'Can insurance agents use RC verification?',
    a: 'Yes. Insurance agents and POSPs verify RC before issuing or renewing motor insurance to confirm the owner, registration date, vehicle model, fuel and cubic capacity, and to see the current insurance validity.',
  },
  {
    q: 'Can used car dealers and financers use RC verification?',
    a: 'Yes. Used car and bike dealers verify RC before buying a vehicle, and financers check ownership and existing hypothecation before giving a loan against a vehicle.',
  },
  {
    q: 'Does RC verification work for all states?',
    a: 'Yes. You can verify RC of vehicles registered in any Indian state or union territory.',
  },
  {
    q: 'Do I pay again to see a verified vehicle later?',
    a: 'No. Every verified vehicle is saved in your search history, and the RC and Particular PDFs can be downloaded again without another lookup.',
  },
]
