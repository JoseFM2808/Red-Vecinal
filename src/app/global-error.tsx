"use client";

/**
 * Ultima red de seguridad: se activa cuando falla el propio layout raiz.
 * Reemplaza <html> y <body> completos, asi que no puede usar los componentes
 * de la app ni las clases del tema — de ahi los estilos en linea.
 */
export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#0a0c0f",
          color: "#e9eef4",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
            Vecino Seguro no pudo iniciar
          </h1>
          <p style={{ color: "#96a1b0", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Recarga la pagina. Si sigue igual, cierra y vuelve a abrir el navegador.
          </p>
          {error.digest ? (
            <p style={{ color: "#5d6875", fontSize: "0.6875rem", marginTop: "0.75rem" }}>
              ref: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              minHeight: 44,
              padding: "0 1.5rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#1c222a",
              color: "#e9eef4",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
