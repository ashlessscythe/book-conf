"use client";

import { useEffect, useState } from "react";

type Room = {
  id: string;
  name: string;
  location: string | null;
  capacity: number | null;
  availabilityStartMinutes: number;
  availabilityEndMinutes: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  bufferMinutes: number;
  timeZone: string | null;
};

type RoomsResponse = {
  rooms?: Room[];
  error?: string;
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [result, setResult] = useState("");
  const [form, setForm] = useState({
    name: "",
    location: "",
    capacity: "",
    availabilityStartMinutes: "480",
    availabilityEndMinutes: "1080",
    minDurationMinutes: "15",
    maxDurationMinutes: "240",
    bufferMinutes: "0",
    timeZone: "",
  });

  async function loadRooms() {
    setResult("Loading rooms...");
    const response = await fetch("/api/admin/rooms");
    const data = (await response.json()) as RoomsResponse;
    if (!response.ok) {
      setResult(data.error ?? "Unable to load rooms");
      return;
    }
    setRooms(data.rooms ?? []);
    setResult("");
  }

  useEffect(() => {
    loadRooms();
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult("Creating room...");

    const payload = {
      name: form.name.trim(),
      location: form.location.trim() || undefined,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      availabilityStartMinutes: Number(form.availabilityStartMinutes),
      availabilityEndMinutes: Number(form.availabilityEndMinutes),
      minDurationMinutes: Number(form.minDurationMinutes),
      maxDurationMinutes: Number(form.maxDurationMinutes),
      bufferMinutes: Number(form.bufferMinutes),
      timeZone: form.timeZone.trim() || undefined,
    };

    const response = await fetch("/api/admin/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as RoomsResponse;
    if (!response.ok) {
      setResult(data.error ?? "Unable to create room");
      return;
    }

    setForm({
      name: "",
      location: "",
      capacity: "",
      availabilityStartMinutes: "480",
      availabilityEndMinutes: "1080",
      minDurationMinutes: "15",
      maxDurationMinutes: "240",
      bufferMinutes: "0",
      timeZone: "",
    });
    await loadRooms();
  }

  async function handleDelete(roomId: string) {
    setResult("Deleting room...");
    const response = await fetch(`/api/admin/rooms/${roomId}`, {
      method: "DELETE",
    });
    const data = (await response.json()) as RoomsResponse;
    if (!response.ok) {
      setResult(data.error ?? "Unable to delete room");
      return;
    }
    await loadRooms();
  }

  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Rooms</h1>
          <p className="muted">Create and manage rooms for your organization.</p>
        </div>
        <nav className="nav">
          <a className="button secondary" href="/admin/users">
            Manage users
          </a>
          <a className="button secondary" href="/">
            Back home
          </a>
        </nav>
      </header>

      <section className="grid">
        <div className="card stack">
          <h2>Create room</h2>
          <form className="form" onSubmit={handleCreate}>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
            <label htmlFor="location">Location</label>
            <input
              id="location"
              value={form.location}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
            />
            <label htmlFor="capacity">Capacity</label>
            <input
              id="capacity"
              type="number"
              value={form.capacity}
              onChange={(event) =>
                setForm({ ...form, capacity: event.target.value })
              }
            />
            <label htmlFor="availabilityStartMinutes">
              Availability start (minutes)
            </label>
            <input
              id="availabilityStartMinutes"
              type="number"
              value={form.availabilityStartMinutes}
              onChange={(event) =>
                setForm({
                  ...form,
                  availabilityStartMinutes: event.target.value,
                })
              }
            />
            <label htmlFor="availabilityEndMinutes">
              Availability end (minutes)
            </label>
            <input
              id="availabilityEndMinutes"
              type="number"
              value={form.availabilityEndMinutes}
              onChange={(event) =>
                setForm({
                  ...form,
                  availabilityEndMinutes: event.target.value,
                })
              }
            />
            <label htmlFor="minDurationMinutes">Min duration (minutes)</label>
            <input
              id="minDurationMinutes"
              type="number"
              value={form.minDurationMinutes}
              onChange={(event) =>
                setForm({ ...form, minDurationMinutes: event.target.value })
              }
            />
            <label htmlFor="maxDurationMinutes">Max duration (minutes)</label>
            <input
              id="maxDurationMinutes"
              type="number"
              value={form.maxDurationMinutes}
              onChange={(event) =>
                setForm({ ...form, maxDurationMinutes: event.target.value })
              }
            />
            <label htmlFor="bufferMinutes">Buffer (minutes)</label>
            <input
              id="bufferMinutes"
              type="number"
              value={form.bufferMinutes}
              onChange={(event) =>
                setForm({ ...form, bufferMinutes: event.target.value })
              }
            />
            <label htmlFor="timeZone">Time zone (optional)</label>
            <input
              id="timeZone"
              value={form.timeZone}
              onChange={(event) =>
                setForm({ ...form, timeZone: event.target.value })
              }
              placeholder="America/Los_Angeles"
            />
            <button className="button" type="submit">
              Create room
            </button>
          </form>
        </div>

        <div className="card stack">
          <h2>Existing rooms</h2>
          <div className="stack">
            {rooms.length === 0 ? (
              <p className="muted">No rooms created yet.</p>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="card stack">
                  <strong>{room.name}</strong>
                  <p className="muted">ID: {room.id}</p>
                  <p className="muted">
                    Availability: {room.availabilityStartMinutes} -{" "}
                    {room.availabilityEndMinutes} minutes
                  </p>
                  <div className="nav">
                    <a
                      className="button secondary"
                      href={`/rooms/${room.id}/availability`}
                    >
                      Check availability
                    </a>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => handleDelete(room.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="result">{result || " "}</div>
    </div>
  );
}
