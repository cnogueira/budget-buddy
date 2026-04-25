export function parseMonthParam(param?: string): Date {
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [year, month] = param.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function formatMonthParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatMonthHeading(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
