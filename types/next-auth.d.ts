import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string;
    } & DefaultSession["user"];
  }

  interface JWT {
    id: string;
    organizationId: string;
  }
}
