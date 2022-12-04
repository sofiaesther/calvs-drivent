import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { getBooking, postBooking, putBooking } from "@/controllers/booking-controller";

const bookingRouter = Router();

bookingRouter
  .get("", authenticateToken, getBooking )
  .put("/:bookingId", authenticateToken, putBooking )
  .post("", authenticateToken,postBooking );

export { bookingRouter };