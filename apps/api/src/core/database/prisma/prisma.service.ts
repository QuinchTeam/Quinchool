import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "../../config/env";
import { PrismaClient } from "../../../generated/prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Prisma 7 reads the database URL from the driver adapter.
    super({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
  }

  // Connect at startup so an unreachable database fails boot.
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
