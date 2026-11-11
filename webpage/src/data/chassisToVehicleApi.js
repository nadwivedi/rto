export const CHASSIS_TO_VEHICLE_API_PATH = '/chassis-number-to-vehicle-api'

export const chassisToVehicleApiFaqs = [
  {
    q: 'What is a chassis number to vehicle API?',
    a: 'A chassis number to vehicle API takes a vehicle’s chassis number (VIN) and returns the vehicle registration number it is registered under, with the vehicle details on its registration record. The RTO Sarthi API returns the registration number with maker, model, engine number, registration date, registering RTO and status as JSON.',
  },
  {
    q: 'How do I find the vehicle number from a chassis number?',
    a: 'Send the full chassis number to the RTO Sarthi API with your private API key. The response gives REGN_NO (the vehicle registration number) with the rest of the vehicle record, wherever it is available.',
  },
  {
    q: 'Is the chassis number the same as the VIN?',
    a: 'In India the chassis number on the RC is the vehicle’s VIN (vehicle identification number), usually 17 characters. It is stamped on the vehicle body and printed on the RC, so it can be read even when the number plate is missing.',
  },
  {
    q: 'Why would I need the vehicle number from a chassis number?',
    a: 'To identify a vehicle whose number plate is missing, damaged or fake, to trace repossessed, seized or recovered vehicles, to check an older or re-registered vehicle before purchase or loan, to match insurance claims and spare-part orders, and to confirm that a chassis is not already registered under another number.',
  },
  {
    q: 'Can I check if a chassis number is already registered?',
    a: 'Yes. When the chassis number is on a registration record, the API returns the vehicle number it is registered under. If no record comes back, the chassis may not be registered yet or the number may be wrong.',
  },
  {
    q: 'Can I also get the chassis number from a vehicle number?',
    a: 'Yes. The RC to chassis number API does the reverse: send the vehicle number and get the chassis and engine number.',
  },
  {
    q: 'What does it cost?',
    a: 'Pricing for chassis number searches is shared on request, with lower rates for higher volumes. You buy a prepaid search limit, there is no monthly fee, and searches where no vehicle is found are not counted.',
  },
  {
    q: 'Does it work for vehicles from all states?',
    a: 'Yes. You can search chassis numbers of vehicles registered in any state of India, including cars, two-wheelers and commercial vehicles.',
  },
  {
    q: 'Is RTO Sarthi a government API?',
    a: 'No. RTO Sarthi is an independent private software company from Raipur. It is not the Vahan or Parivahan portal and is not part of the Ministry of Road Transport and Highways or NIC.',
  },
]
