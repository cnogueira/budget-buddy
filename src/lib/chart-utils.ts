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

export function enumerateBuckets(from: string, to: string, granularity: Granularity): string[] {
  if (granularity === "months") {
    const [fy, fm] = from.slice(0, 7).split("-").map(Number);
    const toKey = to.slice(0, 7);
    const buckets: string[] = [];
    let y = fy, m = fm;
    while (true) {
      const key = `${y}-${String(m).padStart(2, "0")}`;
      if (key > toKey) break;
      buckets.push(key);
      m++;
      if (m > 12) { m = 1; y++; }
    }
    return buckets;
  }

  // For days and weeks, step day-by-day and deduplicate week keys
  const buckets: string[] = [];
  const seen = new Set<string>();
  const cursor = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (cursor <= end) {
    const key = bucketKey(cursor.toISOString().slice(0, 10), granularity);
    if (!seen.has(key)) {
      seen.add(key);
      buckets.push(key);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}
