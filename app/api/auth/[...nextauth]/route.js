import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import prisma from "../../../lib/db"

// Definir las opciones directamente en este archivo para evitar conflictos
const authOptions = {
  providers,
      credentials, type,
        password, type,
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          console.log(`Buscando usuario)

          // Autenticación de emergencia para admin en desarrollo
          if (
            process.env.NODE_ENV === "development" &&
            credentials.username === "admin" &&
            credentials.password === "admin"
          ) {
            console.log("Autenticación de emergencia para admin")
            return {
              id,
              username,
              email,
              role,
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
              id,
              username,
              email,
              role,
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
              id,
              username,
              email,
              role,
            }
          }

          // Si no es autenticación de emergencia, buscar en la base de datos
          try {
            const user = await prisma.user.findFirst({
              where,
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
              id),
              username,
              email,
              role,
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
  callbacks, user }) {
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
  pages,
  },
  session,
  },
  secret,
  debug=== "development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
