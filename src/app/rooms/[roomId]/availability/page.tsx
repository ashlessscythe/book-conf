"use client";

import { useState } from "react";

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
  params: {
    roomId: string;
  };
};

export default function AvailabilityPage({ params }: PageProps) {
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [result, setResult] = useState("");

  async function handleCheck(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult("Checking availability...");

    const query = new URLSearchParams({
      startAt: startAt ? new Date(startAt).toISOString() : "",
      endAt: endAt ? new Date(endAt).toISOString() : "",
    });

    const response = await fetch(
      `/api/rooms/${params.roomId}/availability?${query.toString()}`,
    );
    const data = (await response.json()) as AvailabilityResponse;

    if (!response.ok) {
      setResult(data.error ?? "Unable to fetch availability");
      return;
    }
    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Room availability</h1>
          <p className="muted">Room ID: {params.roomId}</p>
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
            Check
          </button>
        </form>
        <div className="result">{result || "No availability checked yet."}</div>
      </section>
    </div>
  );
}
