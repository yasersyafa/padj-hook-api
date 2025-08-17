import { Hono } from "hono";

const app = new Hono();

const welcomeStrings = [
  "Welcome to Padj Hook",
  "Visit our game at https://yasersyafaa.itch.io/padj-hook",
  "Build with Hono on Vercel, visit https://vercel.com/docs/frameworks/hono",
];

app.get("/", (c) => {
  return c.text(welcomeStrings.join("\n\n"));
});

export default app;
