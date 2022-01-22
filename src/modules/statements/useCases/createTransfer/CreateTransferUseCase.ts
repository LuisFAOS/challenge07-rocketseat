import { container, inject, injectable } from "tsyringe";

import { AppError } from "../../../../shared/errors/AppError";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { OperationType } from "../../entities/Statement";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";

interface IRequest {
  receiverId: string;
  senderId: string;
  amount: number;
  description: string;
}

@injectable()
class CreateTransferUseCase {
  constructor(
    @inject("UsersRepository")
    private usersRepository: IUsersRepository
  ) {}

  async execute({
    receiverId,
    senderId,
    amount,
    description,
  }: IRequest): Promise<void> {
    if (amount <= 0) throw new AppError("amount must be greater than 0");

    const receiver = await this.usersRepository.findById(receiverId);
    if (!receiver) throw new AppError("receiver was not found");

    const sender = await this.usersRepository.findById(senderId);

    if (!sender) throw new AppError("sender was not found")

    const createStatementUseCase = container.resolve(CreateStatementUseCase);

    await createStatementUseCase.execute({
      amount: amount * -1,
      description,
      type: OperationType.TRANSFER,
      user_id: sender.id as string,
    });

    await createStatementUseCase.execute({
      amount,
      description,
      type: OperationType.TRANSFER,
      user_id: receiver.id as string,
    });
  }
}

export { CreateTransferUseCase };
