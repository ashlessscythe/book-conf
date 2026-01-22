# TODO - Conference Room Booking System

## Decisions
- [x] First milestone: Prisma schema + tenant isolation.
- [x] Tablet auth: dedicated credentials with TABLET role.
- [x] Overlap prevention: PostgreSQL exclusion constraints.
- [x] Recurrence: store rule + expanded booking instances.
- [x] Email: Resend provider.

## Progress
- [x] Scaffolded Next.js App Router project.
- [x] Added Prisma schema with tenant scoping.
- [x] Added NextAuth config and Resend-based magic link sender.
- [x] Applied initial Prisma migration and booking exclusion constraint.
- [x] Added tenant/session guard utilities.
- [x] Added tenant context helper for org-scoped queries.
- [x] Added booking APIs for create/cancel and availability checks.
- [x] Added tablet auth and validation endpoints with rate limiting.
- [x] Added frontend pages for bookings, availability, and tablet flows.
- [x] Added Tailwind theme tokens with multi-theme palette.
- [x] Added theme selector with persisted preference.

## 1) Project foundations
- [x] Confirm stack setup (Next.js App Router, NextAuth, Prisma, PostgreSQL).
- [x] Define environment variables and Koyeb deployment expectations.
- [ ] Document org timezone handling and UTC storage approach.

## 2) Data modeling (Prisma)
- [x] Draft schema for Organization, User, Room, Booking, RecurringBookingRule.
- [x] Add BookingCredential, Tablet, AuditLog models.
- [x] Define constraints: tenant scoping, booking overlap prevention, soft deletes.

## 3) Auth & authorization
- [x] Configure NextAuth magic link flow.
- [x] Implement roles (ADMIN, USER, TABLET) and server-side guards.
- [x] Ensure tenant isolation by organizationId in all queries.

## 4) Booking logic
- [x] Implement 15-minute boundary snapping and availability windows.
- [x] Enforce room min/max duration and buffer time.
- [ ] Build recurring expansion with partial failure handling.
- [x] Add transactional conflict prevention.

## 5) Tablet / kiosk mode
- [x] Build tablet auth and long-lived session model.
- [ ] Create kiosk UI for current/next booking and validation.
- [ ] Add auto-refresh and offline resilience strategy.

## 6) Credentials (PIN/QR) & validation
- [ ] Generate per-booking PIN and QR token.
- [x] Hash credentials at rest and validate time-bound usage.
- [x] Rate-limit validation attempts and log events.

## 7) Emails & notifications
- [ ] Create templates for booking create/cancel/reminder.
- [ ] Ensure idempotency and safe retries.
- [ ] Include PIN and QR in messages.

## 8) Admin dashboard
- [x] Build org, user, room management.
- [ ] Configure booking controls and audit log views.
- [ ] Expose time ranges, duration limits, and buffer rules.

## 9) API architecture
- [x] Define API routes and server actions for bookings/validation/admin.
- [ ] Add input validation and consistent error handling.
- [x] Ensure tenant and role checks are centralized.

## 10) Deployment & ops
- [x] Validate Prisma migrations and connection pooling.
- [ ] Add audit log retention and monitoring notes.
- [ ] Produce a deployment checklist for Koyeb.
