import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import prisma from "../../../lib/db"

// Definir las opciones directamente en este archivo para evitar conflictos
const authOptions = {
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

          // Autenticación de emergencia para admin en desarrollo
          if (
            process.env.NODE_ENV === "development" &&
            credentials.username === "admin" &&
            credentials.password === "admin"
          ) {
            console.log("Autenticación de emergencia para admin")
            return {
              id: "0",
              username: "admin",
              email: "admin@example.com",
              role: "admin",
            }
          }

          // Autenticación de emergencia para conductor en desarrollo
          if (
            process.env.NODE_ENV === "development" &&
            credentials.username === "Carlos" &&
            credentials.password === "Carlostaxi30!"
          ) {
            console.log("Autenticación de emergencia para conductor")
            return {
              id: "1",
              username: "Carlos",
              email: "carlos@example.com",
              role: "driver",
            }
          }

          // Autenticación de emergencia para Raul en desarrollo
          if (
            process.env.NODE_ENV === "development" &&
            credentials.username === "Raul" &&
            credentials.password === "Raultaxi30!"
          ) {
            console.log("Autenticación de emergencia para Raul")
            return {
              id: "2",
              username: "Raul",
              email: "raul@example.com",
              role: "admin",
            }
          }

          // Si no es autenticación de emergencia, buscar en la base de datos
          try {
            const user = await prisma.user.findFirst({
              where: { username: credentials.username },
            })

            if (!user) {
              console.log("Usuario no encontrado")
              return null
            }

            const passwordMatch = await compare(credentials.password, user.password)

            if (!passwordMatch) {
              console.log("Contraseña incorrecta")
              return null
            }

            return {
              id: user.id.toString(),
              username: user.username,
              email: user.email,
              role: user.role,
            }
          } catch (dbError) {
            console.error("Error al consultar la base de datos:", dbError)
            // Si hay un error en la base de datos, seguimos con la autenticación de emergencia
            return null
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
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
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
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
