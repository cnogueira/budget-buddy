"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function formatDisplay(from: Date, to: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  return `${fmt(from)} – ${fmt(to)}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function today(): Date {
  return startOfDay(new Date());
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Mon start
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff));
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31);
}

const PRESETS = [
  {
    label: "This week",
    range: (): DateRange => ({ from: startOfWeek(today()), to: endOfWeek(today()) }),
  },
  {
    label: "Last week",
    range: (): DateRange => {
      const prev = new Date(today().getFullYear(), today().getMonth(), today().getDate() - 7);
      return { from: startOfWeek(prev), to: endOfWeek(prev) };
    },
  },
  {
    label: "This month",
    range: (): DateRange => ({ from: startOfMonth(today()), to: endOfMonth(today()) }),
  },
  {
    label: "Last month",
    range: (): DateRange => {
      const prev = new Date(today().getFullYear(), today().getMonth() - 1, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    },
  },
  {
    label: "This year",
    range: (): DateRange => ({ from: startOfYear(today()), to: endOfYear(today()) }),
  },
  {
    label: "Last year",
    range: (): DateRange => {
      const prev = new Date(today().getFullYear() - 1, 0, 1);
      return { from: startOfYear(prev), to: endOfYear(prev) };
    },
  },
  {
    label: "All history",
    range: (): DateRange => ({ from: new Date(2000, 0, 1), to: today() }),
  },
];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isInRange(d: Date, from: Date, to: Date): boolean {
  return d >= from && d <= to;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Mon=0 ... Sun=6
}

interface CalendarGridProps {
  year: number;
  month: number;
  hoverDate: Date | null;
  pendingFrom: Date | null;
  committed: DateRange;
  onDayClick: (d: Date) => void;
  onDayHover: (d: Date) => void;
}

function CalendarGrid({
  year,
  month,
  hoverDate,
  pendingFrom,
  committed,
  onDayClick,
  onDayHover,
}: CalendarGridProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  const previewFrom = pendingFrom
    ? pendingFrom < (hoverDate ?? pendingFrom)
      ? pendingFrom
      : hoverDate ?? pendingFrom
    : committed.from;
  const previewTo = pendingFrom
    ? pendingFrom < (hoverDate ?? pendingFrom)
      ? hoverDate ?? pendingFrom
      : pendingFrom
    : committed.to;

  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="w-64">
      <div className="grid grid-cols-7 mb-1">
        {dayLabels.map((l, i) => (
          <div key={i} className="text-center text-xs font-medium text-zinc-400 py-1">
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const isStart = isSameDay(d, previewFrom);
          const isEnd = isSameDay(d, previewTo);
          const inRange = isInRange(d, previewFrom, previewTo);
          const isToday = isSameDay(d, today());

          let cellCls = "relative flex items-center justify-center h-8 cursor-pointer text-sm select-none ";
          let innerCls = "w-7 h-7 flex items-center justify-center rounded-full z-10 ";

          if (isStart || isEnd) {
            innerCls += "bg-blue-600 text-white font-semibold ";
          } else if (inRange) {
            innerCls += "text-blue-800 dark:text-blue-200 ";
          } else if (isToday) {
            innerCls += "border border-green-500 text-green-600 dark:text-green-400 ";
          } else {
            innerCls += "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 ";
          }

          if (inRange && !isStart) {
            cellCls += "bg-blue-100 dark:bg-blue-900/30 ";
          }

          const col = (i % 7) + 1;
          if (isStart && !isEnd) {
            cellCls += "rounded-l-full ";
          }
          if (isEnd && !isStart) {
            cellCls += "rounded-r-full ";
          }
          if (isStart && isEnd) {
            cellCls += "rounded-full ";
          }
          // Edge rounding for range
          if (inRange && !isStart && !isEnd) {
            if (col === 1) cellCls += "rounded-l-full ";
            if (col === 7) cellCls += "rounded-r-full ";
          }

          return (
            <div
              key={i}
              className={cellCls}
              onClick={() => onDayClick(d)}
              onMouseEnter={() => onDayHover(d)}
            >
              <span className={innerCls}>{d.getDate()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [leftYear, setLeftYear] = useState(value.from.getFullYear());
  const [leftMonth, setLeftMonth] = useState(value.from.getMonth());
  const [pendingFrom, setPendingFrom] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [draft, setDraft] = useState<DateRange>(value);
  const ref = useRef<HTMLDivElement>(null);

  // Right calendar is always leftMonth+1
  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setPendingFrom(null);
        setHoverDate(null);
        setDraft(value);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [value]);

  function handleDayClick(d: Date) {
    if (!pendingFrom) {
      setPendingFrom(d);
      setDraft({ from: d, to: d });
    } else {
      const from = pendingFrom <= d ? pendingFrom : d;
      const to = pendingFrom <= d ? d : pendingFrom;
      setDraft({ from, to });
      setPendingFrom(null);
    }
  }

  function handlePreset(preset: typeof PRESETS[number]) {
    const range = preset.range();
    setDraft(range);
    setPendingFrom(null);
    setLeftYear(range.from.getFullYear());
    setLeftMonth(range.from.getMonth());
  }

  function handleSelect() {
    onChange(draft);
    setOpen(false);
    setPendingFrom(null);
    setHoverDate(null);
  }

  function prevLeft() {
    if (leftMonth === 0) { setLeftMonth(11); setLeftYear(y => y - 1); }
    else setLeftMonth(m => m - 1);
  }
  function nextLeft() {
    if (leftMonth === 11) { setLeftMonth(0); setLeftYear(y => y + 1); }
    else setLeftMonth(m => m + 1);
  }

  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen(o => !o);
          setDraft(value);
          setLeftYear(value.from.getFullYear());
          setLeftMonth(value.from.getMonth());
          setPendingFrom(null);
        }}
        className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        <span>{formatDisplay(value.from, value.to)}</span>
        <Calendar className="h-4 w-4 text-zinc-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex">
            {/* Calendars */}
            <div className="p-4">
              <div className="flex gap-8">
                {/* Left calendar */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={prevLeft} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded">
                      <ChevronLeft className="h-4 w-4 text-zinc-500" />
                    </button>
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                      {MONTH_NAMES[leftMonth]} {leftYear}
                    </span>
                    <div className="w-6" />
                  </div>
                  <CalendarGrid
                    year={leftYear}
                    month={leftMonth}
                    hoverDate={hoverDate}
                    pendingFrom={pendingFrom}
                    committed={draft}
                    onDayClick={handleDayClick}
                    onDayHover={setHoverDate}
                  />
                </div>

                {/* Right calendar */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-6" />
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                      {MONTH_NAMES[rightMonth]} {rightYear}
                    </span>
                    <button onClick={nextLeft} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded">
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    </button>
                  </div>
                  <CalendarGrid
                    year={rightYear}
                    month={rightMonth}
                    hoverDate={hoverDate}
                    pendingFrom={pendingFrom}
                    committed={draft}
                    onDayClick={handleDayClick}
                    onDayHover={setHoverDate}
                  />
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-col justify-between border-l border-zinc-100 dark:border-zinc-700 p-4 w-36">
              <div className="flex flex-col gap-1">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePreset(p)}
                    className="text-left text-sm px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSelect}
                disabled={!!pendingFrom}
                className="mt-4 w-full rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-600 dark:hover:bg-zinc-500"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
