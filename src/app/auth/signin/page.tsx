"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult("Sending magic link...");

    const response = await signIn("email", {
      email: email.trim(),
      callbackUrl: "/auth/pin",
      redirect: false,
    });

    if (response?.error) {
      setResult(response.error);
      return;
    }

    setResult("Check your email for the sign-in link.");
  }

  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Sign in</h1>
          <p className="muted">We will email you a magic link to continue.</p>
        </div>
        <nav className="nav">
          <a className="button secondary" href="/">
            Back home
          </a>
        </nav>
      </header>

      <section className="card stack">
        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button className="button" type="submit">
            Send magic link
          </button>
        </form>
        <div className="result">{result || " "}</div>
      </section>
    </div>
  );
}
