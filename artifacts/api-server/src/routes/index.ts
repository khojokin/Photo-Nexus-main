import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import photosRouter from "./photos";
import collectionsRouter from "./collections";
import tagsRouter from "./tags";
import statsRouter from "./stats";
import commentsRouter from "./comments";
import notificationsRouter from "./notifications";
import messagesRouter from "./messages";
import followsRouter from "./follows";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(photosRouter);
router.use(collectionsRouter);
router.use(tagsRouter);
router.use(statsRouter);
router.use(commentsRouter);
router.use(notificationsRouter);
router.use(messagesRouter);
router.use(followsRouter);
router.use(uploadRouter);

export default router;
