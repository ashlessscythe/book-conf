-- Enable btree_gist for exclusion constraints on text fields.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent overlapping active bookings per room.
ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_roomId_time_excl"
EXCLUDE USING gist (
  "roomId" WITH =,
  tsrange("startAt", "endAt") WITH &&
)
WHERE ("status" = 'ACTIVE' AND "deletedAt" IS NULL);