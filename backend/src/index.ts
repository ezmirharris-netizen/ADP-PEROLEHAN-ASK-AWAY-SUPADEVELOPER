const _warn = console.warn.bind(console);
console.warn = (...a: unknown[]) => {
  if (typeof a[0] === "string" && a[0].includes("DefaultEmbeddingFunction")) return;
  _warn(...a);
};

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const { default: app } = await import("./app.js");

const port = Number(process.env.PORT ?? 5000);

app.listen(port, "0.0.0.0", () => {
  console.log(`[server] Perolehan running on http://0.0.0.0:${port}`);
});