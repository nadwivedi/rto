// Vehicle info sources (backend utils/vehicleInfoProvider PROVIDERS): ApiKey.provider and User.rcProvider
export const PROVIDER_OPTIONS = [
  { value: 'api1', label: 'API 1 – Nikhil API', short: 'Nikhil API', tag: 'bg-indigo-50 text-indigo-700 border-indigo-200', button: 'hover:bg-indigo-100' },
  { value: 'api2', label: 'API 2', short: 'API 2', tag: 'bg-amber-50 text-amber-700 border-amber-200', button: 'hover:bg-amber-100' },
  { value: 'api3', label: 'API 3 – Parzival API', short: 'Parzival API', tag: 'bg-emerald-50 text-emerald-700 border-emerald-200', button: 'hover:bg-emerald-100' },
  // Transport (commercial) vehicles only; no owner name, chassis, engine or mobile
  { value: 'api4', label: 'API 4 – PeriOne API (transport only)', short: 'PeriOne API', tag: 'bg-sky-50 text-sky-700 border-sky-200', button: 'hover:bg-sky-100' },
  // Both at once: API 2's full record with API 4's latest insurance / PUC / tax / fitness (API 4 has transport vehicles only)
  { value: 'api24', label: 'API 2 + API 4 – details + latest status', short: 'API 2 + 4', tag: 'bg-violet-50 text-violet-700 border-violet-200', button: 'hover:bg-violet-100' },
  // Both at once: everything from API 3, only the mobile number from API 2
  { value: 'api32', label: 'API 3 + API 2 – API 3 details + API 2 mobile', short: 'API 3 + 2', tag: 'bg-teal-50 text-teal-700 border-teal-200', button: 'hover:bg-teal-100' }
]

// `fallback` is the source used when none is saved: API 1 for keys, API 2 for users
export const providerOption = (value, fallback = 'api1') =>
  PROVIDER_OPTIONS.find((o) => o.value === value) || PROVIDER_OPTIONS.find((o) => o.value === fallback)

export const providerLabel = (value) => providerOption(value).label

// 'rtosarthi_api3' (ApiKeyCall.source) -> the API 3 option
export const sourceOption = (source) => providerOption(String(source || '').replace(/^rtosarthi_/, ''))
