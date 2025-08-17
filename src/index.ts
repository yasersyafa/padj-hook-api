import { Hono } from "hono";
import { prisma } from "./db/prisma.ts";

const app = new Hono();

const welcomeStrings = [
  "Welcome to Padj Hook",
  "Visit our game at https://yasersyafaa.itch.io/padj-hook",
  "Build with Hono on Vercel, visit https://vercel.com/docs/frameworks/hono",
];

app.get("/", (c) => {
  return c.text(welcomeStrings.join("\n\n"));
});

// 1. GET /leaderboard → Top 10
app.get("/leaderboard", async (c) => {
  const topPlayers = await prisma.player.findMany({
    orderBy: { score: "desc" },
    take: 10,
    select: { id: true, username: true, score: true },
  });

  return c.json(topPlayers);
});

// 2. GET /leaderboard/:userId → Rank & score 1 player
app.get("/leaderboard/:userId", async (c) => {
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
app.post("/leaderboard", async (c) => {
  const { userId, score } = await c.req.json();

  const player = await prisma.player.findUnique({ where: { id: userId } });
  if (!player) {
    return c.json({ error: "Player not found" }, 404);
  }

  if (score > player.score) {
    const updated = await prisma.player.update({
      where: { id: userId },
      data: { score },
    });
    return c.json({ message: "Score updated", player: updated });
  }

  return c.json({ message: "Score not updated, lower than current" });
});

export default app;
