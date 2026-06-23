import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import facilitiesRouter from "./facilities";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bookingsRouter);
router.use(facilitiesRouter);

export default router;
