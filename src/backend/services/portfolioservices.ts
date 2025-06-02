import { PrismaClient, users } from "@prisma/client";
import { Portfolio, Holding } from "../types/portfolio";
import { UserCredentials } from "../types/auth";

export class PortfolioService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }
}
