import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/booking-service";
import { Request, Response } from "express";
import httpStatus from "http-status";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
  
    try {
      const booking = bookingService.findBookingByUserId(userId);
  
      return res.status(httpStatus.OK).send();
    } catch (error) {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
  }