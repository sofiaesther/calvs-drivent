import faker from "@faker-js/faker";
import { prisma } from "@/config";
import { createUser } from "./users-factory";

export async function createBooking(roomId: number, userId?: number) {
    const incomingUser = userId || (await createUser()).id;
    return prisma.booking.create({
      data: {
        userId: incomingUser,
        roomId: roomId
      }
    });
  }