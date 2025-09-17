import { z } from "zod";

import { eq } from "drizzle-orm";
import { categories } from "@/server/db/schema";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const categoryRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      const [category] = await ctx.db
        .select()
        .from(categories)
        .where(eq(categories.name, input.name))
        .limit(1);

      return category;
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const allCategories = await ctx.db.select().from(categories);
    return allCategories;
  }),
});
