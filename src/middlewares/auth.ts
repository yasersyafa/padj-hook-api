import { Context, Next } from "hono";

export const apiKeyAuth = async (c: Context, next: Next) => {
  const apiKey = c.req.header("x-api-key");

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  await next();
};
