import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rekod_perolehan (
      id        SERIAL PRIMARY KEY,
      user_id   TEXT NOT NULL,
      situasi   TEXT NOT NULL,
      harga_siling_num  DECIMAL(14,2) NOT NULL,
      harga_siling_fmt  TEXT NOT NULL,
      analisis_ai       TEXT NOT NULL,
      tarikh    TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export { pool };
