/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      new URL("https://image.mux.com/**"),
      new URL("https://0adh8ix5ma.ufs.sh/**"),
    ],
  },
};

export default config;
