import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";
import {  } from "@/controllers";

const bookingRouter = Router();

bookingRouter
  .get("", authenticateToken, )
  .put("/:bookingId", authenticateToken, )
  .post("", authenticateToken, );

export { bookingRouter };