import { Request, Response } from "express";
import { container } from "tsyringe";

import { CreateTransferUseCase } from "./CreateTransferUseCase";

class CreateTransferController {
   async handle(request: Request, response: Response) {
      const { user_id: receiverId } = request.params;
      const { amount, description } = request.body;

      const createTransferUseCase = container.resolve(CreateTransferUseCase);

      await createTransferUseCase.execute({
         amount,
         description,
         receiverId,
         senderId: request.user.id,
      });

      return response.status(201).send("transfer successful")
   }
}

export { CreateTransferController };