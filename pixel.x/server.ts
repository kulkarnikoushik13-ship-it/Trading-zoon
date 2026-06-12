import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Parse JSON bodies
app.use(express.json());

// Initialize Gemini SDK with telemetry header as rules instruct
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to invoke Gemini with automatic model fallback and retries to safeguard against 503 errors and high load.
async function generateContentWithRetryAndFallback(prompt: string, config: any) {
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of models) {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini API] Querying model="${model}", attempt=${attempt}/${maxAttempts}`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        if (response && response.text) {
          console.log(`[Gemini API] Successfully generated content using model="${model}"`);
          return response;
        }
        throw new Error(`Empty response returned from model "${model}".`);
      } catch (err: any) {
        lastError = err;
        console.warn(
          `[Gemini API] Error on model="${model}", attempt=${attempt} of ${maxAttempts}:`,
          err.message || err
        );

        // If the error is a definitive client/validation error (e.g. 400), don't retry or swap models.
        if (
          err.status === 400 ||
          err.statusCode === 400 ||
          (err.message && err.message.includes("400"))
        ) {
          throw err;
        }

        // Wait before retrying under the same model
        if (attempt < maxAttempts) {
          const backoffTime = 1500 * attempt;
          console.log(`[Gemini API] Waiting ${backoffTime}ms before retrying model="${model}"...`);
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        }
      }
    }
    console.log(`[Gemini API] Primary/active model attempts exhausted for "${model}". Trying next available model fallback...`);
  }

  throw lastError || new Error("All generative model attempts and fallbacks were exhausted.");
}

// 1. AI TRADE ANALYSIS ROUTE
app.post("/api/analyze-trade", async (req, res) => {
  const {
    instrument,
    account,
    entryPrice,
    exitPrice,
    stopLoss,
    takeProfit,
    lotSize,
    result,
    profitLoss,
    strategyReasoning,
  } = req.body;

  if (!instrument || !entryPrice || !exitPrice) {
    return res.status(400).json({ error: "Missing required trade details." });
  }

  try {
    const prompt = `
      Please analyze this trading transaction as a professional trading coach.
      
      Trade Details:
      - Instrument: ${instrument}
      - Account/Broker Name: ${account || "Standard Account"}
      - Entry Price: ${entryPrice}
      - Exit Price: ${exitPrice}
      - Stop Loss (SL): ${stopLoss || "Not set"}
      - Take Profit (TP): ${takeProfit || "Not set"}
      - Lot Size: ${lotSize || "Not specified"}
      - Outcome: ${result}
      - Profit/Loss amount: $${profitLoss}
      - User's strategy reasoning & rules followed: ${strategyReasoning || "No strategy notes provided."}

      Provide professional feedback in structured JSON format with:
      - "pros": A list of short, concrete things the trader did well (risk limits, using SL/TP, clarity of instrument, following psychology, logical strategy).
      - "cons": A list of concrete mistakes or risk elements (lack of stop loss, excessive size, bad risk-reward ratio, FOMO trap, emotional trade, exit timing).
      - "feedback": A thorough coaching summary analyzing the trade's alignment with professional discipline, key learnings, and actionable tips to improve.
    `;

    const response = await generateContentWithRetryAndFallback(prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["pros", "cons", "feedback"],
        properties: {
          pros: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Positive aspects or disciplined actions observed in this trade.",
          },
          cons: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Mistakes, oversights, or hazardous factors identified in this trade.",
          },
          feedback: {
            type: Type.STRING,
            description: "A comprehensive trading coach feedback summary with actionable advice.",
          },
        },
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("No response text received from Gemini.");
    }

    const resultJson = JSON.parse(textOutput.trim());
    return res.json(resultJson);
  } catch (error: any) {
    console.error("Gemini API trade analysis error:", error);
    return res.status(500).json({
      error: "Failed to analyze trade with AI.",
      details: error.message || error,
    });
  }
});

// 2. LIVE NEWS FEED ROUTE
// Calculates dynamic times based on current date (2026-06-12) to ensure a realistic live feed.
app.get("/api/news", (req, res) => {
  // Mock premium Forex events. If a live API is integrated later, this is where you can fetch from
  // e.g., Finnhub, Alpha Vantage, or an RSS integration.
  const today = new Date("2026-06-12T11:16:25-07:00");

  const makeDateOffset = (hoursOffset: number) => {
    const d = new Date(today.getTime() + hoursOffset * 60 * 60 * 1000);
    return d.toISOString();
  };

  const newsFeed = [
    {
      id: "news_1",
      title: "US Core CPI MoM expected at 0.3% - Key high-impact event for USD indices",
      timestamp: makeDateOffset(1.5), // upcoming in 1.5 hours
      source: "Forex Factory / Macro Desk",
      impact: "HIGH",
      currency: "USD",
      forecast: "0.3%",
      previous: "0.2%",
      details: "High volatility expected across all USD pairs including EURUSD, GBPUSD and Gold (XAUUSD). Position risk reduction is highly advised prior to the release.",
    },
    {
      id: "news_2",
      title: "Gold retests $2,350 support level amid hawkish Fed commentary",
      timestamp: makeDateOffset(-0.5), // 30 mins ago
      source: "Reuters Financial",
      impact: "MEDIUM",
      currency: "XAU",
      details: "XAUUSD is hovering near structural range lows. Analysts indicate that a failure to hold this support could trigger liquidations down to $2,320.",
    },
    {
      id: "news_3",
      title: "UK GDP prints at 0.1% matching market expectations",
      timestamp: makeDateOffset(-2), // 2 hours ago
      source: "Office for National Statistics",
      impact: "MEDIUM",
      currency: "GBP",
      forecast: "0.1%",
      previous: "-0.1%",
      details: "GBP remains highly stable. Yield spreads remain favorable for short-term sterling longs against Euro.",
    },
    {
      id: "news_4",
      title: "BOJ Governor hints at potential policy adjustment in the coming quarter",
      timestamp: makeDateOffset(-4), // 4 hours ago
      source: "Nikkei News",
      impact: "HIGH",
      currency: "JPY",
      details: "High-impact JPY warning. Yen strength surged across cross pairs, driving USDJPY down by 85 pips within minutes of the statement.",
    },
    {
      id: "news_5",
      title: "Crude Oil inventories draw down by 3.2M barrels, higher than forecasted draw",
      timestamp: makeDateOffset(-6), // 6 hours ago
      source: "EIA Report",
      impact: "LOW",
      currency: "CAD",
      forecast: "-1.5M",
      previous: "+1.1M",
      details: "Mild bullish pressure observed in USDCAD as oil prices hover steadily around $78.20/bbl.",
    },
    {
      id: "news_6",
      title: "ECB Interest Rate Decision: Main refinancing rate held constant at 4.25%",
      timestamp: makeDateOffset(-8), // 8 hours ago
      source: "European Central Bank",
      impact: "HIGH",
      currency: "EUR",
      forecast: "4.25%",
      previous: "4.25%",
      details: "President Lagarde emphasized data-dependent forward guidance. Euro saw structural whipsaw but remains within high-timeframe channels.",
    }
  ];

  res.json({ news: newsFeed });
});

// Configure Vite middleware in development or serve built files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
