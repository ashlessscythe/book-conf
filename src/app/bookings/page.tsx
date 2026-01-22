"use client";

import { useState } from "react";

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

export default function BookingsPage() {
  const [roomId, setRoomId] = useState("");
  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [cancelId, setCancelId] = useState("");
  const [createResult, setCreateResult] = useState("");
  const [cancelResult, setCancelResult] = useState("");

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateResult("Creating booking...");

    const payload = {
      roomId: roomId.trim(),
      title: title.trim() || undefined,
      startAt: startAt ? new Date(startAt).toISOString() : "",
      endAt: endAt ? new Date(endAt).toISOString() : "",
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
            <label htmlFor="roomId">Room ID</label>
            <input
              id="roomId"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              placeholder="room-id"
              required
            />
            <label htmlFor="title">Title (optional)</label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Team sync"
            />
            <label htmlFor="startAt">Start time</label>
            <input
              id="startAt"
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              required
            />
            <label htmlFor="endAt">End time</label>
            <input
              id="endAt"
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
              required
            />
            <button className="button" type="submit">
              Create booking
            </button>
          </form>
          <div className="result">{createResult || "No booking created yet."}</div>
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
