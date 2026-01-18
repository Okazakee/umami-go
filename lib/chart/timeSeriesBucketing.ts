export type RangeType = '24h' | '7d' | '30d' | '90d' | 'all' | 'custom';
export type AggregationType = 'sum' | 'avg' | 'min' | 'max';

export type TimeBucket = {
  startMs: number;
  endMs: number;
  midMs: number;
};

export type IntervalPlan = {
  // Axis tick boundaries (always 7 for our chart labels)
  ticks: number[];
  // Aggregation buckets (usually 7; for 24h it's 6 buckets between 7 ticks)
  buckets: TimeBucket[];
  startMs: number;
  endMs: number;
};

export type BucketSizeSpec = {
  tickCount: number;
  bucketCount: number;
  bucketMs?: number;
  granularity: 'hour' | 'day' | 'month' | 'year';
};

function toMs(d: Date | number): number {
  return typeof d === 'number' ? d : d.getTime();
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function startOfHour(ts: number): number {
  const d = new Date(ts);
  d.setMinutes(0, 0, 0);
  return d.getTime();
}

function ceilToHour(ts: number): number {
  const floored = startOfHour(ts);
  return floored === ts ? ts : floored + 60 * 60 * 1000;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function addDays(ts: number, days: number): number {
  const d = new Date(ts);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

function startOfTomorrow(ts: number): number {
  return addDays(startOfDay(ts), 1);
}

function addMonths(ts: number, months: number): number {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + months, 1);
  return d.getTime();
}

function startOfMonth(ts: number): number {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isStartOfMonthBoundary(ts: number): boolean {
  const d = new Date(ts);
  return (
    d.getDate() === 1 &&
    d.getHours() === 0 &&
    d.getMinutes() === 0 &&
    d.getSeconds() === 0 &&
    d.getMilliseconds() === 0
  );
}

function isEndOfMonthBoundary(ts: number): boolean {
  const d = new Date(ts);
  if (
    d.getHours() !== 23 ||
    d.getMinutes() !== 59 ||
    d.getSeconds() !== 59 ||
    d.getMilliseconds() !== 999
  ) {
    return false;
  }
  const nextDay = new Date(ts);
  nextDay.setMilliseconds(0);
  nextDay.setSeconds(0);
  nextDay.setMinutes(0);
  nextDay.setHours(0);
  nextDay.setDate(nextDay.getDate() + 1);
  // End-of-month means the next day is the 1st of the next month.
  return nextDay.getDate() === 1;
}

function monthsBetweenInclusive(startMs: number, endMs: number): number {
  const a = new Date(startMs);
  const b = new Date(endMs);
  const am = a.getFullYear() * 12 + a.getMonth();
  const bm = b.getFullYear() * 12 + b.getMonth();
  return Math.max(1, bm - am + 1);
}

function splitIntegerSpan(total: number, parts: number): number[] {
  // Deterministic distribution: earlier buckets get the remainder (+1).
  const base = Math.floor(total / parts);
  const rem = total % parts;
  return Array.from({ length: parts }, (_, i) => base + (i < rem ? 1 : 0));
}

export function getBucketSize(
  rangeType: RangeType,
  customRange?: { startMs: number; endMs: number }
): BucketSizeSpec {
  if (rangeType === '24h') {
    return { tickCount: 7, bucketCount: 6, bucketMs: 4 * 60 * 60 * 1000, granularity: 'hour' };
  }
  if (rangeType === '7d') {
    return { tickCount: 7, bucketCount: 7, bucketMs: 24 * 60 * 60 * 1000, granularity: 'day' };
  }
  if (rangeType === '30d') {
    return { tickCount: 7, bucketCount: 7, granularity: 'day' };
  }
  if (rangeType === '90d') {
    return { tickCount: 7, bucketCount: 7, granularity: 'day' };
  }
  if (rangeType === 'custom' && customRange) {
    const spanMs = Math.max(0, customRange.endMs - customRange.startMs);
    const dayMs = 24 * 60 * 60 * 1000;
    const spanDays = Math.ceil(spanMs / dayMs);
    // For very short custom ranges, day bucketing would create duplicates (spanDays < 7).
    // Use hour buckets so we can still display 7 points meaningfully.
    if (spanDays < 7) {
      return { tickCount: 7, bucketCount: 7, granularity: 'hour' };
    }

    // > 90d: prefer month-based labels/aggregation if it *meaningfully* matches the selected range:
    // only if the range is aligned to month boundaries (prevents counting partial months as full months).
    const monthCount = monthsBetweenInclusive(customRange.startMs, customRange.endMs);
    if (
      spanDays > 90 &&
      monthCount >= 7 &&
      isStartOfMonthBoundary(customRange.startMs) &&
      isEndOfMonthBoundary(customRange.endMs)
    ) {
      return { tickCount: 7, bucketCount: 7, granularity: 'month' };
    }

    return { tickCount: 7, bucketCount: 7, granularity: 'day' };
  }

  if (rangeType === 'all' && customRange) {
    // If the entire "all time" span is shorter than 7 months, month labels will repeat.
    // Prefer day labels in that case.
    const spanMs = Math.max(0, customRange.endMs - customRange.startMs);
    const dayMs = 24 * 60 * 60 * 1000;
    const spanDays = Math.ceil(spanMs / dayMs);
    if (spanDays < 7) return { tickCount: 7, bucketCount: 7, granularity: 'hour' };
    const monthCount = monthsBetweenInclusive(customRange.startMs, customRange.endMs);
    if (monthCount >= 7) return { tickCount: 7, bucketCount: 7, granularity: 'month' };
    return { tickCount: 7, bucketCount: 7, granularity: 'day' };
  }

  // all (default)
  return { tickCount: 7, bucketCount: 7, granularity: 'month' };
}

export function calculateIntervals(
  startDate: Date | number,
  endDate: Date | number,
  rangeType: RangeType
): IntervalPlan {
  const rawStart = toMs(startDate);
  const rawEnd = toMs(endDate);
  const now = Date.now();
  const endMs = clamp(rawEnd, 0, now);

  if (rangeType === '24h') {
    const step = 4 * 60 * 60 * 1000;
    // Rolling 24h, aligned to the next hour boundary (labels stay stable).
    // The last bucket is clamped to `endMs` so we don't show a future interval.
    const endTick = ceilToHour(endMs);
    const startTick = endTick - 24 * 60 * 60 * 1000;
    const ticks = Array.from({ length: 7 }, (_, i) => startTick + i * step);
    const buckets: TimeBucket[] = [];
    for (let i = 0; i < ticks.length - 1; i++) {
      const bStart = ticks[i];
      const bEnd = Math.min(ticks[i + 1], endMs);
      const midMs = bStart + (bEnd - bStart) / 2;
      buckets.push({ startMs: bStart, endMs: bEnd, midMs });
    }
    return { ticks, buckets, startMs: startTick, endMs };
  }

  if (rangeType === '7d') {
    // Calendar-day aligned buckets; last bucket is partial “today”.
    const endTick = startOfTomorrow(endMs);
    const startTick = addDays(endTick, -7);
    const ticks = Array.from({ length: 7 }, (_, i) => addDays(startTick, i));
    const buckets: TimeBucket[] = ticks.map((t) => {
      const bStart = t;
      const bEnd = Math.min(addDays(t, 1), endMs);
      return { startMs: bStart, endMs: bEnd, midMs: bStart + (bEnd - bStart) / 2 };
    });
    return { ticks, buckets, startMs: startTick, endMs };
  }

  if (rangeType === '30d' || rangeType === '90d') {
    const totalDays = rangeType === '30d' ? 30 : 90;
    const endTick = startOfTomorrow(endMs);
    const startTick = addDays(endTick, -totalDays);
    const daySpans = splitIntegerSpan(totalDays, 7);

    const ticks: number[] = [];
    const buckets: TimeBucket[] = [];
    let cursor = startTick;
    for (let i = 0; i < 7; i++) {
      ticks.push(cursor);
      const spanDays = daySpans[i] ?? 0;
      const bStart = cursor;
      const bEndRaw = addDays(bStart, spanDays);
      const bEnd = Math.min(bEndRaw, endMs);
      buckets.push({ startMs: bStart, endMs: bEnd, midMs: bStart + (bEnd - bStart) / 2 });
      cursor = bEndRaw;
    }
    return { ticks, buckets, startMs: startTick, endMs };
  }

  const customStart = Math.max(0, rawStart);
  const granularity = getBucketSize(rangeType, { startMs: customStart, endMs }).granularity;

  if (granularity === 'hour') {
    const startTick = startOfHour(customStart);
    const spanMs = Math.max(1, endMs - startTick);
    const ticks: number[] = [];
    const buckets: TimeBucket[] = [];

    for (let i = 0; i < 7; i++) {
      const bStart = startTick + Math.floor((spanMs * i) / 7);
      const bEndRaw = startTick + Math.floor((spanMs * (i + 1)) / 7);
      const bEnd = Math.min(i === 6 ? endMs : Math.max(bStart + 1, bEndRaw), endMs);
      ticks.push(bStart);
      buckets.push({ startMs: bStart, endMs: bEnd, midMs: bStart + (bEnd - bStart) / 2 });
    }

    return { ticks, buckets, startMs: startTick, endMs };
  }

  if (granularity === 'month') {
    // Align to month boundaries and group months into 7 buckets.
    const startTick = startOfMonth(customStart);
    const endTick = startOfMonth(endMs);
    const totalMonths = monthsBetweenInclusive(startTick, endTick);
    const monthSpans = splitIntegerSpan(totalMonths, 7);

    const ticks: number[] = [];
    const buckets: TimeBucket[] = [];
    let cursor = startTick;
    for (let i = 0; i < 7; i++) {
      ticks.push(cursor);
      const spanMonths = monthSpans[i] ?? 0;
      const bStart = cursor;
      const bEndRaw = addMonths(bStart, spanMonths);
      const bEnd = Math.min(bEndRaw, endMs);
      buckets.push({ startMs: bStart, endMs: bEnd, midMs: bStart + (bEnd - bStart) / 2 });
      cursor = bEndRaw;
    }
    return { ticks, buckets, startMs: startTick, endMs };
  }

  // Default: day-based even buckets over the span.
  const startTick = startOfDay(customStart);
  const endTick = startOfTomorrow(endMs);
  // Use calendar-day stepping (DST-safe enough for our use) via Date arithmetic.
  let spanDays = 0;
  {
    const d = new Date(startTick);
    const endD = new Date(endTick);
    while (d.getTime() < endD.getTime() && spanDays < 50_000) {
      d.setDate(d.getDate() + 1);
      spanDays += 1;
    }
  }
  spanDays = Math.max(1, spanDays);
  const daySpans = splitIntegerSpan(spanDays, 7);

  const ticks: number[] = [];
  const buckets: TimeBucket[] = [];
  let cursor = startTick;
  for (let i = 0; i < 7; i++) {
    ticks.push(cursor);
    const bStart = cursor;
    const bEndRaw = addDays(bStart, daySpans[i] ?? 0);
    const bEnd = Math.min(bEndRaw, endMs);
    buckets.push({ startMs: bStart, endMs: bEnd, midMs: bStart + (bEnd - bStart) / 2 });
    cursor = bEndRaw;
  }
  return { ticks, buckets, startMs: startTick, endMs };
}

type ParsedPoint = { t: number; y: number };

function parseTimeSeries(rawData: Array<{ x: string; y: number }>): ParsedPoint[] {
  const out: ParsedPoint[] = [];
  for (const p of rawData ?? []) {
    const t = Date.parse(p.x);
    if (!Number.isFinite(t)) continue;
    const y = typeof p.y === 'number' && Number.isFinite(p.y) ? p.y : 0;
    out.push({ t, y });
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}

export function aggregateDataIntoBuckets(
  rawData: Array<{ x: string; y: number }>,
  buckets: TimeBucket[],
  aggregationType: AggregationType
): number[] {
  const pts = parseTimeSeries(rawData);
  const out: number[] = [];

  // Single-pass pointer over sorted points.
  let j = 0;
  for (const b of buckets) {
    const start = b.startMs;
    const end = b.endMs;
    let count = 0;
    let sum = 0;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    while (j < pts.length && pts[j].t < start) j++;
    let k = j;
    while (k < pts.length && pts[k].t < end) {
      const y = pts[k].y;
      count += 1;
      sum += y;
      if (y < min) min = y;
      if (y > max) max = y;
      k++;
    }

    // We don't advance j past end, because next bucket starts at/after this end.
    j = k;

    if (count === 0) {
      out.push(0);
      continue;
    }
    if (aggregationType === 'sum') out.push(sum);
    else if (aggregationType === 'avg') out.push(sum / count);
    else if (aggregationType === 'min') out.push(min);
    else out.push(max);
  }
  return out;
}

export function formatLabels(
  tickMs: number[],
  rangeType: RangeType,
  options?: { timeZone?: string; granularity?: BucketSizeSpec['granularity'] }
): string[] {
  const tz = options?.timeZone;
  const mode: BucketSizeSpec['granularity'] =
    options?.granularity ?? (rangeType === '24h' ? 'hour' : rangeType === 'all' ? 'month' : 'day');

  const safeFmt = (opts: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat(undefined, tz ? { ...opts, timeZone: tz } : opts);
    } catch {
      return null;
    }
  };

  if (mode === 'hour') {
    const fmt = safeFmt({ hour: '2-digit', hour12: false });
    return tickMs.map((t) => {
      const d = new Date(t);
      if (fmt) return fmt.format(d);
      return String(d.getHours()).padStart(2, '0');
    });
  }

  if (mode === 'day') {
    const fmt = safeFmt({ month: 'short', day: 'numeric' });
    return tickMs.map((t) => {
      const d = new Date(t);
      if (fmt) return fmt.format(d);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
  }

  // month / year labels (month-ish)
  const fmtM = safeFmt({ month: 'short' });
  const fmtY = safeFmt({ year: '2-digit' });
  return tickMs.map((t) => {
    const d = new Date(t);
    if (fmtM && fmtY) return `${fmtM.format(d)} ’${fmtY.format(d)}`;
    return `${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
  });
}
