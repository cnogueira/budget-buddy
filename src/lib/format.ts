export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

// Compact date range label for chart subtitles:
//   Same month+year → "Apr 01–30"
//   Different months, same year → "Apr 01 – May 30"
//   Different years → "Apr 01, 2026 – May 30, 2027"
export function formatDateRange(from: string, to: string): string {
  const f = new Date(from + "T00:00:00");
  const t = new Date(to + "T00:00:00");
  const fMonth = f.toLocaleDateString("en-US", { month: "short" });
  const tMonth = t.toLocaleDateString("en-US", { month: "short" });
  const fDay = String(f.getDate()).padStart(2, "0");
  const tDay = String(t.getDate()).padStart(2, "0");
  const fYear = f.getFullYear();
  const tYear = t.getFullYear();

  if (fYear === tYear && f.getMonth() === t.getMonth()) {
    return `${fMonth} ${fDay}–${tDay}`;
  }
  if (fYear === tYear) {
    return `${fMonth} ${fDay} – ${tMonth} ${tDay}`;
  }
  return `${fMonth} ${fDay}, ${fYear} – ${tMonth} ${tDay}, ${tYear}`;
}
