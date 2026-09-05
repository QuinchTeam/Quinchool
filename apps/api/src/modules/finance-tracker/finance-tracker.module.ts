import { Module } from "@nestjs/common";
import { FinanceTrackerController } from "./finance-tracker.controller";
import { FinanceTrackerRepository } from "./finance-tracker.repository";
import { FinanceTrackerService } from "./finance-tracker.service";

@Module({
  controllers: [FinanceTrackerController],
  providers: [FinanceTrackerRepository, FinanceTrackerService],
})
export class FinanceTrackerModule {}
