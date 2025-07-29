-- CreateTable
CREATE TABLE "portfolio_historical_performance" (
    "id" SERIAL NOT NULL,
    "portfolio_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "total_value" DECIMAL NOT NULL,
    "holdings_data" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_historical_performance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_historical_performance_portfolio_id_date_key" ON "portfolio_historical_performance"("portfolio_id", "date");

-- AddForeignKey
ALTER TABLE "portfolio_historical_performance" ADD CONSTRAINT "portfolio_historical_performance_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
