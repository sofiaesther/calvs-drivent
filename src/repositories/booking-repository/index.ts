import { prisma } from "@/config";
import { Booking } from "@prisma/client";

async function findBookingByUserId(userId: number) {
    return prisma.booking.findFirst({
      where: { userId: userId },
      include: {
        Room: true
      }
    });
  }
  async function findBookingsByRoomId(roomId: number) {
    return prisma.booking.findMany({
      where: { roomId: roomId }
    });
  }
  async function findRoomById(roomId: number) {
    return prisma.room.findFirst({
      where: { id: roomId }
    });
  };


  async function upsertBooking( 
    bookingId: number,
    createdBooking: CreateBookingParams,
    updatedBooking: UpdateBookingParams,
  ) {
    return prisma.booking.upsert({
            where:{
                id: bookingId || 0
            },
            create: createdBooking,
            update:  updatedBooking     
    });
  }

  export type CreateBookingParams = Omit<Booking, "id" | "createdAt" | "updatedAt">;
  export type UpdateBookingParams = Omit<CreateBookingParams, "userId">;
  

const bookingRepository = {
     findBookingByUserId,
     upsertBooking,
     findBookingsByRoomId,
     findRoomById
  };
  
  export default bookingRepository;