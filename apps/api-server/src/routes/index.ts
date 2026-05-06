import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import workoutsRouter from "./workouts";
import nutritionRouter from "./nutrition";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(workoutsRouter);
router.use(nutritionRouter);
router.use(statsRouter);

export default router;
