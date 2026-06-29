import { Router } from "express";
import { z } from "zod";
import { supabase } from "../supabaseClient.js";

const router = Router();

const TABLE = "rekod_perolehan";

const SaveBody = z.object({
  userId: z.string().min(1),
  situasi: z.string().min(1),
  hargaSilingNum: z.number().positive(),
  hargaSilingFmt: z.string(),
  analisisAi: z.string().min(1),
  tarikh: z.string(),
});

/* POST /api/rekod — save a new record */
router.post("/rekod", async (req, res) => {
  const parsed = SaveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Input tidak sah." });
    return;
  }
  const { userId, situasi, hargaSilingNum, hargaSilingFmt, analisisAi, tarikh } = parsed.data;

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      situasi,
      harga_siling_num: hargaSilingNum,
      harga_siling_fmt: hargaSilingFmt,
      analisis_ai: analisisAi,
      tarikh,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[rekod] Save error:", error.message);
    res.status(500).json({ error: "Gagal menyimpan rekod ke Supabase." });
    return;
  }

  res.json({ id: data.id });
});

/* GET /api/rekod?userId=... — fetch all records for a user */
router.get("/rekod", async (req, res) => {
  const userId = String(req.query["userId"] ?? "");
  if (!userId) {
    res.status(400).json({ error: "userId diperlukan." });
    return;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, situasi, harga_siling_num, harga_siling_fmt, analisis_ai, tarikh, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[rekod] Fetch error:", error.message);
    res.status(500).json({ error: "Gagal mendapatkan rekod daripada Supabase." });
    return;
  }

  res.json(data ?? []);
});

/* DELETE /api/rekod/:id?userId=... — delete a record */
router.delete("/rekod/:id", async (req, res) => {
  
const id = parseInt(req.params["id"], 10);
const userId = String(req.query["userId"] ?? "");

if (!userId || isNaN(id)) {
  res.status(400).json({ error: "id dan userId diperlukan." });
  return;
}
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[rekod] Delete error:", error.message);
    res.status(500).json({ error: "Gagal memadam rekod." });
    return;
  }

  res.json({ ok: true });
});

export default router;
