import { Hono } from "hono";
import { redis } from "../database/redis.ts";

const leaderboard = new Hono();

// submit a score
leaderboard.post("/", async (c) => {
  const { userId, score } = await c.req.json<{
    userId: string;
    score: number;
  }>();

  // store to redis
  await redis.zadd("leaderboard:2025", {
    score,
    member: userId,
  });

  return c.json({ message: "Score submitted successfully" });
});

// get score
leaderboard.get("/", async (c) => {
  const raw = await redis.zrange("leaderboard:2025", 0, 9, {
    rev: true, // descending order
    withScores: true,
  });

  const data = raw as { member: string; score: number }[];

  data.map((item, index) => ({
    userId: item.member,
    score: item.score,
    rank: index + 1,
  }));
});

// get score by user id
leaderboard.get("/:userId", async (c) => {
  const userId = c.req.param("userId");

  // Ambil rank (0-based index di Redis)
  const rank = await redis.zrevrank("leaderboard:2025", userId);

  // Ambil score
  const score = await redis.zscore("leaderboard:2025", userId);

  if (rank === null || score === null) {
    return c.json({ userId, message: "User not found in leaderboard" }, 404);
  }

  return c.json({
    userId,
    score,
    rank: rank + 1, // biar rank mulai dari 1
  });
});
