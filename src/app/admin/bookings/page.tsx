"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  title: string | null;
  startAt: string;
  endAt: string;
  status: "ACTIVE" | "CANCELED";
  room: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    email: string | null;
  } | null;
};

type BookingsResponse = {
  bookings?: Booking[];
  error?: string;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [result, setResult] = useState("");

  async function loadBookings() {
    setResult("Loading bookings...");
    const response = await fetch("/api/admin/bookings");
    const data = (await response.json()) as BookingsResponse;
    if (!response.ok) {
      setResult(data.error ?? "Unable to load bookings");
      return;
    }
    setBookings(data.bookings ?? []);
    setResult("");
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function cancelBooking(bookingId: string) {
    setResult("Canceling booking...");
    const response = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
      method: "POST",
    });
    const data = (await response.json()) as BookingsResponse;
    if (!response.ok) {
      setResult(data.error ?? "Unable to cancel booking");
      return;
    }
    await loadBookings();
  }

  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Bookings</h1>
          <p className="muted">Review and cancel bookings.</p>
        </div>
        <nav className="nav">
          <a className="button secondary" href="/admin/rooms">
            Manage rooms
          </a>
          <a className="button secondary" href="/admin/audit">
            Audit logs
          </a>
          <a className="button secondary" href="/">
            Back home
          </a>
        </nav>
      </header>

      <section className="card stack">
        <h2>Recent bookings</h2>
        <div className="stack">
          {bookings.length === 0 ? (
            <p className="muted">No bookings found.</p>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="card stack">
                <strong>{booking.title ?? "Untitled booking"}</strong>
                <p className="muted">
                  Room: {booking.room.name} ({booking.room.id})
                </p>
                <p className="muted">
                  Start: {new Date(booking.startAt).toLocaleString()}
                </p>
                <p className="muted">
                  End: {new Date(booking.endAt).toLocaleString()}
                </p>
                <p className="muted">
                  Created by: {booking.createdBy?.email ?? "Unknown"}
                </p>
                <p className="muted">Status: {booking.status}</p>
                <div className="nav">
                  {booking.status === "ACTIVE" ? (
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => cancelBooking(booking.id)}
                    >
                      Cancel booking
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="result">{result || " "}</div>
    </div>
  );
}
