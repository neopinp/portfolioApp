import { AuthService } from "../services/authservice";
import { HoldingService } from "../services/holdingservice";
import { PortfolioService } from "../services/portfolioservice";

const portfolioService = new PortfolioService();
const authService = new AuthService();
const holdingService = new HoldingService(portfolioService);

export const services = {
  portfolio: portfolioService,
  auth: authService,
  holding: holdingService,
};
