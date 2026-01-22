"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "USER" | "TABLET";
  createdAt: string;
};

type UsersResponse = {
  users?: User[];
  error?: string;
};

const ROLES: User["role"][] = ["ADMIN", "USER", "TABLET"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [result, setResult] = useState("");

  async function loadUsers() {
    setResult("Loading users...");
    const response = await fetch("/api/admin/users");
    const data = (await response.json()) as UsersResponse;
    if (!response.ok) {
      setResult(data.error ?? "Unable to load users");
      return;
    }
    setUsers(data.users ?? []);
    setResult("");
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateRole(userId: string, role: User["role"]) {
    setResult("Updating role...");
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = (await response.json()) as UsersResponse;
    if (!response.ok) {
      setResult(data.error ?? "Unable to update role");
      return;
    }
    await loadUsers();
  }

  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Users</h1>
          <p className="muted">Manage user roles for your organization.</p>
        </div>
        <nav className="nav">
          <a className="button secondary" href="/admin/bookings">
            Bookings
          </a>
          <a className="button secondary" href="/admin/audit">
            Audit logs
          </a>
          <a className="button secondary" href="/admin/rooms">
            Manage rooms
          </a>
          <a className="button secondary" href="/">
            Back home
          </a>
        </nav>
      </header>

      <section className="card stack">
        <h2>Team members</h2>
        <div className="stack">
          {users.length === 0 ? (
            <p className="muted">No users found.</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="card stack">
                <strong>{user.email ?? "No email"}</strong>
                <p className="muted">Role: {user.role}</p>
                <label className="stack">
                  <span className="muted">Update role</span>
                  <select
                    className="button secondary"
                    value={user.role}
                    onChange={(event) =>
                      updateRole(user.id, event.target.value as User["role"])
                    }
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="result">{result || " "}</div>
    </div>
  );
}
