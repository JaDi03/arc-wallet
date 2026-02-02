import type { NextConfig } from "next";
const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
});

const nextConfig: NextConfig = {
    // Redirects removed as we don't have /profile -> /me mapping in the new wallet app yet
};
// Silence Next.js 16 Turbopack error when using Webpack plugins (like next-pwa)
// @ts-ignore
nextConfig.turbopack = {};

export default withPWA(nextConfig);
