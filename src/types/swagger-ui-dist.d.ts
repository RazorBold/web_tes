declare module "swagger-ui-dist/swagger-ui-bundle.js" {
  interface SwaggerUIBundleFn {
    (config: Record<string, unknown>): unknown;
    presets: { apis: unknown };
  }
  const SwaggerUIBundle: SwaggerUIBundleFn;
  export default SwaggerUIBundle;
}

declare module "swagger-ui-dist/swagger-ui.css";
