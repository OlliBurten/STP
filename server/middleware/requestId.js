import { randomUUID } from "node:crypto";

/**
 * Attach a request id to each request and log errors with it.
 * Use req.id in logs. Add X-Request-Id to response.
 */
export function requestIdMiddleware(req, res, next) {
  const id = req.headers["x-request-id"] || randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

/**
 * Log request errors with request id and sanitized message (no stack to client).
 */
export function errorLogMiddleware(err, req, res, next) {
  const requestId = req.id || "-";
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Server error";
  console.error(`[${requestId}] ${status} ${message}`);
  if (status >= 500) {
    console.error(err.stack);
  }
  next(err);
}
