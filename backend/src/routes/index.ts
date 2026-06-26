import { Router } from "express";
import healthRouter from "./health.js";
import perolehanRouter from "./perolehan.js";
import generateDocRouter from "./generate-doc.js";

const router = Router();

router.use(healthRouter);
router.use("/perolehan", perolehanRouter);
router.use("/perolehan", generateDocRouter);

export default router;
