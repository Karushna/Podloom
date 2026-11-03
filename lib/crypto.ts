import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET = process.env.SESSION_SECRET || "default_podloom_secret_32_characters_long_!";
const KEY = crypto.createHash("sha256").update(SECRET).digest();

/**
 * Encrypt sensitive tokens before storing in session/database
 */
export function encryptToken(token: string): string {
  if (!token) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt stored token on the server only
 */
export function decryptToken(encryptedPayload: string): string {
  if (!encryptedPayload) return "";
  try {
    const [ivHex, authTagHex, encrypted] = encryptedPayload.split(":");
    if (!ivHex || !authTagHex || !encrypted) return "";
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Token decryption failed:", err);
    return "";
  }
}
