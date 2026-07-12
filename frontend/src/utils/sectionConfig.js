const sectionGroups = [
  {
    id: 'vahan',
    label: 'RTO Vahan',
    sections: [
      { key: 'vehicleRegistration', label: 'Vehicle Registration', path: '/vehicle-registration', icon: '🚚' },
      { key: 'insurance', label: 'Insurance', path: '/insurance', icon: '🛡️' },
      { key: 'fitness', label: 'Fitness', path: '/fitness', icon: '✅' },
      { key: 'tax', label: 'Road Tax', path: '/tax', icon: '💰' },
      { key: 'greenTax', label: 'Green Tax', path: '/green-tax', icon: '🌿' },
      { key: 'professionalTax', label: 'Professional Tax', path: '/professional-tax', icon: '📋' },
      { key: 'puc', label: 'PUC', path: '/puc', icon: '🌱' },
      { key: 'gps', label: 'GPS', path: '/gps', icon: '📍' },
      { key: 'speedGovernor', label: 'Speed Governor', path: '/speed-governor', icon: '⚙️' },
      { key: 'dealerBill', label: 'Dealer Bill', path: '/dealer-bill', icon: '🧾' },
      { key: 'party', label: 'Party', path: '/party', icon: '👥' },
      { key: 'nationalPermit', label: 'National Permit', path: '/national-permit', icon: '🌍' },
      { key: 'statePermit', label: 'State Permit (CG)', path: '/state-permit', icon: '📜' },
      { key: 'busPermit', label: 'Bus Permit', path: '/bus-permit', icon: '🚌' },
      { key: 'temporaryPermit', label: 'Temporary Permit', path: '/temporary-permit', icon: '⏳' },
      { key: 'tempPermitOtherState', label: 'Temp Permit Other State', path: '/temporary-permit-other-state', icon: '🚛' }
    ]
  },
  {
    id: 'sarthi',
    label: 'RTO Sarthi',
    sections: [
      { key: 'drivingLicense', label: 'Driving License', path: '/driving', icon: '🚘' },
      { key: 'vehicleTransfer', label: 'Vehicle Transfer', path: '/vehicle-transfer', icon: '🔄' },
      { key: 'noc', label: 'NOC', path: '/noc', icon: '📃' },
      { key: 'registrationRenewal', label: 'Registration Renewal', path: '/registration-renewal', icon: '🔁' },
      { key: 'hpaHpt', label: 'HPA/HPT', path: '/hpa-hpt', icon: '📝' }
    ]
  },
  {
    id: 'other',
    label: 'Other',
    sections: [
      { key: 'kyc', label: 'KYC Zone', path: '/kyc', icon: '🛡️' },
      { key: 'javak', label: 'Javak (Notes)', path: '/javak', icon: '📋' },
      { key: 'cashflow', label: 'Cashflow Reports', path: '/cashflow-report', icon: '💰' }
    ]
  }
]

export const sectionKeyToRoute = {
  vehicleRegistration: '/vehicle-registration',
  insurance: '/insurance',
  fitness: '/fitness',
  tax: '/tax',
  greenTax: '/green-tax',
  professionalTax: '/professional-tax',
  puc: '/puc',
  gps: '/gps',
  speedGovernor: '/speed-governor',
  dealerBill: '/dealer-bill',
  party: '/party',
  nationalPermit: '/national-permit',
  statePermit: '/state-permit',
  busPermit: '/bus-permit',
  temporaryPermit: '/temporary-permit',
  tempPermitOtherState: '/temporary-permit-other-state',
  drivingLicense: '/driving',
  vehicleTransfer: '/vehicle-transfer',
  noc: '/noc',
  registrationRenewal: '/registration-renewal',
  hpaHpt: '/hpa-hpt',
  kyc: '/kyc',
  javak: '/javak',
  cashflow: '/cashflow-report'
}

export const routeToSectionKey = Object.fromEntries(
  Object.entries(sectionKeyToRoute).map(([k, v]) => [v, k])
)

export const allSectionKeys = sectionGroups.flatMap(g => g.sections.map(s => s.key))

export const defaultSections = Object.fromEntries(allSectionKeys.map(k => [k, true]))

export default sectionGroups
