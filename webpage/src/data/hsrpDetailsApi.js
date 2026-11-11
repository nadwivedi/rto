export const HSRP_DETAILS_API_PATH = '/vehicle-to-hsrp-details-api'

// Starting price per successful HSRP search (as sold in API Sales)
export const HSRP_PRICE = '₹25'

export const hsrpDetailsApiFaqs = [
  {
    q: 'What is a vehicle to HSRP details API?',
    a: `A vehicle to HSRP details API takes a vehicle registration number and returns the High Security Registration Plate (HSRP) details of that vehicle. The RTO Sarthi API returns the front and rear HSRP laser codes with maker, fuel, vehicle type and category, emission norms, registration date, chassis and engine number and state / RTO office code as JSON, from ${HSRP_PRICE} per successful search.`,
  },
  {
    q: 'How do I get HSRP details by vehicle number?',
    a: 'Send the vehicle number to the RTO Sarthi HSRP API with your private API key. The response has hsrpFrontLaserCode and hsrpRearLaserCode for the plates fitted on the vehicle, along with the vehicle details used for HSRP booking.',
  },
  {
    q: 'What is an HSRP laser code?',
    a: 'Every High Security Registration Plate has a unique laser-etched code (a permanent identification number) on it. The front and rear plates each have their own code. The laser code links the plate to the vehicle, so it is used to check that the plates on a vehicle are genuine and belong to it.',
  },
  {
    q: 'Can I check if HSRP is fitted on a vehicle?',
    a: 'Yes. When HSRP plates have been issued for the vehicle, the API returns their front and rear laser codes. If no laser codes come back, the vehicle may not have HSRP plates on record yet.',
  },
  {
    q: 'Why would I need HSRP details of a vehicle?',
    a: 'To verify that number plates are genuine before buying, financing or insuring a vehicle, to check HSRP before onboarding a vehicle on a fleet or rental platform, to help customers book HSRP or a replacement plate, and to match plate laser codes during inspection or recovery.',
  },
  {
    q: 'Does the API work for all states of India?',
    a: 'Yes. You can search vehicles registered in any state of India. The response also gives the state code and RTO office code of the vehicle.',
  },
  {
    q: 'What does it cost?',
    a: `Pricing starts at ${HSRP_PRICE} per HSRP search. You buy a prepaid search limit, there is no monthly fee, and searches where the vehicle is not found are not counted.`,
  },
  {
    q: 'Can I check HSRP details without writing code?',
    a: 'Yes. Use the HSRP Details search in the RTO Sarthi app: enter the vehicle number to see the front and rear laser codes with the vehicle details, and open your earlier HSRP searches again for free.',
  },
  {
    q: 'Is RTO Sarthi a government or HSRP manufacturer API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan, Parivahan or official HSRP booking portal, is not an HSRP plate manufacturer, and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
