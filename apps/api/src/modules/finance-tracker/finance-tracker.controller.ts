import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SessionGuard, UserId } from "../../core/auth/session.guard";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import {
  financeIdSchema,
  type LabelQuery,
  labelQuerySchema,
  type TransactionInput,
  type TransactionQuery,
  transactionQuerySchema,
  transactionSchema,
  type WalletInput,
  type WalletOrder,
  walletOrderSchema,
  walletSchema,
} from "./finance-tracker.contract";
import { FinanceTrackerService } from "./finance-tracker.service";

@Controller("finance-tracker")
@UseGuards(SessionGuard)
export class FinanceTrackerController {
  constructor(private readonly finance: FinanceTrackerService) {}

  @Get()
  getOverview(@UserId() userId: string) {
    return this.finance.getOverview(userId);
  }

  @Post("wallets")
  createWallet(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(walletSchema)) input: WalletInput,
  ) {
    return this.finance.createWallet(userId, input);
  }

  @Put("wallets/order")
  @HttpCode(204)
  reorderWallets(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(walletOrderSchema)) input: WalletOrder,
  ) {
    return this.finance.reorderWallets(userId, input.ids);
  }

  @Put("wallets/:id")
  updateWallet(
    @UserId() userId: string,
    @Param("id", new ZodValidationPipe(financeIdSchema)) id: string,
    @Body(new ZodValidationPipe(walletSchema)) input: WalletInput,
  ) {
    return this.finance.updateWallet(userId, id, input);
  }

  @Delete("wallets/:id")
  @HttpCode(204)
  deleteWallet(
    @UserId() userId: string,
    @Param("id", new ZodValidationPipe(financeIdSchema)) id: string,
  ) {
    return this.finance.deleteWallet(userId, id);
  }

  @Get("transactions")
  listTransactions(
    @UserId() userId: string,
    @Query(new ZodValidationPipe(transactionQuerySchema)) query: TransactionQuery,
  ) {
    return this.finance.listTransactions(userId, query);
  }

  @Post("transactions")
  createTransaction(
    @UserId() userId: string,
    @Body(new ZodValidationPipe(transactionSchema)) input: TransactionInput,
  ) {
    return this.finance.saveTransaction(userId, input);
  }

  @Put("transactions/:id")
  updateTransaction(
    @UserId() userId: string,
    @Param("id", new ZodValidationPipe(financeIdSchema)) id: string,
    @Body(new ZodValidationPipe(transactionSchema)) input: TransactionInput,
  ) {
    return this.finance.saveTransaction(userId, input, id);
  }

  @Delete("transactions/:id")
  @HttpCode(204)
  deleteTransaction(
    @UserId() userId: string,
    @Param("id", new ZodValidationPipe(financeIdSchema)) id: string,
  ) {
    return this.finance.deleteTransaction(userId, id);
  }

  @Get("labels")
  listLabels(
    @UserId() userId: string,
    @Query(new ZodValidationPipe(labelQuerySchema)) query: LabelQuery,
  ) {
    return this.finance.listLabels(userId, query);
  }
}
