import { Room } from "@prisma/client";

type BookingInput = {
  startAt: string;
  endAt: string;
};

type BookingValidation = {
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  timeZone: string;
};

function parseIsoDate(value: string, label: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${label} timestamp`);
  }
  return parsed;
}

function isQuarterHourAligned(date: Date): boolean {
  return date.getUTCMinutes() % 15 === 0 && date.getUTCSeconds() === 0;
}

function minutesInTimeZone(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

export function validateBookingInput(
  input: BookingInput,
  room: Room,
  organizationTimeZone: string,
): BookingValidation {
  const startAt = parseIsoDate(input.startAt, "startAt");
  const endAt = parseIsoDate(input.endAt, "endAt");

  if (endAt <= startAt) {
    throw new Error("End time must be after start time");
  }

  if (!isQuarterHourAligned(startAt) || !isQuarterHourAligned(endAt)) {
    throw new Error("Start and end times must align to 15-minute boundaries");
  }

  const durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60000);
  if (durationMinutes < room.minDurationMinutes) {
    throw new Error("Booking duration is below the room minimum");
  }
  if (durationMinutes > room.maxDurationMinutes) {
    throw new Error("Booking duration exceeds the room maximum");
  }

  const timeZone = room.timeZone || organizationTimeZone;
  const startDateKey = dateKeyInTimeZone(startAt, timeZone);
  const endDateKey = dateKeyInTimeZone(endAt, timeZone);
  if (startDateKey !== endDateKey) {
    throw new Error("Booking must start and end on the same day");
  }

  const startMinutes = minutesInTimeZone(startAt, timeZone);
  const endMinutes = minutesInTimeZone(endAt, timeZone);

  if (startMinutes < room.availabilityStartMinutes) {
    throw new Error("Booking starts before room availability");
  }
  if (endMinutes > room.availabilityEndMinutes) {
    throw new Error("Booking ends after room availability");
  }

  return {
    startAt,
    endAt,
    durationMinutes,
    timeZone,
  };
}

export function bufferedWindow(
  startAt: Date,
  endAt: Date,
  bufferMinutes: number,
) {
  const bufferedStart = new Date(startAt.getTime() - bufferMinutes * 60000);
  const bufferedEnd = new Date(endAt.getTime() + bufferMinutes * 60000);
  return { bufferedStart, bufferedEnd };
}
