export const getStatusColor = (status) => {
  if (!status) return 'bg-gray-100 text-gray-700';
  switch (status) {
    case 'expired':
      return 'bg-red-100 text-red-700';
    case 'expiring_soon':
      return 'bg-orange-100 text-orange-700';
    case 'active':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export const getStatusText = (status) => {
  if (!status) return 'Unknown';
  switch (status) {
    case 'expired':
      return 'Expired';
    case 'expiring_soon':
      return 'Expiring Soon';
    case 'active':
      return 'Active';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export const getEffectiveStatus = (insurance) => {
  if (!insurance) return 'unknown'
  const mainStatus = insurance.status

  const thirdPartyTo = insurance.thirdPartyValidTo
  if (!thirdPartyTo || thirdPartyTo.trim() === '') return mainStatus

  const parts = thirdPartyTo.split('-')
  if (parts.length !== 3) return mainStatus

  const thirdPartyDate = new Date(+parts[2], +parts[1] - 1, +parts[0])
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diffDays = Math.ceil((thirdPartyDate - today) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'expired'
  if (diffDays <= 30) return 'expiring_soon'

  return mainStatus
}
