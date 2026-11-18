// Vehicle info sources (backend utils/vehicleInfoProvider PROVIDERS): ApiKey.provider and User.rcProvider
export const PROVIDER_OPTIONS = [
  { value: 'api5', label: 'API 5', short: 'API 5', tag: 'bg-indigo-50 text-indigo-700 border-indigo-200', button: 'hover:bg-indigo-100' },
  { value: 'api2', label: 'API 2', short: 'API 2', tag: 'bg-amber-50 text-amber-700 border-amber-200', button: 'hover:bg-amber-100' },
  { value: 'api3', label: 'API 3 – Parzival API', short: 'Parzival API', tag: 'bg-emerald-50 text-emerald-700 border-emerald-200', button: 'hover:bg-emerald-100' },
  // Transport (commercial) vehicles only; no owner name, chassis, engine or mobile
  { value: 'api4', label: 'API 4 – PeriOne API (transport only)', short: 'PeriOne API', tag: 'bg-sky-50 text-sky-700 border-sky-200', button: 'hover:bg-sky-100' },
  // Both at once: API 2's full record with API 4's latest insurance / PUC / tax / fitness (API 4 has transport vehicles only)
  { value: 'api24', label: 'API 2 + API 4 – details + latest status', short: 'API 2 + 4', tag: 'bg-violet-50 text-violet-700 border-violet-200', button: 'hover:bg-violet-100' },
  // Both at once: everything from API 3, only the mobile number from API 2
  { value: 'api32', label: 'API 3 + API 2 – API 3 details + API 2 mobile', short: 'API 3 + 2', tag: 'bg-teal-50 text-teal-700 border-teal-200', button: 'hover:bg-teal-100' },
  // Basic details only (owner, address, chassis, mobile, PUC, policy no); no insurance / fitness / tax dates
  { value: 'api7', label: 'API 7 – Telegram basic details', short: 'API 7', tag: 'bg-rose-50 text-rose-700 border-rose-200', button: 'hover:bg-rose-100' },
  // PeriOne first; API 7 is called only when PeriOne has the vehicle (transport vehicles only)
  { value: 'api47', label: 'PeriOne + API 7 (transport advanced)', short: 'PeriOne + API 7 (transport advanced)', tag: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', button: 'hover:bg-fuchsia-100' },
  // Satmat RC Verification Plus: full record (owner, mobile, chassis, engine, insurance, PUC, tax, permit)
  { value: 'api8', label: 'API 8 – Satmat API', short: 'API 8 (Satmat)', tag: 'bg-lime-50 text-lime-700 border-lime-200', button: 'hover:bg-lime-100' }
]

// `fallback` is the source used when none is saved: API 5 for keys, API 2 for users
export const providerOption = (value, fallback = 'api5') =>
  PROVIDER_OPTIONS.find((o) => o.value === value) || PROVIDER_OPTIONS.find((o) => o.value === fallback)

export const providerLabel = (value) => providerOption(value).label

// 'rtosarthi_api3' (ApiKeyCall.source) -> the API 3 option
export const sourceOption = (source) => providerOption(String(source || '').replace(/^rtosarthi_/, ''))
