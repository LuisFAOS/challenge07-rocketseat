import request from "supertest";
import { Connection, createConnection } from "typeorm";

import { app } from "../../../../app";

let connection: Connection;

describe("CreateUserController", () => {
   beforeAll(async () => {
      connection = await createConnection();
      await connection.runMigrations();
   });

   afterAll(async () => {
      await connection.dropDatabase();
      await connection.close();
   });

   it("should be able to create an user", async () => {
      const response = await request(app)
         .post("/api/v1/users/")
         .send({
            name: "test",
            email: "test@test.com",
            password: "123test",
         });

      expect(response.status).toBe(201);
   });
});