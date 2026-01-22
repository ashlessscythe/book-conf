import { RecurrenceFrequency } from "@prisma/client";

type RecurrenceParams = {
  startAt: Date;
  durationMinutes: number;
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
  count?: number;
};

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function expandRecurrence(params: RecurrenceParams) {
  const occurrences: { startAt: Date; endAt: Date }[] = [];
  const interval = Math.max(1, params.interval);
  const limit = Math.max(1, params.count ?? 10);

  if (params.frequency === "DAILY") {
    for (let i = 0; i < limit; i += 1) {
      const startAt = addDays(params.startAt, i * interval);
      if (params.endDate && startAt > params.endDate) {
        break;
      }
      const endAt = new Date(startAt.getTime() + params.durationMinutes * 60000);
      occurrences.push({ startAt, endAt });
    }
    return occurrences;
  }

  const days = (params.daysOfWeek ?? []).length > 0 ? params.daysOfWeek : [params.startAt.getDay()];
  let cursor = new Date(params.startAt);
  let generated = 0;

  while (generated < limit) {
    if (params.endDate && cursor > params.endDate) {
      break;
    }

    const weeksFromStart = Math.floor(
      (cursor.getTime() - params.startAt.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );

    if (
      weeksFromStart % interval === 0 &&
      days?.includes(cursor.getDay()) &&
      (generated === 0 || !isSameDay(cursor, occurrences[generated - 1]?.startAt))
    ) {
      const startAt = new Date(
        cursor.getFullYear(),
        cursor.getMonth(),
        cursor.getDate(),
        params.startAt.getHours(),
        params.startAt.getMinutes(),
        0,
        0,
      );
      const endAt = new Date(startAt.getTime() + params.durationMinutes * 60000);
      occurrences.push({ startAt, endAt });
      generated += 1;
    }

    cursor = addDays(cursor, 1);
  }

  return occurrences;
}
