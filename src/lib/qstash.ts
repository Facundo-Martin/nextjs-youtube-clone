import { Client } from "@upstash/workflow";

// TODO: Refactor this to use @env-oss
export const workflow = new Client({ token: process.env.QSTASH_TOKEN! });
