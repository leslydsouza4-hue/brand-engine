import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generateImageRouter from "./openai/generate-image";
import geminiImageRouter from "./gemini/generate-image";
import descriptMetaRouter from "./descript/fetch-meta";
import supportDocMetaRouter from "./support-doc/fetch-meta";
import convertCmykRouter from "./convert-cmyk";
import featureRequestRouter from "./feature-request";
import importDocRouter from "./import-doc";
import claudeDesignRouter from "./claude-design";
const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai", generateImageRouter);
router.use("/gemini", geminiImageRouter);
router.use(descriptMetaRouter);
router.use(supportDocMetaRouter);
router.use(convertCmykRouter);
router.use(featureRequestRouter);
router.use(importDocRouter);
router.use(claudeDesignRouter);

export default router;
