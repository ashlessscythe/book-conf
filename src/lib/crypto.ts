import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function hashToken(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function tokenMatches(value: string, expectedHash: string): boolean {
  const valueHash = hashToken(value);
  if (valueHash.length !== expectedHash.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(valueHash), Buffer.from(expectedHash));
}

export function generateToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("hex");
}
