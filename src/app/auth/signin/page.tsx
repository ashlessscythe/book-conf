"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [result, setResult] = useState("");
  const [pinSent, setPinSent] = useState(false);

  async function handleSendPin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult("Sending PIN...");

    const response = await fetch("/api/auth/request-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setResult(data.error ?? "Unable to send PIN");
      return;
    }

    setPinSent(true);
    setResult("PIN sent. Check your email.");
  }

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult("Signing in...");

    const response = await signIn("credentials", {
      email: email.trim(),
      pin: pin.trim(),
      callbackUrl: "/",
      redirect: false,
    });

    if (response?.error) {
      setResult(response.error);
      return;
    }

    window.location.href = "/";
  }

  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Sign in</h1>
          <p className="muted">We will email you a sign-in PIN to continue.</p>
        </div>
        <nav className="nav">
          <a className="button secondary" href="/">
            Back home
          </a>
        </nav>
      </header>

      <section className="card stack">
        <form className="form" onSubmit={handleSendPin}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button className="button" type="submit">
            Send PIN
          </button>
        </form>
        <form className="form" onSubmit={handleSignIn}>
          <label htmlFor="pin">PIN</label>
          <input
            id="pin"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            required={pinSent}
            disabled={!pinSent}
          />
          <button className="button secondary" type="submit" disabled={!pinSent}>
            Sign in
          </button>
        </form>
        <div className="result">{result || " "}</div>
      </section>
    </div>
  );
}
