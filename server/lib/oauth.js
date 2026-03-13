/**
 * Verify OAuth ID tokens and extract user claims.
 */
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID || "";
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID || "common"; // "common" = multi-tenant

const azureJwksClient =
  AZURE_CLIENT_ID && AZURE_TENANT_ID
    ? jwksClient({
        jwksUri: `https://login.microsoftonline.com/${AZURE_TENANT_ID}/discovery/v2.0/keys`,
        cache: true,
        rateLimit: true,
      })
    : null;

function getSigningKey(header, cb) {
  if (!azureJwksClient) return cb(new Error("Azure OAuth not configured"));
  azureJwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return cb(err);
    if (!key) return cb(new Error("Signing key not found"));
    const signingKey = key.getPublicKey();
    cb(null, signingKey);
  });
}

/**
 * Verify Google ID token and return { email, name }.
 * @param {string} idToken - The ID token from Google Sign-In
 * @returns {Promise<{ email: string, name: string }>}
 */
export async function verifyGoogleToken(idToken) {
  if (!GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID is not configured");
  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new Error("Token missing email");
  return {
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.given_name || payload.email?.split("@")[0] || "Användare",
  };
}

/**
 * Verify Microsoft ID token and return { email, name }.
 * @param {string} idToken - The ID token from Microsoft Sign-In
 * @returns {Promise<{ email: string, name: string }>}
 */
export async function verifyMicrosoftToken(idToken) {
  if (!AZURE_CLIENT_ID) throw new Error("AZURE_CLIENT_ID is not configured");
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      (header, cb) => getSigningKey(header, cb),
      {
        algorithms: ["RS256"],
        audience: AZURE_CLIENT_ID,
        // Issuer varies per tenant; signature + audience are validated
      },
      (err, decoded) => {
        if (err) return reject(err);
        const payload = decoded;
        const email = payload?.email || payload?.preferred_username;
        if (!email) return reject(new Error("Token missing email"));
        resolve({
          email: String(email).toLowerCase().trim(),
          name:
            payload.name ||
            payload.given_name ||
            (payload.email || payload.preferred_username || "").split("@")[0] ||
            "Användare",
        });
      }
    );
  });
}

export function isGoogleConfigured() {
  return !!GOOGLE_CLIENT_ID;
}

export function isMicrosoftConfigured() {
  return !!AZURE_CLIENT_ID;
}
