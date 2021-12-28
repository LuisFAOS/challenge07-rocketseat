import { hash } from "bcryptjs"
import { Connection, createConnection } from "typeorm"
import { v4 as uuidV4 } from "uuid"
import request from "supertest"
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

   it("should be able to get balance", async () => {
      const responseToAuth = await request(app).post("/api/v1/sessions").send({
         email: "fake@fake.com",
         password: "fake",
      });

      const { token } = responseToAuth.body;

      const statement1 = await request(app)
         .post("/api/v1/statements/deposit")
         .send({
            amount: 100,
            description: "Deposit test",
         })
         .set({
            Authorization: `Bearer ${token}`,
         });

      const statement2 = await request(app)
         .post("/api/v1/statements/withdraw")
         .send({
            amount: 50,
            description: "Withdraw test",
         })
         .set({
            Authorization: `Bearer ${token}`,
         });

      const response = await request(app)
         .get("/api/v1/statements/balance")
         .send()
         .set({
            Authorization: `Bearer ${token}`,
         });

      expect(response.status).toBe(200);
      expect(response.body.statement[0].id).toBe(statement1.body.id);
      expect(response.body.statement[1].id).toBe(statement2.body.id);
   });
})