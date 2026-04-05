import fs from "node:fs";
import { parse } from "csv-parse/sync";

function toNumber(value) {
  if (value === "" || value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toBool(value) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
}

function normalizeRow(row, index) {
  return {
    id: `${row.timestamp || "row"}-${index}`,
    timestamp: row.timestamp || "",
    variantId: row.variant_id || "unknown",
    profile: row.profile || "unknown",
    symbol: row.symbol || "unknown",
    contractType: row.contract_type || "",
    direction: row.candidate_direction || "",
    signalFamily: row.signal_family || "unknown",
    rawSignalReason: row.raw_signal_reason || "",
    confidenceLabel: row.confidence_label || "",
    selectedForTrade: row.selected_for_trade === "yes",
    executionAction: row.execution_action || "observe",
    skipReason: row.skip_reason || "",
    filtersFailed: row.filters_failed || "",
    outcome: row.outcome || "unknown",
    qualityGrade: row.quality_grade || "",
    regimeLabel: row.regime_label || "",
    paperOrLive: row.paper_or_live_demo || "",
    notes: row.notes || "",
    stake: toNumber(row.stake),
    payoutIfWin: toNumber(row.payout_if_win),
    lossIfLose: toNumber(row.loss_if_lose),
    pnl: toNumber(row.pnl),
    balance: toNumber(row.balance),
    entryBalance: toNumber(row.entry_balance),
    sessionPnl: toNumber(row.session_pnl),
    drawdown: toNumber(row.drawdown),
    consecutiveLosses: toNumber(row.consecutive_losses),
    ticksSinceLastTrade: toNumber(row.ticks_since_last_trade),
    rollingExpectancyBefore: toNumber(row.rolling_20_expectancy_before_trade),
    rollingExpectancyAfter: toNumber(row.rolling_20_expectancy_after_trade),
    familyRollingWinRate: toNumber(row.family_rolling_win_rate),
    familyRollingExpectancy: toNumber(row.family_rolling_expectancy),
    qualityScore: toNumber(row.quality_score),
    tradeConditionScore: toNumber(row.trade_condition_score),
    boundaryPressureLow: toNumber(row.boundary_pressure_low),
    boundaryPressureHigh: toNumber(row.boundary_pressure_high),
    cooldownFilterPass: toBool(row.cooldown_filter_pass),
    drawdownFilterPass: toBool(row.drawdown_filter_pass),
    saturationFilterPass: toBool(row.saturation_filter_pass),
    familyFilterPass: toBool(row.family_filter_pass),
    chopFilterPass: toBool(row.chop_filter_pass)
  };
}

function aggregateFamilyStats(rows) {
  const familyMap = new Map();

  for (const row of rows) {
    const existing = familyMap.get(row.signalFamily) || {
      signalFamily: row.signalFamily,
      trades: 0,
      skips: 0,
      wins: 0,
      losses: 0,
      totalPnl: 0,
      qualityTotal: 0,
      qualityCount: 0,
      lastOutcome: row.outcome,
      expectancy: null,
      winRate: null
    };

    if (row.executionAction === "execute") {
      existing.trades += 1;
    }

    if (row.executionAction === "skip" || row.outcome === "skipped") {
      existing.skips += 1;
    }

    if (row.outcome === "won") {
      existing.wins += 1;
    }

    if (row.outcome === "lost") {
      existing.losses += 1;
    }

    if (row.pnl != null) {
      existing.totalPnl += row.pnl;
    }

    if (row.qualityScore != null) {
      existing.qualityTotal += row.qualityScore;
      existing.qualityCount += 1;
    }

    existing.lastOutcome = row.outcome;
    familyMap.set(row.signalFamily, existing);
  }

  return [...familyMap.values()]
    .map((family) => {
      const decidedTrades = family.wins + family.losses;
      return {
        ...family,
        expectancy:
          family.trades > 0 ? Number((family.totalPnl / family.trades).toFixed(3)) : null,
        winRate:
          decidedTrades > 0
            ? Number(((family.wins / decidedTrades) * 100).toFixed(1))
            : null,
        avgQuality:
          family.qualityCount > 0
            ? Number((family.qualityTotal / family.qualityCount).toFixed(1))
            : null
      };
    })
    .sort((a, b) => (b.expectancy ?? -999) - (a.expectancy ?? -999));
}

function summarizeSession(rows) {
  const latest = rows.at(-1) || null;
  const executed = rows.filter((row) => row.executionAction === "execute");
  const skipped = rows.filter(
    (row) => row.executionAction === "skip" || row.outcome === "skipped"
  );
  const wins = rows.filter((row) => row.outcome === "won").length;
  const losses = rows.filter((row) => row.outcome === "lost").length;
  const variants = [...new Set(rows.map((row) => row.variantId))];
  const profiles = [...new Set(rows.map((row) => row.profile))];
  const symbols = [...new Set(rows.map((row) => row.symbol))];
  const last20 = rows.slice(-20);
  const last20Pnl = last20.reduce((sum, row) => sum + (row.pnl || 0), 0);

  return {
    totalRows: rows.length,
    executedTrades: executed.length,
    skippedSetups: skipped.length,
    wins,
    losses,
    hitRate:
      wins + losses > 0 ? Number(((wins / (wins + losses)) * 100).toFixed(1)) : null,
    latestBalance: latest?.balance ?? null,
    sessionPnl: latest?.sessionPnl ?? null,
    drawdown: latest?.drawdown ?? null,
    consecutiveLosses: latest?.consecutiveLosses ?? null,
    latestTimestamp: latest?.timestamp ?? null,
    activeVariant: latest?.variantId ?? null,
    activeProfile: latest?.profile ?? null,
    activeSymbol: latest?.symbol ?? null,
    variants,
    profiles,
    symbols,
    recentPnl: Number(last20Pnl.toFixed(2))
  };
}

function summarizeRisk(rows) {
  const latest = rows.at(-1) || null;
  const failedFilters = [];

  if (latest && latest.cooldownFilterPass === false) {
    failedFilters.push("cooldown");
  }
  if (latest && latest.drawdownFilterPass === false) {
    failedFilters.push("drawdown");
  }
  if (latest && latest.saturationFilterPass === false) {
    failedFilters.push("saturation");
  }
  if (latest && latest.familyFilterPass === false) {
    failedFilters.push("family");
  }
  if (latest && latest.chopFilterPass === false) {
    failedFilters.push("chop");
  }

  const killSwitchArmed = Boolean(
    failedFilters.length > 0 || (latest?.consecutiveLosses ?? 0) >= 3
  );

  return {
    killSwitchArmed,
    failedFilters,
    latestOutcome: latest?.outcome ?? null,
    consecutiveLosses: latest?.consecutiveLosses ?? null,
    drawdown: latest?.drawdown ?? null,
    ticksSinceLastTrade: latest?.ticksSinceLastTrade ?? null,
    activeRegime: latest?.regimeLabel ?? null,
    currentSkipReason: latest?.skipReason || null
  };
}

function makeTradeFeed(rows) {
  return rows
    .filter((row) => row.executionAction === "execute" || row.executionAction === "skip")
    .slice(-15)
    .reverse();
}

function makeJournalTail(rows) {
  return rows.slice(-18).reverse();
}

export function loadJournalSnapshot(journalPath) {
  if (!fs.existsSync(journalPath)) {
    return {
      status: "missing",
      journalPath,
      rowCount: 0,
      sessionSummary: null,
      riskSummary: null,
      familyStats: [],
      tradeFeed: [],
      journalTail: []
    };
  }

  const csv = fs.readFileSync(journalPath, "utf8");
  const parsed = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true
  });

  const rows = parsed.map(normalizeRow);

  return {
    status: "ready",
    journalPath,
    rowCount: rows.length,
    sessionSummary: summarizeSession(rows),
    riskSummary: summarizeRisk(rows),
    familyStats: aggregateFamilyStats(rows),
    tradeFeed: makeTradeFeed(rows),
    journalTail: makeJournalTail(rows)
  };
}
