import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generateImageRouter from "./openai/generate-image";
import geminiImageRouter from "./gemini/generate-image";
import descriptMetaRouter from "./descript/fetch-meta";
import supportDocMetaRouter from "./support-doc/fetch-meta";
import convertCmykRouter from "./convert-cmyk";
const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai", generateImageRouter);
router.use("/gemini", geminiImageRouter);
router.use(descriptMetaRouter);
router.use(supportDocMetaRouter);
router.use(convertCmykRouter);

export default router;
