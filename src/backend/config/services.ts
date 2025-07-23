import { AuthService } from "../services/authservice";
import { FinancialService } from "../services/financialservice";
import { HoldingService } from "../services/holdingservice";
import { PortfolioService } from "../services/portfolioservice";

const portfolioService = new PortfolioService();
const authService = new AuthService();
const financialService = new FinancialService(portfolioService);
const holdingService = new HoldingService(portfolioService, financialService);

export const services = {
  portfolio: portfolioService,
  auth: authService,
  holding: holdingService,
  financial: financialService,
};
