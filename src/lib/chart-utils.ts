export type Granularity = "days" | "weeks" | "months";

export function isoWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  const week = Math.ceil((dayOfYear + jan4.getDay() - 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function bucketKey(dateStr: string, granularity: Granularity): string {
  if (granularity === "months") return dateStr.slice(0, 7);
  if (granularity === "weeks") return isoWeek(dateStr);
  return dateStr;
}

export function bucketLabel(key: string, granularity: Granularity): string {
  if (granularity === "months") {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  if (granularity === "weeks") return key.replace("-W", " W");
  const d = new Date(key + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
