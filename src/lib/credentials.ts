import { generateToken, hashToken } from "@/lib/crypto";

const PIN_LENGTH = 6;

export function generatePin(): string {
  const min = 10 ** (PIN_LENGTH - 1);
  const max = 10 ** PIN_LENGTH;
  const value = Math.floor(min + Math.random() * (max - min));
  return String(value);
}

export function createCredentialToken() {
  const token = generateToken(16);
  return {
    token,
    tokenHash: hashToken(token),
  };
}
