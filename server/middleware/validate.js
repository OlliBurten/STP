/**
 * Middleware to validate req.body with a Zod schema.
 * On success: req.body is replaced with the parsed value.
 * On error: responds with 400 and the first error message.
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      return next();
    }
    const first = result.error?.errors?.[0];
    const message = first?.message || "Ogiltiga data";
    return res.status(400).json({ error: message });
  };
}

/**
 * Validate req.query with a Zod schema.
 * On success: req.query is replaced with the parsed value (strings only from query).
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (result.success) {
      req.query = result.data;
      return next();
    }
    const first = result.error?.errors?.[0];
    const message = first?.message || "Ogiltiga filter";
    return res.status(400).json({ error: message });
  };
}
