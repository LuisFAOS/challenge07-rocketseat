import { hash } from "bcryptjs";
import request from "supertest";
import { Connection, createConnection } from "typeorm";
import { v4 as uuidV4 } from "uuid";

import { app } from "../../../../app";

let connection: Connection;

describe("ShowUserProfileController", () => {
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

   it("should be able to show the user profile", async () => {
      const responseToAuth = await request(app).post("/api/v1/sessions").send({
         email: "fake@fake.com",
         password: "fake",
      });

      const { token } = responseToAuth.body;

      const response = await request(app)
         .get("/api/v1/profile/")
         .send()
         .set({
            Authorization: `Bearer ${token}`,
         });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("fake");
      expect(response.body.email).toBe("fake@fake.com");
   });
});