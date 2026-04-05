// Vercel serverless API for trading-terminal
// Returns demo data since journal CSV is local-only

export default function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/health") {
    return res.json({ ok: true, env: "vercel" });
  }

  if (url.pathname === "/api/dashboard") {
    return res.json({
      status: "demo",
      journalPath: "(cloud deployment - no local journal)",
      rowCount: 0,
      sessionSummary: {
        totalRows: 0,
        executedTrades: 0,
        skippedSetups: 0,
        wins: 0,
        losses: 0,
        hitRate: null,
        latestBalance: null,
        sessionPnl: null,
        drawdown: null,
        consecutiveLosses: null,
        latestTimestamp: null,
        activeVariant: null,
        activeProfile: null,
        activeSymbol: null,
        variants: [],
        profiles: [],
        symbols: [],
        recentPnl: 0
      },
      riskSummary: {
        killSwitchArmed: false,
        failedFilters: [],
        latestOutcome: null,
        consecutiveLosses: null,
        drawdown: null,
        ticksSinceLastTrade: null,
        activeRegime: null,
        currentSkipReason: null
      },
      familyStats: [],
      tradeFeed: [],
      journalTail: [],
      config: { commands: [] },
      generatedAt: new Date().toISOString()
    });
  }

  return res.status(404).json({ error: "Not found" });
}
