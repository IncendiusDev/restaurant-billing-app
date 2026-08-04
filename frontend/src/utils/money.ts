export function money(value: string | number | undefined | null): string {
  const n = Number(value ?? 0)
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
