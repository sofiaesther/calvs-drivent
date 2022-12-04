import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/booking-service";
import { Request, Response } from "express";
import httpStatus from "http-status";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
  
    try {
      const booking = await bookingService.findBookingByUserId(userId);
  
      return res.status(httpStatus.OK).send(booking);
    } catch (error) {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
  }

  export async function postBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const { roomId } = req.body;
  
    try {
      await bookingService.aptToBook(userId);
      await bookingService.validRoom(roomId);
      const booking = await bookingService.upsertBookingByUserId(userId,roomId);
      
      const bookingId= {bookingId: booking.id};

      return res.status(httpStatus.OK).send(bookingId);
    } catch (error) {
          if (error.name === "ForbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
  }

  export async function putBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const { roomId } = req.body;
    const bookingId = req.params.bookingId;
  
    try {
      await bookingService.aptToBook(userId);
      await bookingService.validRoom(roomId);
      await bookingService.hasBooking(userId,parseInt(bookingId));
      const booking = await bookingService.upsertBookingByUserId(userId,roomId,parseInt(bookingId));
      
      const newBookingId = {bookingId: booking.id};

      return res.status(httpStatus.OK).send(newBookingId);
    } catch (error) {
          if (error.name === "ForbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
  }
