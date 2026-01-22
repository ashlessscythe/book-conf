"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type PinStatus = {
  verified: boolean;
  pinVerifiedAt?: string | null;
  error?: string;
};

export default function PinClient() {
  const searchParams = useSearchParams();
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<PinStatus | null>(null);
  const [result, setResult] = useState("");

  const challengeId = searchParams.get("challengeId") ?? "";
  const token = searchParams.get("token") ?? "";

  async function loadStatus() {
    const response = await fetch("/api/auth/pin");
    const data = (await response.json()) as PinStatus;
    if (!response.ok) {
      setResult(data.error ?? "Unable to load status");
      return;
    }
    setStatus(data);
  }

  async function handleVerify(payload: {
    pin?: string;
    challengeId?: string;
    token?: string;
  }) {
    setResult("Verifying PIN...");
    const response = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as PinStatus;
    if (!response.ok) {
      setResult(data.error ?? "Unable to verify PIN");
      return;
    }
    setStatus({ verified: true, pinVerifiedAt: data.pinVerifiedAt ?? null });
    setResult("PIN verified. You can continue.");
  }

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (challengeId && token) {
      handleVerify({ challengeId, token });
    }
  }, [challengeId, token]);

  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Confirm with tablet PIN</h1>
          <p className="muted">
            Enter the PIN shown on the room tablet to finish signing in.
          </p>
        </div>
        <nav className="nav">
          <a className="button secondary" href="/">
            Back home
          </a>
        </nav>
      </header>

      <section className="card stack">
        <h2>PIN verification</h2>
        {status?.verified ? (
          <p className="muted">PIN verified at {status.pinVerifiedAt ?? "now"}.</p>
        ) : (
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              handleVerify({ pin: pin.trim() });
            }}
          >
            <label htmlFor="pin">PIN</label>
            <input
              id="pin"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              required
            />
            <button className="button" type="submit">
              Verify PIN
            </button>
          </form>
        )}
        <div className="result">{result || " "}</div>
      </section>
    </div>
  );
}
