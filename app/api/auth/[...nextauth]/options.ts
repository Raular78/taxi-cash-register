import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "../../../lib/db"

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
          console.log(`Buscando usuario: ${credentials.username}`)

          // Buscar usuario por nombre de usuario
          const user = await prisma.user.findFirst({
            where: {
              username: credentials.username,
            },
          })

          // Si no se encuentra el usuario, intentar autenticación de emergencia
          if (!user) {
            // Autenticación de emergencia para conductores
            if (credentials.username === "Carlos" && credentials.password === "Carlos123!") {
              console.log("Autenticación de emergencia para conductor")
              return {
                id: "1",
                username: "Carlos",
                email: "carlos@example.com",
                role: "driver",
              }
            }

            // Autenticación de emergencia para administradores
            if (credentials.username === "Raul" && credentials.password === "Raultaxi30!") {
              console.log("Autenticación de emergencia para Raul")
              return {
                id: "2",
                username: "Raul",
                email: "raul@example.com",
                role: "admin",
              }
            }

            return null
          }

          // Verificar contraseña (en producción, usar bcrypt.compare)
          const isPasswordValid = user.password === credentials.password

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id.toString(),
            username: user.username,
            email: user.email,
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
        token.username = user.username
        token.email = user.email
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.email = token.email as string
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
  debug: process.env.NODE_ENV === "development",
}

export default authOptions
