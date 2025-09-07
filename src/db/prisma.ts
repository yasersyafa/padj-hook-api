import { PrismaClient } from "../generated/prisma/index.js";
import { withAccelerate } from "@prisma/extension-accelerate";

export const prisma = new PrismaClient().$extends(withAccelerate());
