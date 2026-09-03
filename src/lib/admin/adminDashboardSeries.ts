import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  parseISO,
} from "date-fns";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function parseIsoDate(raw: string | undefined | null): Date | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const d = parseISO(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function endOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Cumulative count of events through end of each month in `year`. */
export function cumulativePropertiesByYearMonth(
  dates: Date[],
  year: number,
): { label: string; value: number }[] {
  const inYear = dates.filter((d) => d.getFullYear() === year);
  const sorted = [...inYear].sort((a, b) => a.getTime() - b.getTime());
  const out: { label: string; value: number }[] = [];
  for (let m = 0; m < 12; m++) {
    const end = endOfMonth(new Date(year, m, 1));
    const count = sorted.filter((d) => d.getTime() <= end.getTime()).length;
    out.push({ label: MONTHS_SHORT[m], value: count });
  }
  return out;
}

/** Cumulative count of properties through each day of the current month. */
export function cumulativePropertiesByDayInCurrentMonth(
  dates: Date[],
  now: Date = new Date(),
): { label: string; value: number }[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const days = eachDayOfInterval({ start, end });
  const inMonth = dates
    .filter((d) => d.getFullYear() === y && d.getMonth() === m)
    .sort((a, b) => a.getTime() - b.getTime());

  return days.map((day) => {
    const boundary = endOfLocalDay(day);
    const count = inMonth.filter((d) => d.getTime() <= boundary.getTime()).length;
    return { label: format(day, "d"), value: count };
  });
}

/** Sum transaction amounts per month in a calendar year. */
export function monthlyTransactionVolumeByYear(
  entries: { date: Date; amount: number }[],
  year: number,
): { label: string; value: number }[] {
  const out: { label: string; value: number }[] = [];
  for (let mo = 0; mo < 12; mo++) {
    let sum = 0;
    for (const e of entries) {
      if (e.date.getFullYear() === year && e.date.getMonth() === mo) {
        sum += e.amount;
      }
    }
    out.push({ label: MONTHS_SHORT[mo], value: sum });
  }
  return out;
}

/** Sum amounts per day for the current calendar month. */
export function dailyTransactionVolumeCurrentMonth(
  entries: { date: Date; amount: number }[],
  now: Date = new Date(),
): { label: string; value: number }[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  const days = eachDayOfInterval({ start, end });
  const monthEntries = entries.filter(
    (e) => e.date.getFullYear() === y && e.date.getMonth() === m,
  );

  return days.map((day) => {
    const dnum = day.getDate();
    let sum = 0;
    for (const e of monthEntries) {
      if (
        e.date.getFullYear() === y &&
        e.date.getMonth() === m &&
        e.date.getDate() === dnum
      ) {
        sum += e.amount;
      }
    }
    return { label: format(day, "d"), value: sum };
  });
}

/** Cumulative user registrations through each day of the ISO week (Mon–Sun). */
export function cumulativeUsersByWeekDays(
  dates: Date[],
  now: Date = new Date(),
): { label: string; value: number }[] {
  const wkStart = startOfWeek(now, { weekStartsOn: 1 });
  const wkEnd = endOfWeek(now, { weekStartsOn: 1 });
  const inWeek = dates.filter(
    (d) => d.getTime() >= wkStart.getTime() && d.getTime() <= wkEnd.getTime(),
  );
  const sorted = [...inWeek].sort((a, b) => a.getTime() - b.getTime());
  const days = eachDayOfInterval({ start: wkStart, end: wkEnd });

  return days.map((day) => {
    const boundary = endOfLocalDay(day);
    const count = sorted.filter((d) => d.getTime() <= boundary.getTime())
      .length;
    return { label: format(day, "EEE"), value: count };
  });
}

/** Cumulative users through each month of `year`. */
export function cumulativeUsersByYearMonth(
  dates: Date[],
  year: number,
): { label: string; value: number }[] {
  const inYear = dates.filter((d) => d.getFullYear() === year);
  const sorted = [...inYear].sort((a, b) => a.getTime() - b.getTime());
  const out: { label: string; value: number }[] = [];
  for (let mo = 0; mo < 12; mo++) {
    const end = endOfMonth(new Date(year, mo, 1));
    const count = sorted.filter((d) => d.getTime() <= end.getTime()).length;
    out.push({ label: MONTHS_SHORT[mo], value: count });
  }
  return out;
}

export type CategoryAggregate = { name: string; count: number };

/** Count listings as service apartments vs long-term rentals. */
export function aggregatePropertyCategories(
  rows: { isOpenForServiceApartment?: boolean }[],
): CategoryAggregate[] {
  let service = 0;
  let rented = 0;
  for (const p of rows) {
    if (p.isOpenForServiceApartment === true) service += 1;
    else rented += 1;
  }
  return [
    { name: "Service apartments", count: service },
    { name: "Rented apartments", count: rented },
  ];
}
