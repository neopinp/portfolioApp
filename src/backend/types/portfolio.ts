import { Decimal } from '@prisma/client/runtime/library';

export interface CreatePortfolioDto {
    name: string;
    starting_balance: number;
    risk_score: number;
}

export interface AddHoldingDto {
    symbol: string;
    amount: number;
    boughtAtPrice: number;
}

export interface Portfolio {
    id: number;
    userId: number;
    name: string;
    created_at: Date;
    starting_balance: Decimal;
    risk_score: number;
    holdings: Holding[];
}

export interface Holding {
    id: number;
    portfolioId: number;
    assetSymbol: string;
    amount: Decimal;
    boughtAtPrice: Decimal;
    createdAt: Date;
}

export interface Asset {
    symbol: string;
    name: string | null;
    sector: string | null;
    beta: Decimal | null;
    riskRating: Decimal | null;
    lastUpdated: Date | null;
    type: string;
} 