import { Router, type IRouter } from "express";
import healthRouter from "./health";
import postsRouter from "./posts";
import ngosRouter from "./ngos";
import reportsRouter from "./reports";
import metadataRouter from "./metadata";
import adminRouter from "./admin";
import authRouter from "./auth";
import feedbackRouter from "./feedback";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(postsRouter);
router.use(ngosRouter);
router.use(reportsRouter);
router.use(metadataRouter);
router.use(adminRouter);
router.use(feedbackRouter);

export default router;
