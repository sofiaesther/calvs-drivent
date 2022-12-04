import app, { init } from "@/app";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import e from "express";
import httpStatus from "http-status";
import { any, number } from "joi";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { createBooking, createEnrollmentWithAddress, createHotel, createPayment, createRoomWithHotelId, createTicket, createTicketTypeRemote, createTicketTypeWithHotel, createUser } from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 if user do not have a booking", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);

        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(httpStatus.NOT_FOUND);
    })

    it("should respond with status 200 and a object including Room", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);

        const createdHotel = await createHotel(); 
        const createdRoom = await createRoomWithHotelId(createdHotel.id);
        const createdBooking = await createBooking(createdRoom.id, user.id);

        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
        expect(response.status).toBe(httpStatus.OK);
        expect(response.body).toEqual({
            "id": createdBooking.id,
            "Room": {
                id: createdRoom.id,
                name: createdRoom.name,
                capacity: createdRoom.capacity,
                hotelId: createdHotel.id
            }
        });
    })
  })
})

describe("POST /booking", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await server.post("/booking");
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      });
    
      it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();
    
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      });
    
      it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      });
    
      describe("when token is valid", () => {
        it("should respond with status 403 if user Ticked is remote or without hotel or not paid", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeRemote();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
            const payment = await createPayment(ticket.id, ticketType.price);
    
            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
            expect(response.status).toBe(httpStatus.FORBIDDEN);
        })
        it("should respond with status 404 if room id not exist", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);

            const body = { roomId: 0 };
    
            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
            expect(response.status).toBe(httpStatus.NOT_FOUND);
        })

        it("should respond with status 403 if no availability", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);
            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);
            const newBooking = await createBooking(room.id);

            const body = { roomId: room.id };


            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);;
            expect(response.status).toBe(httpStatus.FORBIDDEN);
        })
    
        it("should respond with status 200 and BookingId", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);
    
            const createdHotel = await createHotel(); 
            const createdRoom = await createRoomWithHotelId(createdHotel.id);

            const body = { roomId: createdRoom.id };

            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
            
            const result = await prisma.booking.findFirst({
                where:{
                    userId:user.id
                }
            })
            expect(response.status).toBe(httpStatus.OK);
            expect(response.body).toEqual({
                "bookingId": result.id
            });
        })
      })
    })

describe("PUT /booking", () => {
    it("should respond with status 401 if no token is given", async () => {

        const bookingId = 1;
        const response = await server.put(`/booking/${bookingId}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
        });
    
        it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();
            
        const bookingId = 1;
        const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
        });
    
        it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
            
        const bookingId = 1;
        const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
        });
    
        describe("when token is valid", () => {
        it("should respond with status 403 if user Ticked is remote or without hotel or not paid", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeRemote();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
            const payment = await createPayment(ticket.id, ticketType.price);
            
            const bookingId = 1;
            const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`);
            expect(response.status).toBe(httpStatus.FORBIDDEN);
        })
        it("should respond with status 404 if room id not exist", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);

            const body = { roomId: 0 };
            
            const bookingId = 1;
            const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`).send(body);
            expect(response.status).toBe(httpStatus.NOT_FOUND);
        })

        it("should respond with status 403 if no availability", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);
            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);
            const newBooking = await createBooking(room.id);

            const body = { roomId: room.id };

            const bookingId = 1;
            const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`).send(body);;
            expect(response.status).toBe(httpStatus.FORBIDDEN);
        })

        it("should respond with status 403 if user do not have a booking or bookingId is not from user", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);
            const hotel = await createHotel();
            const room = await createRoomWithHotelId(hotel.id);

            const body = { roomId: room.id };
            const bookingId = 0;

            const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`).send(body);
            expect(response.status).toBe(httpStatus.FORBIDDEN);
        })
    
        it("should respond with status 200 and BookingId", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);
    
            const createdHotel = await createHotel(); 
            const createdRoom = await createRoomWithHotelId(createdHotel.id);
            const booking = await createBooking(createdRoom.id,user.id);
            const newRoom = await createRoomWithHotelId(createdHotel.id);

            const body = { roomId: newRoom.id };

            const bookingId = booking.id;
            const response = await server.put(`/booking/${bookingId}`).set("Authorization", `Bearer ${token}`).send(body);

            const result = await prisma.booking.findFirst({
                where:{
                    userId:user.id
                }
            })
            expect(response.status).toBe(httpStatus.OK);
            expect(response.body).toEqual({
                "bookingId": result.id
            });
        })
        })
    })
