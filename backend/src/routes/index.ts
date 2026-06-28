import { Router } from "express";
import healthRouter from "./health.js";
import perolehanRouter from "./perolehan.js";
import generateSuratRouter from "./generate-surat.js";
import rekodRouter from "./rekod.js";

const router = Router();

router.use(healthRouter);
router.use("/perolehan", perolehanRouter);
router.use("/perolehan", generateSuratRouter);
router.use(rekodRouter);

export default router;
