import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "../config/env";
import { PrismaClient } from "../generated/prisma/client";

/**
 * The Prisma client as a Nest provider. Extending it means every model is
 * reachable straight off the injected service (`prisma.user.findMany()`), which
 * is what the rest of the app codes against.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Prisma 7 takes the connection string from a driver adapter rather than
    // from schema.prisma, which is why the schema's datasource has no url.
    super({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
  }

  /** Connects at boot so an unreachable database fails startup, not a request. */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
