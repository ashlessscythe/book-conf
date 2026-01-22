"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type ChallengeResponse = {
  challengeId?: string;
  pin?: string;
  qrToken?: string;
  expiresAt?: string;
  error?: string;
};

export default function TabletChallengePage() {
  const [pin, setPin] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [result, setResult] = useState("");

  async function generateChallenge() {
    setResult("Generating login PIN...");
    const token = localStorage.getItem("tabletSessionToken");
    if (!token) {
      setResult("No tablet session token found. Authenticate first.");
      return;
    }

    const response = await fetch("/api/tablet/login-challenge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = (await response.json()) as ChallengeResponse;
    if (!response.ok || !data.challengeId || !data.qrToken || !data.pin) {
      setResult(data.error ?? "Unable to generate login PIN");
      return;
    }

    setPin(data.pin);
    setExpiresAt(data.expiresAt ?? "");

    const origin = window.location.origin;
    const url = `${origin}/auth/pin?challengeId=${data.challengeId}&token=${data.qrToken}`;
    const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 200 });
    setQrDataUrl(dataUrl);
    setResult("");
  }

  useEffect(() => {
    generateChallenge();
  }, []);

  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Login PIN</h1>
          <p className="muted">
            Show this PIN to users after they sign in by email.
          </p>
        </div>
        <nav className="nav">
          <a className="button secondary" href="/tablet/auth">
            Tablet auth
          </a>
          <a className="button secondary" href="/">
            Back home
          </a>
        </nav>
      </header>

      <section className="card stack">
        <h2>PIN & QR</h2>
        {pin ? (
          <div className="stack">
            <div className="result">PIN: {pin}</div>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Login QR code" />
            ) : (
              <p className="muted">Generating QR code...</p>
            )}
            <p className="muted">Expires at: {expiresAt || "soon"}</p>
            <button className="button secondary" type="button" onClick={generateChallenge}>
              Refresh PIN
            </button>
          </div>
        ) : (
          <p className="muted">{result || "Waiting for PIN..."}</p>
        )}
        <div className="result">{result || " "}</div>
      </section>
    </div>
  );
}
