import React, { createContext, useContext, useState, useEffect } from "react";
import { Portfolio } from "../types";
import { storage, STORAGE_KEYS } from "../utils/storage";

interface PortfolioContextType {
  selectedPortfolio: Portfolio | null;
  setSelectedPortfolio: (portfolio: Portfolio | null) => void;
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

  // Load the selected portfolio from storage on mount
  useEffect(() => {
    const loadSelectedPortfolio = async () => {
      try {
        const storedPortfolio = await storage.getItem<Portfolio>(
          SELECTED_PORTFOLIO_KEY
        );
        console.log("Loaded portfolio from storage:", storedPortfolio?.id, storedPortfolio?.name);
        if (storedPortfolio) {
          setSelectedPortfolioState(storedPortfolio);
          console.log("Set portfolio from storage:", storedPortfolio.id);
        } else {
          console.log("No portfolio found in storage");
        }
      } catch (error) {
        console.error("Error loading selected portfolio:", error);
      }
    };

    loadSelectedPortfolio();
  }, []);

  // Save the selected portfolio to storage when it changes
  const setSelectedPortfolio = async (portfolio: Portfolio | null) => {
    console.log("Setting selected portfolio:", portfolio?.id, portfolio?.name);
    setSelectedPortfolioState(portfolio);
    try {
      if (portfolio) {
        await storage.setItem(SELECTED_PORTFOLIO_KEY, portfolio);
        console.log("Saved portfolio to storage:", portfolio.id);
      } else {
        await storage.removeItem(SELECTED_PORTFOLIO_KEY);
        console.log("Removed portfolio from storage");
      }
    } catch (error) {
      console.error("Error saving selected portfolio:", error);
    }
  };

  return (
    <PortfolioContext.Provider
      value={{ selectedPortfolio, setSelectedPortfolio }}
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
