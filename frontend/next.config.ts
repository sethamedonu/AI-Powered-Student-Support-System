import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output as a standalone Node.js server — required for Amplify WEB_COMPUTE
  output: "standalone",

  // Expose env vars to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
    NEXT_PUBLIC_COGNITO_REGION: process.env.NEXT_PUBLIC_COGNITO_REGION ?? "",
    NEXT_PUBLIC_COGNITO_USER_POOL_ID:
      process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
    NEXT_PUBLIC_COGNITO_CLIENT_ID:
      process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "",
  },
};

export default nextConfig;
