import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      role: string;
          clientId?: string | null; // Add clientId
          image?: string | null;
        } & DefaultSession["user"];
  }

  interface JWT {
      id: string;
      organizationId: string;
      role: string;
      clientId?: string | null; // Add clientId
      image?: string | null;
    }
}