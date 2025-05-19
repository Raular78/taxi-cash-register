import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import prisma from "@/app/lib/db"

// Definir las opciones directamente en este archivo para evitar conflictos
const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario o Email", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          console.log(`Intentando autenticar: ${credentials.username}`);

          // Autenticación de emergencia para admin en desarrollo
          if (
            process.env.NODE_ENV === "development" &&
            (credentials.username === "admin" || credentials.username === "admin@example.com") &&
            credentials.password === "admin"
          ) {
            console.log("Autenticación de emergencia para admin");
            return {
              id: "0",
              username: "admin",
              email: "admin@example.com",
              role: "admin",
            };
          }

          // Autenticación de emergencia para Carlos en desarrollo
          if (
            process.env.NODE_ENV === "development" &&
            (credentials.username === "Carlos" || credentials.username === "ch.ar.ly64@hotmail.com") &&
            credentials.password === "Carlostaxi30!"
          ) {
            console.log("Autenticación de emergencia para Carlos");
            return {
              id: "1",
              username: "Carlos",
              email: "ch.ar.ly64@hotmail.com",
              role: "driver",
            };
          }

          // Autenticación de emergencia para Raul en desarrollo
          if (
            process.env.NODE_ENV === "development" &&
            (credentials.username === "Raul" || credentials.username === "r.arjona@mail.ru") &&
            credentials.password === "Raultaxi30!"
          ) {
            console.log("Autenticación de emergencia para Raul");
            return {
              id: "2",
              username: "Raul",
              email: "r.arjona@mail.ru",
              role: "admin",
            };
          }

          // Si no es autenticación de emergencia, buscar en la base de datos
          try {
            // Buscar usuario por nombre de usuario O email
            const user = await prisma.user.findFirst({
              where: {
                OR: [
                  { username: credentials.username },
                  { email: credentials.username }
                ]
              },
            });

            if (!user) {
              console.log("Usuario no encontrado");
              return null;
            }

            const passwordMatch = await compare(credentials.password, user.password);

            if (!passwordMatch) {
              console.log("Contraseña incorrecta");
              return null;
            }

            console.log(`Usuario autenticado: ${user.username} (${user.email})`);
            return {
              id: user.id.toString(),
              username: user.username,
              email: user.email,
              role: user.role,
            };
          } catch (dbError) {
            console.error("Error al consultar la base de datos:", dbError);
            // Si hay un error en la base de datos, seguimos con la autenticación de emergencia
            return null;
          }
        } catch (error) {
          console.error("Error en authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.role = token.role;
      }
      return session;
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
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };