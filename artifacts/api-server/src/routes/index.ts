import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generateImageRouter from "./openai/generate-image";
import geminiImageRouter from "./gemini/generate-image";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai", generateImageRouter);
router.use("/gemini", geminiImageRouter);

export default router;
