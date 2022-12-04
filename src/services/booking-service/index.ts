import { prisma } from "@/config";
import { Booking } from "@prisma/client";
import bookingRepository from'@/repositories/booking-repository';
import { notFoundError, forbiddenError } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";

async function findBookingByUserId(userId: number) {
    const booking = await bookingRepository.findBookingByUserId(userId);

    if (!booking) {
        throw notFoundError();
      }
      const returnBooking: ReturnBooking= {
        id: booking.id,
        Room:{
            id: booking.Room.id,
            name: booking.Room.name,
            capacity: booking.Room.capacity,
            hotelId:booking.Room.hotelId
        }
      }
      return returnBooking;
  }

  type ReturnBooking ={
    id: number,
    Room:{
        id:number,
        name:string,
        capacity: number,
        hotelId:number
    }
  }

async function validRoom(roomId:number) {
    const room = await bookingRepository.findRoomById(roomId);
    if (!room){
        throw notFoundError();
    }
    const bookedRoom = await bookingRepository.findBookingsByRoomId(roomId);
    if (bookedRoom.length >= room.capacity){
        throw forbiddenError();
    }
}

async function upsertBookingByUserId(userId: number, roomId:number, booking?:number) {

    const createBooking = {
        userId:userId,
        roomId:roomId
    }
    const updateBooking ={
        roomId:roomId
    }
    let bookingId:number;
    if(booking){
        bookingId=booking;
    }else{
        bookingId = 0;
    };

    const newBooking = await bookingRepository.upsertBooking(bookingId, createBooking, updateBooking);
    return newBooking;
  }

async function hasBooking(userId:number, bookingId:number) {
    const findBooking = await bookingRepository.findBookingByUserId(userId);
    if (!findBooking || findBooking.id !== bookingId){
        throw forbiddenError();
    }
}
  async function aptToBook(userId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) {
      throw forbiddenError();
    }
    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  
    if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
      throw forbiddenError();
    }
  }
const bookingService = {
    findBookingByUserId,
    upsertBookingByUserId,
    validRoom,
    aptToBook,
    hasBooking
  };
  
  export default bookingService;