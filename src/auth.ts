import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { googleConfigurado, secretoAuth } from "@/lib/auth/config";

/**
 * Login con Google (ADR-021).
 *
 * QUE ES Y QUE NO ES. Iniciar sesion NO te identifica ante la red vecinal: tu alias
 * publico sigue siendo `vecino-1234` y es lo unico que ven los demas y lo unico que
 * toca la cadena. La cuenta de Google cumple dos funciones:
 *
 *   1. Continuidad: tu alias se deriva de tu cuenta, asi que entrar desde otro
 *      telefono te devuelve el MISMO seudonimo y tus reportes siguen siendo tuyos.
 *      Es la "wallet abstraction" del diseno, sin seed phrases ni Privy todavia.
 *   2. Es la identidad real que IdentityEscrow custodiaria cifrada, y que solo se
 *      abriria con las 2 de 3 firmas. Encaja con ADR-005, no lo contradice.
 *
 * DONDE VIVE. No hay base de datos (ADR-009). La sesion es un JWT en una cookie
 * firmada, en el dispositivo del usuario. Ni el correo ni el nombre se guardan en
 * ningun servidor nuestro, porque no hay servidor nuestro donde guardarlos.
 *
 * El login es OPCIONAL. Sin AUTH_GOOGLE_ID no se muestra el boton y la app funciona
 * igual con el seudonimo generado en el dispositivo.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  // Sin credenciales no se registra el proveedor: asi /api/auth/* no falla,
  // simplemente no ofrece con que entrar.
  providers: googleConfigurado() ? [Google] : [],

  // JWT en cookie, no base de datos.
  session: { strategy: "jwt" },
  secret: secretoAuth(),
  trustHost: true,

  pages: {
    // Errores de OAuth vuelven a Cuenta con ?error=, en vez de a una pagina
    // en ingles de NextAuth que rompe el tono de la app.
    signIn: "/cuenta",
    error: "/cuenta",
  },

  callbacks: {
    jwt({ token, profile }) {
      // `sub` es el identificador estable de la cuenta de Google. Es lo unico que
      // hace falta para derivar siempre el mismo seudonimo.
      if (profile?.sub) token.sub = profile.sub;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
