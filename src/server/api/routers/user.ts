import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const userRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ clerkId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.clerkId, input.clerkId))
        .limit(1);

      return user;
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const allUsers = await ctx.db.select().from(users);
    return allUsers;
  }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      //   await ctx.db.insert(users).values({
      //     name: input.name,
      //   });
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    return null;
  }),
});
