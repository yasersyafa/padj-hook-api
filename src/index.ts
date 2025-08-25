import { Hono } from "hono";
import { prisma } from "./db/prisma.js";

const BASE_API = `/api/${process.env.API_VERSION ?? "v1"}`;

const app = new Hono();

const welcomeStrings = [
  `Welcome to Padj Hook ${process.env.API_VERSION ?? "v1"} API`,
  "Visit our game at https://yasersyafaa.itch.io/padj-hook",
  "Build with Hono on Vercel, visit https://vercel.com/docs/frameworks/hono",
];

app.get("/", (c) => {
  return c.text(welcomeStrings.join("\n\n"));
});

// 1. GET /leaderboard → Top 10
app.get(`${BASE_API}/leaderboard`, async (c) => {
  const topPlayers = await prisma.player.findMany({
    orderBy: { score: "desc" },
    take: 10,
    select: { id: true, username: true, score: true },
  });

  return c.json(topPlayers);
});

// 2. GET /leaderboard/:userId → Rank & score 1 player
app.get(`${BASE_API}/leaderboard/:userId`, async (c) => {
  const userId = c.req.param("userId");

  const player = await prisma.player.findUnique({
    where: { id: userId },
    select: { id: true, username: true, score: true },
  });

  if (!player) return c.json({ error: "Player not found" }, 404);

  // Hitung rank: jumlah player dengan skor lebih tinggi
  const higherCount = await prisma.player.count({
    where: { score: { gt: player.score } },
  });

  const rank = higherCount + 1;

  return c.json({ ...player, rank });
});

// 3. POST /leaderboard → Update skor kalau lebih tinggi
app.post(`${BASE_API}/leaderboard`, async (c) => {
  const { username, score } = await c.req.json();

  const player = await prisma.player.findUnique({ where: { username } });
  if (!player) {
    return c.json({ error: "Player not found" }, 404);
  }

  if (score > player.score) {
    const updated = await prisma.player.update({
      where: { username },
      data: { score },
    });
    return c.json({ message: "Score updated", player: updated });
  }

  return c.json({ message: "Score not updated, lower than current" });
});

// 4. GET Username
app.post(`${BASE_API}/check-player`, async (c) => {
  const { username } = await c.req.json<{ username: string }>();
  if (!username) {
    return c.json({ error: "Username is required" }, 400);
  }
  const player = await prisma.player.findFirst({
    where: { username },
    select: { id: true, username: true, score: true },
  });
  if (!player) {
    return c.json({ error: "Player not found" }, 404);
  }
  return c.json({ message: "Player found" }, 200);
});

// 5. POST Player
app.post(`${BASE_API}/player`, async (c) => {
  const { username, score } = await c.req.json<{
    username: string;
    score: number;
  }>();
  if (!username) {
    return c.json({ error: "Username is required" }, 400);
  }
  const existingPlayer = await prisma.player.findFirst({
    where: { username },
  });
  if (existingPlayer) {
    return c.json({ error: "Username already exists" }, 409);
  }
  const newPlayer = await prisma.player.create({
    data: { username, score },
  });
  return c.json({ message: "Player created", data: newPlayer }, 201);
});

export default app;
