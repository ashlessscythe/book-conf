import { randomBytes } from "crypto";

const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateRoomId(length = 8) {
  const bytes = randomBytes(length);
  let value = "";

  for (let i = 0; i < length; i += 1) {
    value += ALPHANUM[bytes[i] % ALPHANUM.length];
  }

  return value;
}
