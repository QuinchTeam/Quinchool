import { Global, Module } from "@nestjs/common";

import { PrismaService } from "./prisma.service";

/**
 * Global so feature modules can inject PrismaService without each one importing
 * this module. Database access is the one dependency every feature shares.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
