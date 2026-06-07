/* Bundles the React Email templates (JSX) → lib/emailRender.js (plain ESM).
 * Run from server/:  node emails/build.mjs   (or: npm run build:emails)
 * Keeps the backend runtime JSX-free; only this build step needs esbuild. */
import { build } from "esbuild";

await build({
  entryPoints: ["emails/index.jsx"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  jsx: "automatic",
  outfile: "lib/emailRender.js",
  logLevel: "info",
  // node builtins stay external automatically for platform:node
});

console.log("✓ emails built → lib/emailRender.js");
