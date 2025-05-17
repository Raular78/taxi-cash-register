import type { NextAuthOptions, Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import { compare } from "bcryptjs"

const prisma = new PrismaClient()

interface CustomUser extends User {
  id: string
  role: string
}

interface CustomSession extends Session {
  user: CustomUser
}

// En desarrollo, usamos un valor por defecto si NEXTAUTH_SECRET no está definido
const secret =
  process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === "development" ? "DESARROLLO-SECRETO-INSEGURO" : undefined)

// Solo lanzamos error en producción
if (!secret && process.env.NODE_ENV === "production") {
  throw new Error("NEXTAUTH_SECRET is not defined")
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Please enter username and password")
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        })

        if (!user) {
          throw new Error("No user found")
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error("Invalid password")
        }

        return {
          id: user.id.toString(),
          name: user.username,
          email: null,
          role: user.role || "driver", // Valor por defecto si no hay rol
        }
      },
    }),
  ],
  secret: secret,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id
        token.role = (user as CustomUser).role
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<CustomSession> {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
        } as CustomUser,
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
}
