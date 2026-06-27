import { Router } from "express";
import healthRouter from "./health.js";
import perolehanRouter from "./perolehan.js";
import generateDocRouter from "./generate-doc.js";
import generateSuratRouter from "./generate-surat.js";

const router = Router();

router.use(healthRouter);
router.use("/perolehan", perolehanRouter);
router.use("/perolehan", generateDocRouter);
router.use("/perolehan", generateSuratRouter);

export default router;
