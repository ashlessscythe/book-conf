"use client";

import { useState } from "react";

type ValidationResponse = {
  booking?: {
    id: string;
    roomId: string;
    title: string | null;
    startAt: string;
    endAt: string;
  };
  error?: string;
};

export default function TabletValidatePage() {
  const [mode, setMode] = useState<"PIN" | "QR">("PIN");
  const [pin, setPin] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [result, setResult] = useState("");

  async function handleValidate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult("Validating...");

    const token = localStorage.getItem("tabletSessionToken");
    if (!token) {
      setResult("No tablet session token found. Authenticate first.");
      return;
    }

    const payload =
      mode === "PIN"
        ? { pin: pin.trim() }
        : { bookingId: bookingId.trim(), qrToken: qrToken.trim() };

    const response = await fetch("/api/tablet/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ValidationResponse;
    if (!response.ok) {
      setResult(data.error ?? "Unable to validate");
      return;
    }
    setResult(JSON.stringify(data.booking, null, 2));
  }

  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Tablet validation</h1>
          <p className="muted">Validate a booking with PIN or QR token.</p>
        </div>
        <nav className="nav">
          <a className="button secondary" href="/tablet/auth">
            Tablet auth
          </a>
          <a className="button secondary" href="/tablet/challenge">
            Login PIN
          </a>
          <a className="button secondary" href="/">
            Back home
          </a>
        </nav>
      </header>

      <section className="card stack">
        <h2>Validate booking</h2>
        <form className="form" onSubmit={handleValidate}>
          <label htmlFor="mode">Validation method</label>
          <select
            id="mode"
            value={mode}
            onChange={(event) =>
              setMode(event.target.value === "QR" ? "QR" : "PIN")
            }
          >
            <option value="PIN">PIN</option>
            <option value="QR">QR</option>
          </select>

          {mode === "PIN" ? (
            <>
              <label htmlFor="pin">PIN</label>
              <input
                id="pin"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                required
              />
            </>
          ) : (
            <>
              <label htmlFor="bookingId">Booking ID</label>
              <input
                id="bookingId"
                value={bookingId}
                onChange={(event) => setBookingId(event.target.value)}
                required
              />
              <label htmlFor="qrToken">QR token</label>
              <input
                id="qrToken"
                value={qrToken}
                onChange={(event) => setQrToken(event.target.value)}
                required
              />
            </>
          )}

          <button className="button" type="submit">
            Validate
          </button>
        </form>
        <div className="result">{result || "No validation yet."}</div>
      </section>
    </div>
  );
}
