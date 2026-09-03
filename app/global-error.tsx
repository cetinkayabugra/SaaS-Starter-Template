"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown by the root layout itself. It replaces
 * the whole document, so it can't rely on the layout's fonts, theme provider or
 * stylesheet being present — styles are inline and it renders its own html/body
 * on purpose.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: "#0a0a0a",
          color: "#fafafa",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ maxWidth: "24rem", fontSize: "0.875rem", color: "#a1a1a1", margin: 0 }}>
          The application failed to load. Please try again.
        </p>
        {error.digest && (
          <p style={{ fontSize: "0.75rem", color: "#a1a1a1", fontFamily: "ui-monospace, monospace" }}>
            Reference: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            borderRadius: "9999px",
            border: "none",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            background: "#fafafa",
            color: "#0a0a0a",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
