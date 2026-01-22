"use client";

import { use, useEffect, useMemo, useState } from "react";

type AvailabilityResponse = {
  room?: {
    id: string;
    name: string;
    availabilityStartMinutes: number;
    availabilityEndMinutes: number;
    bufferMinutes: number;
    timeZone: string;
  };
  bookings?: Array<{
    id: string;
    title: string | null;
    startAt: string;
    endAt: string;
  }>;
  error?: string;
};

type PageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

export default function AvailabilityPage({ params }: PageProps) {
  const { roomId } = use(params);
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("10");
  const [endMinute, setEndMinute] = useState("00");
  const [result, setResult] = useState("");
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );

  const hourOptions = useMemo(
    () => Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0")),
    [],
  );
  const minuteOptions = useMemo(() => ["00", "15", "30", "45"], []);

  useEffect(() => {
    const now = new Date();
    const roundedMinutes = Math.ceil(now.getMinutes() / 15) * 15;
    now.setMinutes(roundedMinutes, 0, 0);
    if (roundedMinutes === 60) {
      now.setHours(now.getHours() + 1);
      now.setMinutes(0, 0, 0);
    }

    setDate(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate(),
      ).padStart(2, "0")}`,
    );
    setStartHour(String(now.getHours()).padStart(2, "0"));
    setStartMinute(String(now.getMinutes()).padStart(2, "0"));
    const end = new Date(now.getTime() + 30 * 60000);
    setEndHour(String(end.getHours()).padStart(2, "0"));
    setEndMinute(String(end.getMinutes()).padStart(2, "0"));
  }, []);

  function buildDateTime(hour: string, minute: string) {
    if (!date) {
      return "";
    }
    const value = new Date(`${date}T${hour}:${minute}:00`);
    if (Number.isNaN(value.getTime())) {
      return "";
    }
    return value.toISOString();
  }

  const startAt = buildDateTime(startHour, startMinute);
  const endAt = buildDateTime(endHour, endMinute);

  async function handleCheck(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult("Checking availability...");

    const query = new URLSearchParams({
      startAt,
      endAt,
    });

    const response = await fetch(
      `/api/rooms/${roomId}/availability?${query.toString()}`,
    );
    const data = (await response.json()) as AvailabilityResponse;

    if (!response.ok) {
      setResult(data.error ?? "Unable to fetch availability");
      setAvailability(null);
      return;
    }
    setAvailability(data);
    setResult("");
  }

  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Room availability</h1>
          <p className="muted">Room ID: {roomId}</p>
        </div>
        <nav className="nav">
          <a className="button secondary" href="/">
            Back home
          </a>
        </nav>
      </header>

      <section className="card stack">
        <h2>Check availability</h2>
        <form className="form" onSubmit={handleCheck}>
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
          <label>Start time</label>
          <div className="nav">
            <select
              aria-label="Start hour"
              value={startHour}
              onChange={(event) => setStartHour(event.target.value)}
              required
            >
              {hourOptions.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
            <select
              aria-label="Start minute"
              value={startMinute}
              onChange={(event) => setStartMinute(event.target.value)}
              required
            >
              {minuteOptions.map((minute) => (
                <option key={minute} value={minute}>
                  {minute}
                </option>
              ))}
            </select>
          </div>
          <label>End time</label>
          <div className="nav">
            <select
              aria-label="End hour"
              value={endHour}
              onChange={(event) => setEndHour(event.target.value)}
              required
            >
              {hourOptions.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
            <select
              aria-label="End minute"
              value={endMinute}
              onChange={(event) => setEndMinute(event.target.value)}
              required
            >
              {minuteOptions.map((minute) => (
                <option key={minute} value={minute}>
                  {minute}
                </option>
              ))}
            </select>
          </div>
          <button className="button" type="submit">
            Check
          </button>
        </form>
        {result ? <div className="result">{result}</div> : null}
        {availability ? (
          <div className="card stack">
            <strong>{availability.room?.name}</strong>
            <p className="muted">
              Availability: {availability.room?.availabilityStartMinutes} -{" "}
              {availability.room?.availabilityEndMinutes} minutes
            </p>
            <p className="muted">
              Time zone: {availability.room?.timeZone ?? "Unknown"}
            </p>
            <div className="stack">
              {availability.bookings && availability.bookings.length > 0 ? (
                availability.bookings.map((booking) => (
                  <div key={booking.id} className="card stack">
                    <strong>{booking.title ?? "Booked"}</strong>
                    <p className="muted">
                      {new Date(booking.startAt).toLocaleString()} -{" "}
                      {new Date(booking.endAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="muted">No conflicts for this window.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="result">No availability checked yet.</div>
        )}
      </section>
    </div>
  );
}
