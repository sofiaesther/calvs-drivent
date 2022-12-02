import { prisma } from "@/config";
import { Booking } from "@prisma/client";
import bookingRepository from'@/repositories/booking-repository';
import { notFoundError } from "@/errors";
import { exclude } from "@/utils/prisma-utils";

async function findBookingByUserId(userId: number) {
    const booking = bookingRepository.findBookingByUserId(userId);
    if (!booking) {
        throw notFoundError();
      }
      return booking;
  }

const bookingService = {
    findBookingByUserId
  };
  
  export default bookingService;