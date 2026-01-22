"use client";

import { useEffect, useState } from "react";

type AuditLog = {
  id: string;
  action: string;
  actorType: string;
  createdAt: string;
  booking?: {
    id: string;
    title: string | null;
  } | null;
  actorUser?: {
    email: string | null;
  } | null;
  actorTablet?: {
    name: string;
  } | null;
  metadata?: Record<string, unknown> | null;
};

type AuditResponse = {
  logs?: AuditLog[];
  error?: string;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [result, setResult] = useState("");

  async function loadLogs() {
    setResult("Loading audit logs...");
    const response = await fetch("/api/admin/audit-logs");
    const data = (await response.json()) as AuditResponse;
    if (!response.ok) {
      setResult(data.error ?? "Unable to load audit logs");
      return;
    }
    setLogs(data.logs ?? []);
    setResult("");
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Audit logs</h1>
          <p className="muted">Review system activity and validations.</p>
        </div>
        <nav className="nav">
          <a className="button secondary" href="/admin/bookings">
            Bookings
          </a>
          <a className="button secondary" href="/admin/rooms">
            Rooms
          </a>
          <a className="button secondary" href="/">
            Back home
          </a>
        </nav>
      </header>

      <section className="card stack">
        <h2>Recent activity</h2>
        <div className="stack">
          {logs.length === 0 ? (
            <p className="muted">No audit logs found.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="card stack">
                <strong>{log.action}</strong>
                <p className="muted">
                  Actor: {log.actorType}{" "}
                  {log.actorUser?.email ? `(${log.actorUser.email})` : ""}
                  {log.actorTablet?.name ? `(${log.actorTablet.name})` : ""}
                </p>
                <p className="muted">
                  Booking: {log.booking?.title ?? "N/A"}
                </p>
                <p className="muted">
                  Time: {new Date(log.createdAt).toLocaleString()}
                </p>
                {log.metadata ? (
                  <pre className="result">{JSON.stringify(log.metadata, null, 2)}</pre>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <div className="result">{result || " "}</div>
    </div>
  );
}
