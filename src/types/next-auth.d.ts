import type { DefaultSession } from "next-auth";

/**
 * `user.id` guarda el identificador estable de la cuenta de Google (`sub`).
 * Es lo unico que se necesita para derivar siempre el mismo seudonimo (ver src/auth.ts).
 */
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
    } & DefaultSession["user"];
  }
}
