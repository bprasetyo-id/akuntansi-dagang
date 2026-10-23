/**
 * Helper format mata uang Rupiah Indonesia (IDR)
 * Contoh: 12500000 -> "Rp 12.500.000"
 */
export function formatRupiah(amount, withPrefix = true) {
  const num = Number(amount) || 0;
  const formatted = Math.abs(num).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  if (num < 0) {
    return withPrefix ? `(Rp ${formatted})` : `(${formatted})`;
  }
  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Format tanggal Indonesia
 * Contoh: "2026-10-22" -> "22 Okt 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}
