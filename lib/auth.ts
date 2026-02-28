import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,      // refresh cookie if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 30, // match session expiry — default is only 300s (5 min)
    },
  },
  advanced: {
    defaultCookieAttributes: {
      maxAge: 60 * 60 * 24 * 30,  // 30 days — forza cookie persistente
      sameSite: "lax",
      httpOnly: true,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account",
    },
  },
  plugins: [nextCookies()],
});
