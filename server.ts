import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// Initialize Gemini Client lazily or gracefully handle missing key
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Database health check endpoint
app.get("/api/db-health", async (_req, res) => {
  try {
    if (!process.env.SQL_HOST) {
      return res.json({ status: "disabled", message: "Cloud SQL environment variables not provisioned yet." });
    }
    const { db } = await import("./src/db/index.ts");
    const { sql } = await import("drizzle-orm");
    await db.execute(sql`SELECT 1`);
    res.json({ status: "connected", message: "Cloud SQL PostgreSQL database connected." });
  } catch (error: any) {
    console.error("Database health check error:", error);
    res.json({ status: "error", message: error.message || "Failed to query database." });
  }
});

// Primary Pattern Analysis Endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { productName, inputMode, manualDesc, indicators, rowCount } = req.body;

    const assetName = productName?.trim() || "Futures / Index Product";

    let promptText = "";

    if (inputMode === "csv" && indicators) {
      promptText = `
You are a senior technical market technician analyzing futures and index products (e.g. Gold, Crude Oil, S&P 500, Nifty 50, Bitcoin).

Perform a technical pattern analysis for "${assetName}" based on the following EXACT calculated technical indicators derived directly from ${rowCount || "recent"} periods of market data:

[CALCULATED DATA]
- Current Close Price: ${indicators.currentPrice}
- 20-Period Moving Average (MA20): ${indicators.ma20 !== null ? indicators.ma20 : "N/A"} (${indicators.ma20DistancePct !== null ? `${indicators.ma20DistancePct}% from current price` : ""})
- 50-Period Moving Average (MA50): ${indicators.ma50 !== null ? indicators.ma50 : "N/A"} (${indicators.ma50DistancePct !== null ? `${indicators.ma50DistancePct}% from current price` : ""})
- 14-Period RSI: ${indicators.rsi14 !== null ? indicators.rsi14 : "N/A"}
- Recent 10-Period High: ${indicators.high10}
- Recent 10-Period Low: ${indicators.low10}
- Recent Price Change: ${indicators.priceChange} (${indicators.priceChangePercent}%)
- Price Trend: ${indicators.trend}
- MA Alignment State: ${indicators.maAlignment}

TASK:
1. Determine an "Implied Call": choose strictly one of "long", "short", or "hold" based on the technical posture.
2. Provide a 1-2 sentence "Rationale" combining the MA alignment, RSI level, and trend structure that led directly to this call. Do NOT invent new numbers; reason strictly over the computed values provided above.
3. Identify all key technical patterns present in this data (e.g., "Golden Cross (MA20 > MA50)", "Bullish MA Stack", "RSI Overbought Territory (>70)", "Approaching Oversold Support", "Tight Consolidation near Highs", "Moving Average Convergence/Divergence", etc.).
4. For EACH pattern, explain in clear, plain language what it typically signals and why professional traders watch it.
5. Provide a clear "Confidence & Caveats" statement: emphasize that technical indicators are probabilistic guides, not predictive crystal balls, and must be weighed alongside macro news, economic events, interest rates, and fundamentals.
6. List actionable "What to watch next" steps: what specific price action or indicator moves would confirm or invalidate these patterns.
7. Identify explicit key price levels to watch (Resistance, Support, Invalidation level, Confirmation trigger).
`;
    } else {
      promptText = `
You are a senior technical market technician analyzing futures and index products (e.g. Gold, Crude Oil, S&P 500, Nifty 50, Bitcoin).

Analyze the following market price action description for "${assetName}":
"${manualDesc || "Price is trending near recent resistance with rising moving averages."}"

TASK:
1. Determine an "Implied Call": choose strictly one of "long", "short", or "hold" based on the technical description.
2. Provide a 1-2 sentence "Rationale" summarizing the key technical factors (trend, MA alignment, RSI) leading to this call.
3. Identify key technical patterns mentioned or implied in this description (e.g., "Uptrend / Higher Highs", "Golden Cross", "RSI Overbought", "Resistance Test", etc.).
4. For EACH pattern, explain in clear, plain language what it typically signals and why traders watch it.
5. Provide a clear "Confidence & Caveats" statement: emphasize that technical indicators are probabilistic, not predictive, and should be evaluated alongside fundamentals, news, and market liquidity.
6. List actionable "What to watch next" steps: what would confirm or invalidate the pattern.
7. Identify potential key price levels to watch if mentioned or inferable.
`;
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText,
      config: {
        systemInstruction: `You are an expert market technician and financial educator specializing in technical analysis of futures, commodities, equity indices, and digital assets. Provide objective, educational, plain-language insights formatted strictly as JSON. Never offer financial advice; focus on objective technical pattern identification.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A 2-3 sentence high-level narrative summary of current price action.",
            },
            impliedCall: {
              type: Type.STRING,
              enum: ["long", "short", "hold"],
              description: "Strictly one of 'long', 'short', or 'hold' reflecting technical posture.",
            },
            rationale: {
              type: Type.STRING,
              description: "1-2 sentence explanation combining MA alignment, RSI level, and trend structure.",
            },
            patterns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Pattern name, e.g. Golden Cross (MA20 > MA50)" },
                  type: {
                    type: Type.STRING,
                    description: "Category: bullish, bearish, neutral, reversal, continuation, or warning",
                  },
                  signalExplanation: {
                    type: Type.STRING,
                    description: "Plain language explanation of what this pattern typically signals.",
                  },
                  whyTradersWatchIt: {
                    type: Type.STRING,
                    description: "Why traders and institutions pay attention to this specific pattern.",
                  },
                  keyLevel: {
                    type: Type.STRING,
                    description: "Associated key price level or threshold if applicable.",
                  },
                },
                required: ["name", "type", "signalExplanation", "whyTradersWatchIt"],
              },
            },
            confidenceAndCaveats: {
              type: Type.STRING,
              description: "Plain-language note reminding that technical patterns are probabilistic, not predictive, and must be read alongside fundamentals/news.",
            },
            whatToWatchNext: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Short, actionable bullet points describing what would confirm or invalidate the patterns.",
            },
            keyLevelsToWatch: {
              type: Type.OBJECT,
              properties: {
                resistance: { type: Type.STRING },
                support: { type: Type.STRING },
                invalidation: { type: Type.STRING },
                confirmation: { type: Type.STRING },
              },
            },
          },
          required: ["summary", "impliedCall", "rationale", "patterns", "confidenceAndCaveats", "whatToWatchNext", "keyLevelsToWatch"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response generated by Gemini model.");
    }

    const parsedJson = JSON.parse(responseText);
    res.json(parsedJson);
  } catch (error: any) {
    console.error("Error in /api/analyze:", error);
    res.status(500).json({
      error: error.message || "Failed to analyze technical pattern.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Technical Pattern Explainer server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
