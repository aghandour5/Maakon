import { Router, type IRouter } from "express";
import healthRouter from "./health";
import postsRouter from "./posts";
import ngosRouter from "./ngos";
import reportsRouter from "./reports";
import metadataRouter from "./metadata";

const router: IRouter = Router();

router.use(healthRouter);
router.use(postsRouter);
router.use(ngosRouter);
router.use(reportsRouter);
router.use(metadataRouter);

export default router;
