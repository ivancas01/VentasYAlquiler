export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0)
}

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  // Handle ISO strings by taking only the date part to avoid timezone shifts
  const date = new Date(dateString.includes('T') ? dateString.split('T')[0] + 'T12:00:00' : dateString + 'T12:00:00')
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
