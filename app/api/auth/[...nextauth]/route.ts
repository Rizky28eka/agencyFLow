import NextAuth, { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db";
import * as bcrypt from "bcryptjs";
// import { User } from "@prisma/client"; // Removed unused import

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (user && user.passwordHash) {
            const isPasswordCorrect = await bcrypt.compare(
                credentials.password,
                user.passwordHash
            );

            if (isPasswordCorrect) {
                // Return user object without password hash
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { passwordHash: _passwordHash, ...userWithoutPassword } = user; // Renamed passwordHash to _passwordHash
                return userWithoutPassword;
            }
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
        if (user) {
            token.id = user.id;
                        if ('organizationId' in user && typeof user.organizationId === 'string') {
                token.organizationId = user.organizationId;
            }
        }
        return token;
    },
    async session({ session, token }) {
        if (session.user) {
            (session.user as { id: string }).id = token.id as string;
            (session.user as { organizationId: string }).organizationId = token.organizationId as string;
        }
        return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
