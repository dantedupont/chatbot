import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../server/db/index"; // your drizzle instance
import { nextCookies } from "better-auth/next-js";
 
export const auth = betterAuth({
    emailAndPassword: {  
        enabled: true
    },
    socialProviders: {  
    }, 
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
    }),
    plugins: [nextCookies()] 
});