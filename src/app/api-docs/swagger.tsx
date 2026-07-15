"use client";

import { useEffect, useRef } from "react";
import "swagger-ui-dist/swagger-ui.css";

/**
 * Swagger UI di-mount secara client-only lewat dynamic import ke bundle UMD
 * `swagger-ui-bundle.js` (bukan index.js, yang menarik dependensi Node `path`).
 */
export default function SwaggerUI({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !containerRef.current) return;
    initialized.current = true;

    let cancelled = false;
    import("swagger-ui-dist/swagger-ui-bundle.js").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const SwaggerUIBundle = mod.default;
      SwaggerUIBundle({
        url,
        domNode: containerRef.current,
        deepLinking: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
        tryItOutEnabled: true,
        presets: [SwaggerUIBundle.presets.apis],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return <div ref={containerRef} />;
}
