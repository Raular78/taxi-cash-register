import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "../../lib/prisma"
import { compare } from "bcryptjs"

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
          return null
        }

        try {
          // Buscar usuario por nombre de usuario
          const user = await prisma.user.findFirst({
            where: {
              username: credentials.username,
            },
          })

          // Si no se encuentra el usuario, verificar usuarios predefinidos
          if (!user) {
            // Usuarios predefinidos para desarrollo/pruebas
            const predefinedUsers = [
              {
                id: 1,
                username: "Raul",
                password: "Raultaxi30!",
                role: "admin",
                email: "raul@example.com",
              },
              {
                id: 2,
                username: "Carlos",
                password: "Carlostaxi30!",
                role: "driver",
                email: "carlos@example.com",
              },
            ]

            const predefinedUser = predefinedUsers.find(
              (u) => u.username === credentials.username && u.password === credentials.password,
            )

            if (predefinedUser) {
              return {
                id: String(predefinedUser.id),
                name: predefinedUser.username,
                email: predefinedUser.email,
                role: predefinedUser.role,
              }
            }

            return null
          }

          // Verificar contraseña
          let isPasswordValid = false

          // Si la contraseña está hasheada, usar bcrypt para comparar
          if (user.password && user.password.startsWith("$2")) {
            isPasswordValid = await compare(credentials.password, user.password)
          } else {
            // Si no está hasheada, comparar directamente (para desarrollo)
            isPasswordValid = user.password === credentials.password
          }

          if (!isPasswordValid) {
            return null
          }

          return {
            id: String(user.id),
            name: user.username,
            email: user.email || undefined,
            role: user.role,
          }
        } catch (error) {
          console.error("Error en authorize:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
}
