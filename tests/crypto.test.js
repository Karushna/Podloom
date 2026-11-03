const test = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");

const ALGORITHM = "aes-256-gcm";
const SECRET = "podloom_test_secret_for_unit_tests_32ch!";
const KEY = crypto.createHash("sha256").update(SECRET).digest();

function encryptToken(token) {
  if (!token) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function decryptToken(encryptedPayload) {
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
    return "";
  }
}

test("Token Encryption and Decryption", async (t) => {
  await t.test("encrypts and correctly decrypts a Buffer access token", () => {
    const rawToken = "1/xyz987654321_buffer_real_user_token";
    const encrypted = encryptToken(rawToken);

    assert.notStrictEqual(encrypted, rawToken);
    assert.match(encrypted, /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);

    const decrypted = decryptToken(encrypted);
    assert.strictEqual(decrypted, rawToken);
  });

  await t.test("returns empty string for invalid or tampered ciphertext", () => {
    const rawToken = "1/secret_token";
    const encrypted = encryptToken(rawToken);
    const tampered = encrypted.slice(0, -4) + "ffff";

    const decrypted = decryptToken(tampered);
    assert.strictEqual(decrypted, "");
  });
});
