// Vehicle info source an API key's calls go to (backend ApiKey.provider)
export const PROVIDER_OPTIONS = [
  { value: 'api1', label: 'API 1 (informationapi.shop)' },
  { value: 'api2', label: 'API 2' }
]

export const providerLabel = (value) => (PROVIDER_OPTIONS.find((o) => o.value === (value || 'api1')) || PROVIDER_OPTIONS[0]).label
