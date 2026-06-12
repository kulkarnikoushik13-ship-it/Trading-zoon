import React, { useState, useEffect } from "react";
import { SUPPORTED_INSTRUMENTS, InstrumentConfig } from "../types";
import { Calculator, Percent, ShieldAlert, DollarSign, HelpCircle, Layers, ArrowRight } from "lucide-react";

export default function CalculatorsTab({ instruments = SUPPORTED_INSTRUMENTS }: { instruments?: InstrumentConfig[] }) {
  // Instrument selection
  const [selectedSymbol, setSelectedSymbol] = useState<string>("XAUUSD");
  const activeInstrument =
    instruments.find((inst) => inst.symbol === selectedSymbol) || instruments[0] || SUPPORTED_INSTRUMENTS[0];

  // 1. MARGIN CALCULATOR STATES
  const [marginAccountBalance, setMarginAccountBalance] = useState("10000");
  const [marginLeverage, setMarginLeverage] = useState("100");
  const [marginLots, setMarginLots] = useState("1.0");
  const [currentPrice, setCurrentPrice] = useState("2350"); // Gold price default

  // 2. RISK LOT SIZE CALCULATOR STATES
  const [riskAccountBalance, setRiskAccountBalance] = useState("10000");
  const [riskPercentage, setRiskPercentage] = useState("1.0"); // 1% risk
  const [riskAmountUsd, setRiskAmountUsd] = useState("100"); // $100 default
  const [stopLossInPips, setStopLossInPips] = useState("40"); // 40 pips/points SL

  // Lock risk value calculations between % and USD amount
  const handleRiskPercentageChange = (pctStr: string) => {
    setRiskPercentage(pctStr);
    const pct = parseFloat(pctStr);
    const bal = parseFloat(riskAccountBalance);
    if (!isNaN(pct) && !isNaN(bal)) {
      setRiskAmountUsd(((bal * pct) / 100).toFixed(2));
    }
  };

  const handleRiskAmountChange = (usdStr: string) => {
    setRiskAmountUsd(usdStr);
    const usd = parseFloat(usdStr);
    const bal = parseFloat(riskAccountBalance);
    if (!isNaN(usd) && !isNaN(bal) && bal > 0) {
      setRiskPercentage(((usd / bal) * 100).toFixed(2));
    }
  };

  const handleRiskBalanceChange = (balStr: string) => {
    setRiskAccountBalance(balStr);
    const bal = parseFloat(balStr);
    const pct = parseFloat(riskPercentage);
    if (!isNaN(bal) && !isNaN(pct)) {
      setRiskAmountUsd(((bal * pct) / 100).toFixed(2));
    }
  };

  // Adjust defaults when the active instrument changes
  useEffect(() => {
    if (activeInstrument.symbol === "XAUUSD") {
      setCurrentPrice("2350");
      setStopLossInPips("50"); // $5.00 stop loss range
    } else if (activeInstrument.type === "forex") {
      if (activeInstrument.symbol === "USDJPY") {
        setCurrentPrice("155.50");
        setStopLossInPips("30");
      } else {
        setCurrentPrice("1.0850");
        setStopLossInPips("25");
      }
    } else if (activeInstrument.type === "crypto") {
      setCurrentPrice("67000");
      setStopLossInPips("500");
    } else if (activeInstrument.type === "indices") {
      setCurrentPrice("38500");
      setStopLossInPips("100");
    }
  }, [selectedSymbol]);

  // Calculations: REQUIRED MARGIN
  const requiredMarginResult = (() => {
    const balance = parseFloat(marginAccountBalance);
    const lev = parseFloat(marginLeverage);
    const lots = parseFloat(marginLots);
    const price = parseFloat(currentPrice);

    if (isNaN(balance) || isNaN(lev) || isNaN(lots) || isNaN(price) || lev <= 0 || lots <= 0) {
      return 0;
    }

    // Formula: Required Margin = (Lot Size * Contract Size * Market Price) / Leverage
    // In some broker calculation systems (e.g., standard metal / crypto USD pairs):
    // gold 1 lot = 100 contracts. margin = (1 * 100 * 2350) / 100 = $2350.
    // Forex standard lot works on base currency (e.g. 1 lot EURUSD = 100,000 EUR base).
    // margin in USD = (lots * 100,000 * pricing) / leverage
    const marginUSD = (lots * activeInstrument.contractSize * price) / lev;
    return marginUSD;
  })();

  // Calculations: RECOMMENDED LOT SIZE
  const riskCalculationResult = (() => {
    const usdToRisk = parseFloat(riskAmountUsd);
    const slUnits = parseFloat(stopLossInPips);
    const price = parseFloat(currentPrice);

    if (isNaN(usdToRisk) || isNaN(slUnits) || isNaN(price) || usdToRisk <= 0 || slUnits <= 0) {
      return { lotSize: 0, totalContracts: 0, pipValueUSD: 0 };
    }

    // Calculated based on instrument category:
    // Pip Value per standard lot = Contract Size * Pip Size
    // For forex e.g. EURUSD: Contract=100,000, PipSize=0.0001, PipValue = $10.00
    // For gold e.g. Gold: contract=100, pipsize=0.1. A points change of 1.0 (10 pip units)
    // results in $100 risk.
    let pipValuePerLot = activeInstrument.contractSize * activeInstrument.pipSize;

    // Adjust for quote-rate conversions if counter currency is yen (USDJPY)
    if (activeInstrument.symbol === "USDJPY") {
      // 100,000 * 0.01 = 1000 JPY per pip. Convert to USD = 1000 / JPYUSD rate (currentPrice = 155.5)
      pipValuePerLot = 1000 / price;
    }

    const recommendedLotSize = usdToRisk / (slUnits * pipValuePerLot);
    return {
      lotSize: isFinite(recommendedLotSize) && recommendedLotSize > 0 ? recommendedLotSize : 0,
      totalContracts: recommendedLotSize * activeInstrument.contractSize,
      pipValueUSD: pipValuePerLot,
    };
  })();

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-card border border-brand-border p-6 rounded-lg">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text font-sans sm:text-2xl flex items-center gap-2">
            <Calculator className="text-brand-teal stroke-[2]" size={24} />
            Quant Trade Calculators
          </h2>
          <p className="text-sm text-brand-text-muted">
            Precision margin requirements and strict dollar-risk management algorithms.
          </p>
        </div>
      </div>

      {/* SYMBOL / INSTRUMENT SPECIFICATION ZONE */}
      <div className="bg-brand-card border border-brand-border p-5 rounded">
        <div className="max-w-md">
          <label className="block text-xs font-mono text-brand-text-muted uppercase mb-2">
            Select Active Instrument Specifications:
          </label>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="w-full bg-brand-nested border border-brand-border rounded p-3 text-brand-text font-sans text-sm focus:outline-none focus:border-brand-teal cursor-pointer hover:bg-[#0B0E11]/80 transition"
          >
            {instruments.map((inst) => (
              <option key={inst.symbol} value={inst.symbol}>
                {inst.name} ({inst.symbol}) [{inst.type.toUpperCase()}]
              </option>
            ))}
          </select>

          {/* Render Active spec stats */}
          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-brand-border text-[11px] font-mono text-brand-text-muted">
            <div>
              <span>Contract Size: </span>
              <span className="text-brand-text font-bold">{activeInstrument.contractSize.toLocaleString()}</span>
            </div>
            <div>
              <span>Standard Pip Size: </span>
              <span className="text-brand-text font-bold">{activeInstrument.pipSize}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TWO SEPARATE CALCULATORS SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* 1. REQUIRED MARGIN CALCULATOR */}
        <div className="bg-brand-card border border-brand-border p-6 rounded flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-brand-border pb-3">
              <h3 className="font-sans font-medium text-brand-text text-base">Margin Obligation Calculator</h3>
              <p className="text-xs text-brand-text-muted">
                Determine the precise buying power/margin requirements needed to facilitate your position.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">Leverage Value</label>
                <select
                  value={marginLeverage}
                  onChange={(e) => setMarginLeverage(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal cursor-pointer"
                >
                  <option value="1">1:1 (No Leverage)</option>
                  <option value="10">1:10</option>
                  <option value="25">1:25</option>
                  <option value="50">1:50</option>
                  <option value="100">1:100 (Standard)</option>
                  <option value="200">1:200</option>
                  <option value="500">1:500 (Extreme)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                  Position Size (Lot units)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={marginLots}
                  onChange={(e) => setMarginLots(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text font-mono focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                  Adjust market price for calculation ($ Quote)
                </label>
                <input
                  type="number"
                  step="any"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text font-mono focus:outline-none focus:border-brand-teal"
                />
              </div>
            </div>
          </div>

          {/* Margin Results Box */}
          <div className="bg-brand-nested rounded p-4 mt-6 border border-brand-border flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">
                Required Collateral Margin
              </span>
              <h4 className="text-3xl font-bold font-mono text-brand-green tracking-tight mt-1">
                ${requiredMarginResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>

            <div className="text-[10px] font-sans text-brand-text-muted space-y-1">
              <p>Formula: (Lot Size * Contract Size * Market Price) / Leverage</p>
              <p className="font-mono text-brand-text-muted/60">
                ({marginLots} lots * {activeInstrument.contractSize.toLocaleString()} contr. * ${currentPrice}) / {marginLeverage}x
              </p>
            </div>
          </div>
        </div>

        {/* 2. RISK-BASED POSITION SIZE CALCULATOR */}
        <div className="bg-brand-card border border-brand-border p-6 rounded flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-brand-border pb-3">
              <h3 className="font-sans font-medium text-brand-text text-base">Risk-Engine Position Sizer</h3>
              <p className="text-xs text-brand-text-muted">
                Strict lot allocation. Enter stop-loss to calculate size aligning with dollar limits.
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Trading Balance
                  </label>
                  <input
                    type="number"
                    value={riskAccountBalance}
                    onChange={(e) => handleRiskBalanceChange(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text font-mono focus:outline-none focus:border-brand-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                    Tolerance Risk %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={riskPercentage}
                    onChange={(e) => handleRiskPercentageChange(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text font-mono focus:outline-none focus:border-brand-teal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                  Strict Risk allocation ($ USD)
                </label>
                <input
                  type="number"
                  value={riskAmountUsd}
                  onChange={(e) => handleRiskAmountChange(e.target.value)}
                  className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text font-mono focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-brand-text-muted uppercase mb-1">
                  Stop Loss distance ({activeInstrument.type === "forex" ? "Pips" : "Price Points"})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={stopLossInPips}
                    onChange={(e) => setStopLossInPips(e.target.value)}
                    className="w-full bg-brand-nested border border-brand-border rounded p-2 text-xs text-brand-text font-mono focus:outline-none focus:border-brand-teal"
                  />
                  <span className="absolute right-3 top-2 text-[9px] font-mono text-brand-text-muted bg-[#0B0E11] border border-brand-border px-1.5 py-0.5 rounded">
                    {activeInstrument.type === "forex" ? "Pips" : "Pts"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Position Sizer Results Box */}
          <div className="bg-brand-nested rounded p-4 mt-6 border border-brand-border flex flex-col justify-between gap-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-mono text-brand-text-muted uppercase tracking-widest block">
                  Recommended Position Size
                </span>
                <h4 className="text-3xl font-bold font-mono text-brand-green tracking-tight mt-1">
                  {riskCalculationResult.lotSize.toFixed(2)}{" "}
                  <span className="text-brand-text-muted text-sm">Lots</span>
                </h4>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-mono text-brand-text-muted uppercase block">Pip / point value</span>
                <span className="text-xs font-mono text-[#EAECEF]">
                  ${riskCalculationResult.pipValueUSD.toFixed(2)} / standard lot
                </span>
              </div>
            </div>

            <div className="text-[10px] font-sans text-brand-text-muted border-t border-brand-border pt-2 flex items-center justify-between">
              <span>Risk Margin: ${parseFloat(riskAmountUsd).toLocaleString()} allocation</span>
              <span className="font-mono text-brand-text-muted/60">
                ~{(riskCalculationResult.totalContracts).toLocaleString(undefined, { maximumFractionDigits: 1 })} base units
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
