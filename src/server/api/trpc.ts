/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { ratelimit } from "@/lib/redis";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId: clerkUserId, ...rest } = await auth();
  return {
    db,
    ...opts,
    auth: {
      clerkUserId,
      ...rest,
    },
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Universal rate limiting middleware for both authenticated and unauthenticated users
 */
const rateLimitMiddleware = t.middleware(async ({ next, ctx }) => {
  // Use clerkUserId if available, otherwise fall back to IP
  const identifier =
    ctx.auth.clerkUserId ??
    ctx.headers.get("x-forwarded-for") ??
    ctx.headers.get("x-real-ip") ??
    "anonymous";

  const { success, limit, reset, remaining } =
    await ratelimit.limit(identifier);

  if (!success) {
    const resetTime = new Date(reset);
    const now = new Date();
    const secondsToWait = Math.round(
      (resetTime.getTime() - now.getTime()) / 1000,
    );

    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${secondsToWait} seconds.`,
    });
  }

  // Optional: Log rate limit info
  const userType = ctx.auth.clerkUserId ? "authenticated" : "anonymous";
  console.log(
    `[RATE_LIMIT] ${userType} user (${identifier}): ${remaining}/${limit} requests remaining`,
  );

  return next();
});
/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure
  .use(timingMiddleware)
  .use(rateLimitMiddleware);

/**
 * Helper function for checking whether the user is authed or not
 */
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.auth.clerkUserId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      auth: {
        ...ctx.auth,
        clerkUserId: ctx.auth.clerkUserId,
      },
    },
  });
});

const withUser = t.middleware(async ({ next, ctx }) => {
  if (!ctx.auth.clerkUserId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "clerkUserId should be defined",
    });
  }

  const [user] = await ctx.db
    .select()
    .from(users)
    .where(eq(users.clerkId, ctx.auth.clerkUserId));

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found in database",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

/**
 * Protected (authenticated) procedure with rate limiting
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(rateLimitMiddleware)
  .use(isAuthed)
  .use(withUser);
