import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.PORT ?? 5000);

app.listen(port, "0.0.0.0", () => {
  console.log(`[server] Perolehan running on http://0.0.0.0:${port}`);
});