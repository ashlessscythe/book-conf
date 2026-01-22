import ThemeSelector from "@/components/ThemeSelector";

export default function Home() {
  return (
    <div className="container stack">
      <header className="header">
        <div>
          <h1>Conference Room Booking</h1>
          <p className="muted">Quick access to booking, tablet, and room tools.</p>
        </div>
        <nav className="nav">
          <ThemeSelector />
          <a className="button secondary" href="/api/auth/signin">
            Sign in
          </a>
        </nav>
      </header>

      <section className="grid">
        <div className="card stack">
          <h2>Bookings</h2>
          <p className="muted">Create and cancel bookings.</p>
          <a className="button" href="/bookings">
            Open bookings
          </a>
        </div>
        <div className="card stack">
          <h2>Room availability</h2>
          <p className="muted">Check availability for a room.</p>
          <a className="button" href="/rooms/sample-room/availability">
            Check room
          </a>
        </div>
        <div className="card stack">
          <h2>Tablet</h2>
          <p className="muted">Authenticate and validate bookings.</p>
          <a className="button" href="/tablet/auth">
            Tablet auth
          </a>
        </div>
      </section>
    </div>
  );
}
