"use client";

import { useEffect, useMemo, useState } from "react";

type BookingResponse = {
  booking?: {
    id: string;
    roomId: string;
    title: string | null;
    startAt: string;
    endAt: string;
  };
  error?: string;
};

type RecurringResponse = {
  ruleId?: string;
  results?: Array<{
    startAt: string;
    endAt: string;
    bookingId?: string;
    error?: string;
  }>;
  error?: string;
};

type RoomOption = {
  id: string;
  name: string;
};

type RoomsResponse = {
  rooms?: RoomOption[];
  error?: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function roundToNextQuarter(date: Date) {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const next = Math.ceil(minutes / 15) * 15;
  rounded.setMinutes(next, 0, 0);
  if (next === 60) {
    rounded.setHours(rounded.getHours() + 1);
    rounded.setMinutes(0, 0, 0);
  }
  return rounded;
}

export default function BookingsPage() {
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [roomId, setRoomId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("10");
  const [endMinute, setEndMinute] = useState("00");
  const [cancelId, setCancelId] = useState("");
  const [createResult, setCreateResult] = useState("");
  const [cancelResult, setCancelResult] = useState("");
  const [recurringResult, setRecurringResult] = useState("");
  const [recurringCount, setRecurringCount] = useState("5");
  const [recurringFrequency, setRecurringFrequency] = useState<"DAILY" | "WEEKLY">(
    "WEEKLY",
  );
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringDuration, setRecurringDuration] = useState("30");

  const hourOptions = useMemo(
    () => Array.from({ length: 24 }, (_, index) => pad(index)),
    [],
  );
  const minuteOptions = useMemo(
    () => ["00", "15", "30", "45"],
    [],
  );

  useEffect(() => {
    const now = roundToNextQuarter(new Date());
    setDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    setStartHour(pad(now.getHours()));
    setStartMinute(pad(now.getMinutes()));
    const end = new Date(now.getTime() + 30 * 60000);
    setEndHour(pad(end.getHours()));
    setEndMinute(pad(end.getMinutes()));
  }, []);

  useEffect(() => {
    async function loadRooms() {
      const response = await fetch("/api/rooms");
      const data = (await response.json()) as RoomsResponse;
      if (!response.ok) {
        setCreateResult(data.error ?? "Unable to load rooms");
        return;
      }
      setRooms(data.rooms ?? []);
      if (data.rooms && data.rooms.length > 0) {
        setRoomId((previous) => previous || data.rooms?.[0]?.id || "");
      }
    }

    loadRooms();
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

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateResult("Creating booking...");

    const payload = {
      roomId: roomId.trim(),
      title: title.trim() || undefined,
      startAt,
      endAt,
    };

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as BookingResponse;
    if (!response.ok) {
      setCreateResult(data.error ?? "Unable to create booking");
      return;
    }
    setCreateResult(JSON.stringify(data.booking, null, 2));
  }

  async function handleCancel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCancelResult("Canceling booking...");

    const response = await fetch("/api/bookings/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: cancelId.trim() }),
    });

    const data = (await response.json()) as BookingResponse;
    if (!response.ok) {
      setCancelResult(data.error ?? "Unable to cancel booking");
      return;
    }
    setCancelResult(JSON.stringify(data.booking, null, 2));
  }

  async function handleRecurring(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecurringResult("Creating recurring bookings...");

    const payload = {
      roomId: roomId.trim(),
      title: title.trim() || undefined,
      startAt,
      durationMinutes: Number(recurringDuration),
      frequency: recurringFrequency,
      interval: 1,
      daysOfWeek: recurringFrequency === "WEEKLY" ? recurringDays : undefined,
      count: Number(recurringCount),
    };

    const response = await fetch("/api/bookings/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as RecurringResponse;
    if (!response.ok) {
      setRecurringResult(data.error ?? "Unable to create recurring bookings");
      return;
    }

    setRecurringResult(JSON.stringify(data, null, 2));
  }

  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Bookings</h1>
          <p className="muted">Create and cancel room bookings.</p>
        </div>
        <nav className="nav">
          <a className="button secondary" href="/">
            Back home
          </a>
        </nav>
      </header>

      <section className="grid">
        <div className="card stack">
          <h2>Create booking</h2>
          <form className="form" onSubmit={handleCreate}>
            <label htmlFor="roomId">Room</label>
            <select
              id="roomId"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              required
            >
              {rooms.length === 0 ? (
                <option value="">No rooms available</option>
              ) : (
                rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.id})
                  </option>
                ))
              )}
            </select>
            <label htmlFor="title">Title (optional)</label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Team sync"
            />
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
              Create booking
            </button>
          </form>
          <div className="result">{createResult || "No booking created yet."}</div>
        </div>

        <div className="card stack">
          <h2>Recurring bookings</h2>
          <form className="form" onSubmit={handleRecurring}>
            <label htmlFor="recurringDuration">Duration (minutes)</label>
            <input
              id="recurringDuration"
              type="number"
              value={recurringDuration}
              onChange={(event) => setRecurringDuration(event.target.value)}
              required
            />
            <label htmlFor="recurringFrequency">Frequency</label>
            <select
              id="recurringFrequency"
              value={recurringFrequency}
              onChange={(event) =>
                setRecurringFrequency(
                  event.target.value === "DAILY" ? "DAILY" : "WEEKLY",
                )
              }
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
            {recurringFrequency === "WEEKLY" ? (
              <label className="stack">
                <span className="muted">Days of week</span>
                <div className="nav">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (label, index) => (
                      <label key={label} className="stack">
                        <input
                          aria-label={`${label} recurring day`}
                          type="checkbox"
                          checked={recurringDays.includes(index)}
                          onChange={(event) => {
                            setRecurringDays((previous) =>
                              event.target.checked
                                ? [...previous, index]
                                : previous.filter((day) => day !== index),
                            );
                          }}
                        />
                        <span className="muted">{label}</span>
                      </label>
                    ),
                  )}
                </div>
              </label>
            ) : null}
            <label htmlFor="recurringCount">Occurrences</label>
            <input
              id="recurringCount"
              type="number"
              value={recurringCount}
              onChange={(event) => setRecurringCount(event.target.value)}
              required
            />
            <button className="button secondary" type="submit">
              Create recurring
            </button>
          </form>
          <div className="result">
            {recurringResult || "No recurring bookings created yet."}
          </div>
        </div>

        <div className="card stack">
          <h2>Cancel booking</h2>
          <form className="form" onSubmit={handleCancel}>
            <label htmlFor="cancelId">Booking ID</label>
            <input
              id="cancelId"
              value={cancelId}
              onChange={(event) => setCancelId(event.target.value)}
              placeholder="booking-id"
              required
            />
            <button className="button secondary" type="submit">
              Cancel booking
            </button>
          </form>
          <div className="result">{cancelResult || "No cancellation yet."}</div>
        </div>
      </section>
    </div>
  );
}
