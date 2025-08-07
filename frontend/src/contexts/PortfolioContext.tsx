import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Portfolio } from "../types";
import { storage, STORAGE_KEYS } from "../utils/storage";

interface PortfolioContextType {
  selectedPortfolio: Portfolio | null;
  setSelectedPortfolio: (portfolio: Portfolio | null) => void;
  getStoredPortfolioId: () => number | null;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(
  undefined
);

const SELECTED_PORTFOLIO_KEY = STORAGE_KEYS.SELECTED_PORTFOLIO;

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedPortfolio, setSelectedPortfolioState] =
    useState<Portfolio | null>(null);
  const storedSelectedPortfolioIdRef = useRef<number | null>(null);

  // Load the selected portfolio ID from storage on mount
  useEffect(() => {
    const loadSelectedPortfolioId = async () => {
      try {
        const storedId = await storage.getItem<number>(
          SELECTED_PORTFOLIO_KEY
        );
        console.log("Loaded portfolio ID from storage:", storedId);
        if (storedId) {
          storedSelectedPortfolioIdRef.current = storedId;
          // Note: We don't set the portfolio state here
          // The actual portfolio object will be loaded in DashboardScreen
        } else {
          console.log("No portfolio ID found in storage");
        }
      } catch (error) {
        console.error("Error loading selected portfolio ID:", error);
      }
    };

    loadSelectedPortfolioId();
  }, []);

  // Save just the portfolio ID to storage when it changes
  const setSelectedPortfolio = async (portfolio: Portfolio | null) => {
    console.log("Setting selected portfolio:", portfolio?.id, portfolio?.name);
    setSelectedPortfolioState(portfolio);
    try {
      if (portfolio) {
        await storage.setItem(SELECTED_PORTFOLIO_KEY, portfolio.id);
        storedSelectedPortfolioIdRef.current = portfolio.id;
        console.log("Saved portfolio ID to storage:", portfolio.id);
      } else {
        await storage.removeItem(SELECTED_PORTFOLIO_KEY);
        storedSelectedPortfolioIdRef.current = null;
        console.log("Removed portfolio ID from storage");
      }
    } catch (error) {
      console.error("Error saving selected portfolio ID:", error);
    }
  };

  // Expose the stored ID through context for use in other components
  const getStoredPortfolioId = () => storedSelectedPortfolioIdRef.current;

  return (
    <PortfolioContext.Provider
      value={{ 
        selectedPortfolio, 
        setSelectedPortfolio,
        getStoredPortfolioId
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};

// Export a way to access the stored ID directly
export const useStoredPortfolioId = (): number | null => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("useStoredPortfolioId must be used within a PortfolioProvider");
  }
  return context.getStoredPortfolioId();
};
