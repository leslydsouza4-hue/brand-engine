import { Router, type IRouter } from "express";
import healthRouter from "./health";
import descriptMetaRouter from "./descript/fetch-meta";
import supportDocMetaRouter from "./support-doc/fetch-meta";
import convertCmykRouter from "./convert-cmyk";
import featureRequestRouter from "./feature-request";
import importDocRouter from "./import-doc";
import claudeDesignRouter from "./claude-design";
import brandBrainRouter from "./brand-brain";
const router: IRouter = Router();

router.use(healthRouter);
router.use(descriptMetaRouter);
router.use(supportDocMetaRouter);
router.use(convertCmykRouter);
router.use(featureRequestRouter);
router.use(importDocRouter);
router.use(claudeDesignRouter);
router.use(brandBrainRouter);

export default router;
