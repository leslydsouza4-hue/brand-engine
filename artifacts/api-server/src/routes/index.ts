import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generateImageRouter from "./openai/generate-image";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai", generateImageRouter);

export default router;
