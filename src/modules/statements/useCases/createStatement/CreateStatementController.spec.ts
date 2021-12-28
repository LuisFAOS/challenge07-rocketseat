import { Connection, createConnection } from "typeorm"
import request from "supertest"
import { v4 as uuidV4 } from "uuid"
import { hash } from "bcryptjs"
import { app } from "../../../../app"

let connection: Connection

describe("CREATE STATEMENT CONTROLLER", () => {
   beforeAll(async () => {
      connection = await createConnection()
      await connection.runMigrations()

      const id = uuidV4();
      const password = await hash("fake", 8);

      await connection.query(
         `INSERT INTO USERS(id, name, email, password, created_at, updated_at)
         values('${id}', 'fake', 'fake@fake.com', '${password}', 'now()', 'now()')`
      );
   })

   afterAll(async () => {
      await connection.dropDatabase()
      await connection.close()
   })

   it("should be able to create statement (deposit)", async () => {
      const responseToAuth = await request(app)
         .post("/api/v1/sessions")
         .send({
            email: "fake@fake.com",
            password: "fake",
         });

      const { token } = responseToAuth.body;

      const responseToCreateStatement = await request(app)
         .post("/api/v1/statements/deposit")
         .send({
            amount: 50,
            description: "monthly deposit",
         })
         .set({
            Authorization: `Bearer ${token}`,
         });

      expect(responseToCreateStatement.status).toBe(201);
      expect(responseToCreateStatement.body).toHaveProperty("id");
      expect(responseToCreateStatement.body.amount).toEqual(50);
   });

   it("should be able to create statement (withdraw)", async () => {
      const responseToAuth = await request(app).post("/api/v1/sessions").send({
         email: "fake@fake.com",
         password: "fake",
      });

      const { token } = responseToAuth.body;

      await request(app)
         .post("/api/v1/statements/deposit")
         .send({
            amount: 50,
            description: "monthly deposit",
         })
         .set({
            Authorization: `Bearer ${token}`,
         });

      const responseToCreateStatement = await request(app)
         .post("/api/v1/statements/withdraw")
         .send({
            amount: 25,
            description: "Withdraw to pay bills",
         })
         .set({
            Authorization: `Bearer ${token}`,
         });

      expect(responseToCreateStatement.status).toBe(201);
      expect(responseToCreateStatement.body).toHaveProperty("id");
      expect(responseToCreateStatement.body.amount).toBe(25);
   });

   it("should not be possible to withdraw more than your balance", async () => {
      const responseToAuth = await request(app)
         .post("/api/v1/sessions")
         .send({
            email: "fake@fake.com",
            password: "fake",
         });

      const { token } = responseToAuth.body;

      const responseToCreateStatement = await request(app)
         .post("/api/v1/statements/withdraw")
         .send({
            amount: 150,
            description: "Withdraw test",
         })
         .set({
            Authorization: `Bearer ${token}`,
         });

      expect(responseToCreateStatement.status).toBe(400);
   });
})
