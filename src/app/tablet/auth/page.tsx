"use client";

import { useState } from "react";

type TabletAuthResponse = {
  tabletId?: string;
  roomId?: string;
  sessionToken?: string;
  sessionExpiresAt?: string;
  error?: string;
};

export default function TabletAuthPage() {
  const [tabletId, setTabletId] = useState("");
  const [credential, setCredential] = useState("");
  const [result, setResult] = useState("");

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult("Authenticating tablet...");

    const response = await fetch("/api/tablet/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tabletId: tabletId.trim(),
        credential: credential.trim(),
      }),
    });

    const data = (await response.json()) as TabletAuthResponse;
    if (!response.ok || !data.sessionToken) {
      setResult(data.error ?? "Unable to authenticate tablet");
      return;
    }

    localStorage.setItem("tabletSessionToken", data.sessionToken);
    setResult(
      JSON.stringify(
        {
          tabletId: data.tabletId,
          roomId: data.roomId,
          sessionExpiresAt: data.sessionExpiresAt,
        },
        null,
        2,
      ),
    );
  }

  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Tablet authentication</h1>
          <p className="muted">Store a session token for validation.</p>
        </div>
        <nav className="nav">
          <a className="button secondary" href="/">
            Back home
          </a>
        </nav>
      </header>

      <section className="card stack">
        <h2>Authenticate</h2>
        <form className="form" onSubmit={handleAuth}>
          <label htmlFor="tabletId">Tablet ID</label>
          <input
            id="tabletId"
            value={tabletId}
            onChange={(event) => setTabletId(event.target.value)}
            required
          />
          <label htmlFor="credential">Credential</label>
          <input
            id="credential"
            value={credential}
            onChange={(event) => setCredential(event.target.value)}
            required
          />
          <button className="button" type="submit">
            Authenticate
          </button>
        </form>
        <div className="result">{result || "No token stored yet."}</div>
      </section>
    </div>
  );
}
