# TODO - Conference Room Booking System

## Decisions
- First milestone: Prisma schema + tenant isolation.
- Tablet auth: dedicated credentials with TABLET role.
- Overlap prevention: PostgreSQL exclusion constraints.
- Recurrence: store rule + expanded booking instances.
- Email: Resend provider.

## Progress
- Scaffolded Next.js App Router project.
- Added Prisma schema with tenant scoping.
- Added NextAuth config and Resend-based magic link sender.
- Applied initial Prisma migration and booking exclusion constraint.
- Added tenant/session guard utilities.
- Added tenant context helper for org-scoped queries.
- Added booking APIs for create/cancel and availability checks.
- Added tablet auth and validation endpoints with rate limiting.

## 1) Project foundations
- Confirm stack setup (Next.js App Router, NextAuth, Prisma, PostgreSQL).
- Define environment variables and Koyeb deployment expectations.
- Document org timezone handling and UTC storage approach.

## 2) Data modeling (Prisma)
- Draft schema for Organization, User, Room, Booking, RecurringBookingRule.
- Add BookingCredential, Tablet, AuditLog models.
- Define constraints: tenant scoping, booking overlap prevention, soft deletes.

## 3) Auth & authorization
- Configure NextAuth magic link flow.
- Implement roles (ADMIN, USER, TABLET) and server-side guards.
- Ensure tenant isolation by organizationId in all queries.

## 4) Booking logic
- Implement 15-minute boundary snapping and availability windows.
- Enforce room min/max duration and buffer time.
- Build recurring expansion with partial failure handling.
- Add transactional conflict prevention.

## 5) Tablet / kiosk mode
- Build tablet auth and long-lived session model.
- Create kiosk UI for current/next booking and validation.
- Add auto-refresh and offline resilience strategy.

## 6) Credentials (PIN/QR) & validation
- Generate per-booking PIN and QR token.
- Hash credentials at rest and validate time-bound usage.
- Rate-limit validation attempts and log events.

## 7) Emails & notifications
- Create templates for booking create/cancel/reminder.
- Ensure idempotency and safe retries.
- Include PIN and QR in messages.

## 8) Admin dashboard
- Build org, user, room management.
- Configure booking controls and audit log views.
- Expose time ranges, duration limits, and buffer rules.

## 9) API architecture
- Define API routes and server actions for bookings/validation/admin.
- Add input validation and consistent error handling.
- Ensure tenant and role checks are centralized.

## 10) Deployment & ops
- Validate Prisma migrations and connection pooling.
- Add audit log retention and monitoring notes.
- Produce a deployment checklist for Koyeb.
