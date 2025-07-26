import { AuthService } from "../services/authservice";
import { HoldingService } from "../services/holdingservice";
import { PortfolioService } from "../services/portfolioservice";
import { FinancialApiService } from "../services/financialApi";

const portfolioService = new PortfolioService();
const authService = new AuthService();
const financialApiService = new FinancialApiService();
const holdingService = new HoldingService(portfolioService, financialApiService);

// Controllers use only
export const services = {
  portfolio: portfolioService,
  auth: authService,
  holding: holdingService,
  financial: financialApiService,
};
