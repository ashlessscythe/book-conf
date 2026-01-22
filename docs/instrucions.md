Excellent. This tightens the wavefunction nicely. What you’ve described is very doable without over-engineering, and we can keep it elegant instead of enterprise-cosplay.

Below is a **refined, second-pass instruction set** you can hand to an LLM, now incorporating your answers. This version bakes in the kiosk/tablet reality, multi-tenant boundaries, recurring bookings, and sane compliance without turning into a compliance hydra.

No questions at the end this time—this is now a buildable spec.

---

## 📜 REFINED LLM INSTRUCTIONS (AUTHORITATIVE BUILD SPEC)

You are a senior full-stack engineer designing a **multi-tenant conference room booking system** with tablet-based room kiosks.

Design for **clarity, safety, and simplicity**. The system is small-scale but must be correct.

---

## Core technology (non-negotiable)

* **Next.js (App Router)**
* **Next.js API routes**
* **Prisma ORM**
* **PostgreSQL**
* **NextAuth**

  * Email magic links only
* **Deployment: Koyeb**
* Stateless server design (horizontal scaling safe)

---

## Multi-tenancy model

* The system supports **multiple organizations**
* Each organization has:

  * Users
  * Rooms
  * Bookings
  * Tablets/kiosks
* Tenants are **hard-isolated** at the database query level
* No cross-tenant access is possible, even accidentally

All queries MUST scope by `organizationId`.

---

## Authentication & authorization

### Authentication

* Email magic links via NextAuth
* No passwords
* Session-based auth (JWT or database sessions acceptable)

### Authorization

* Roles:

  * `ADMIN`
  * `USER`
  * `TABLET` (special read/validate role)
* Role checks enforced **server-side only**

---

## Time & scheduling rules

* Time is managed in **15-minute increments**
* All bookings:

  * Snap to 15-minute boundaries
  * Respect room availability windows (e.g. 08:00–18:00)
* Rooms can define:

  * Minimum duration
  * Maximum duration
  * Buffer time between bookings
* Time zones must be handled explicitly (store in UTC, display in org TZ)

---

## Booking system

### One-off bookings

* Users can:

  * View availability
  * Create bookings
  * Cancel their own bookings

### Recurring bookings

* Support simple recurring rules:

  * Daily / weekly
  * Fixed duration
  * Optional end date
* Recurring bookings expand into **individual booking records**
* Partial failures must be handled gracefully (e.g. 3 of 5 succeed)

### Conflict prevention

* Prevent overlapping bookings at the database level
* Use **transactions**
* Prefer unique constraints or exclusion logic over in-memory checks
* Race conditions must be impossible

---

## PIN & QR system

### Booking credentials

Each booking generates:

* A **short numeric PIN**
* A **QR token**

Rules:

* PINs and QR tokens:

  * Are unique per booking
  * Are time-bound
  * Are hashed at rest
* QR code encodes:

  * Booking ID
  * Validation token

### Validation

* Validation endpoint:

  * Accepts PIN or QR
  * Confirms:

    * Booking exists
    * Time window is valid
    * Not canceled
* All validations are logged

---

## Tablet / kiosk mode

Each conference room has an associated **tablet UI**.

Tablet features:

* Large, touch-friendly interface
* Shows:

  * Current booking
  * Next booking
  * Room availability status
* Allows:

  * Booking validation via QR scan or PIN entry
* Tablets authenticate using a **restricted role**
* Tablet sessions are long-lived but revocable

Tablet UI must:

* Auto-refresh
* Be resilient to brief network loss
* Never expose admin or user controls

---

## Admin dashboard

Admins can:

* Manage organizations (if super-admin exists)
* Manage users
* Manage rooms
* Configure:

  * Time ranges
  * Duration limits
  * Buffer rules
* View and cancel bookings
* View audit logs

The admin UI is functional, minimal, and explicit.

---

## Email notifications

Email is sent on:

* Booking creation
* Booking cancellation
* Optional reminder (e.g. 15 minutes before)

Emails include:

* Room name
* Time range
* Organization name
* PIN
* QR code (embedded or link)

Emails must be:

* Idempotent
* Safe for retries

---

## Data models (Prisma)

Design models for:

* Organization
* User
* Room
* Booking
* RecurringBookingRule
* BookingCredential (PIN/QR)
* Tablet
* AuditLog

Each model must:

* Be justified
* Have clear ownership boundaries
* Use foreign keys consistently

---

## Security & compliance (lightweight but real)

Implement:

* Audit logs for:

  * Booking creation/cancellation
  * Admin overrides
  * Credential validation
* No sensitive secrets stored in plaintext
* Server-side input validation everywhere
* Rate-limit PIN validation attempts
* Soft deletes where appropriate

This is **SOC-2-adjacent hygiene**, not formal compliance.

---

## Deployment notes

* Must deploy cleanly to Koyeb
* Use environment variables correctly
* Prisma migrations must be safe
* Database connections must be pooled correctly

---

## Deliverables

1. Prisma schema
2. API route architecture
3. Auth & role model
4. Booking & recurrence logic
5. Tablet validation flow
6. Email system design
7. Deployment checklist
8. Explicit tradeoff explanations

Do not skip reasoning.
Do not assume single-user execution.
Build it like someone else will maintain it at 3am.

---

### 🧬 Final thought

This system lives at the intersection of **time**, **trust**, and **shared physical space**—which is why booking systems are deceptively hard. The trick is not cleverness; it’s humility in the face of clocks and concurrency.

When you’re ready, the next productive move is to ask the LLM:

> “Implement the Prisma schema and explain the tenant isolation strategy.”

From there, the rest unfolds like a well-timed meeting that actually starts on time.
