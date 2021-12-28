import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuidV4 } from "uuid";

import { app } from "../../../../app";

let connection: Connection;

describe("AuthenticateUserController", () => {
   beforeAll(async () => {
      connection = await createConnection();
      await connection.runMigrations();

      const id = uuidV4();
      const password = await hash("fake", 8);

      await connection.query(
         `INSERT INTO USERS(id, name, email, password, created_at, updated_at)
      values('${id}', 'fake', 'fake@fake.com', '${password}', 'now()', 'now()')`
      );
   });

   afterAll(async () => {
      await connection.dropDatabase();
      await connection.close();
   });

   it("should be able to authenticate", async () => {
      const response = await request(app)
         .post("/api/v1/sessions")
         .send({
            email: "fake@fake.com",
            password: "fake",
         });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
   });

   it("should not be able to authenticate with invalid password", async () => {
      const response = await request(app)
         .post("/api/v1/sessions")
         .send({
            email: "fake@fake.com",
            password: "invalid-password",
         });

      expect(response.status).toBe(401);
   });

   it("should not be able to authenticate with invalid email", async () => {
      const response = await request(app)
         .post("/api/v1/sessions")
         .send({
            email: "invalid@email.com",
            password: "fake",
         });

      expect(response.status).toBe(401);
   });
});