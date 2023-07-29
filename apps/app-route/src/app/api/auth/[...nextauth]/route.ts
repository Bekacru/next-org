import { NextOrg } from "@next-org/next";
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

const handler = NextOrg(NextAuth, authOptions);
export { handler as GET, handler as POST };
