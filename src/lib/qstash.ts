import { env } from "@/env";
import { Client } from "@upstash/workflow";

export const workflow = new Client({ token: env.QSTASH_TOKEN });
