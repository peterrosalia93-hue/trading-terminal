import { useEffect, useState } from "react";
import { Panel } from "./components/Panel";

function formatMoney(value) {
  if (value == null) {
    return "--";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value) {
  return value == null ? "--" : `${value.toFixed(1)}%`;
}

function badgeClass(value) {
  if (value === "won" || value === "ready") {
    return "positive";
  }
  if (value === "lost" || value === "missing" || value === "armed") {
    return "negative";
  }
  return "neutral";
}

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error(`Dashboard request failed: ${response.status}`);
        }
        const payload = await response.json();
        if (!cancelled) {
          setData(payload);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    }

    load();
    const intervalId = window.setInterval(load, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const status = data?.status || "loading";
  const session = data?.sessionSummary;
  const risk = data?.riskSummary;
  const families = data?.familyStats || [];
  const feed = data?.tradeFeed || [];
  const journalTail = data?.journalTail || [];
  const commands = data?.config?.commands || [];

  return (
    <main className="app-shell">
      <div className="hero">
        <div>
          <span className={`status-pill ${badgeClass(status)}`}>{status}</span>
          <h1>VIPISI Trading Terminal</h1>
          <p>
            Local operator dashboard for journal-driven oversight, risk state,
            setup quality, and session control.
          </p>
        </div>
        <div className="hero-meta">
          <div>
            <span>Journal path</span>
            <strong>{data?.journalPath || "Loading..."}</strong>
          </div>
          <div>
            <span>Last refresh</span>
            <strong>{data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : "--"}</strong>
          </div>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="summary-grid">
        <Panel title="Account / Session" subtitle="Live account state and operating context">
          <div className="metric-grid">
            <div className="metric-card">
              <span>Balance</span>
              <strong>{formatMoney(session?.latestBalance)}</strong>
            </div>
            <div className="metric-card">
              <span>Session PnL</span>
              <strong>{formatMoney(session?.sessionPnl)}</strong>
            </div>
            <div className="metric-card">
              <span>Hit Rate</span>
              <strong>{formatPercent(session?.hitRate)}</strong>
            </div>
            <div className="metric-card">
              <span>Recent 20 PnL</span>
              <strong>{formatMoney(session?.recentPnl)}</strong>
            </div>
          </div>
          <div className="detail-list">
            <div><span>Variant</span><strong>{session?.activeVariant || "--"}</strong></div>
            <div><span>Profile</span><strong>{session?.activeProfile || "--"}</strong></div>
            <div><span>Symbol</span><strong>{session?.activeSymbol || "--"}</strong></div>
            <div><span>Trades</span><strong>{session?.executedTrades ?? "--"}</strong></div>
            <div><span>Skips</span><strong>{session?.skippedSetups ?? "--"}</strong></div>
            <div><span>Journal rows</span><strong>{data?.rowCount ?? "--"}</strong></div>
            <div><span>Last journal tick</span><strong>{session?.latestTimestamp || "--"}</strong></div>
          </div>
        </Panel>

        <Panel
          title="Risk / Kill Switch"
          subtitle="Filters, drawdown pressure, and last-block reasons"
          accent={risk?.killSwitchArmed ? "danger" : "success"}
        >
          <div className="risk-state">
            <div className={`risk-badge ${risk?.killSwitchArmed ? "negative" : "positive"}`}>
              {risk?.killSwitchArmed ? "Armed" : "Clear"}
            </div>
            <p>
              {risk?.killSwitchArmed
                ? "Trade gating is active. Review filters before resuming execution."
                : "No active hard stop inferred from the latest journal line."}
            </p>
          </div>
          <div className="detail-list">
            <div><span>Failed filters</span><strong>{risk?.failedFilters?.join(", ") || "none"}</strong></div>
            <div><span>Consecutive losses</span><strong>{risk?.consecutiveLosses ?? "--"}</strong></div>
            <div><span>Drawdown</span><strong>{formatMoney(risk?.drawdown)}</strong></div>
            <div><span>Ticks since trade</span><strong>{risk?.ticksSinceLastTrade ?? "--"}</strong></div>
            <div><span>Regime</span><strong>{risk?.activeRegime || "--"}</strong></div>
            <div><span>Current skip reason</span><strong>{risk?.currentSkipReason || "--"}</strong></div>
          </div>
        </Panel>
      </section>

      <section className="content-grid">
        <Panel title="Trade / Skip Feed" subtitle="Latest execution and blocked setup decisions">
          <div className="feed-list">
            {feed.map((row) => (
              <article className="feed-item" key={row.id}>
                <div className="feed-head">
                  <span className={`status-pill ${badgeClass(row.outcome)}`}>{row.executionAction}</span>
                  <strong>{row.signalFamily}</strong>
                  <span>{row.timestamp}</span>
                </div>
                <p>
                  {row.symbol} {row.contractType} {row.direction}
                </p>
                <div className="feed-meta">
                  <span>Outcome: {row.outcome}</span>
                  <span>PnL: {formatMoney(row.pnl)}</span>
                  <span>Skip: {row.skipReason || "--"}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Setup Family Stats" subtitle="Expectancy, quality, and win-rate by family">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Family</th>
                  <th>Trades</th>
                  <th>Skips</th>
                  <th>Win rate</th>
                  <th>Expectancy</th>
                  <th>Avg quality</th>
                  <th>Last outcome</th>
                </tr>
              </thead>
              <tbody>
                {families.map((family) => (
                  <tr key={family.signalFamily}>
                    <td>{family.signalFamily}</td>
                    <td>{family.trades}</td>
                    <td>{family.skips}</td>
                    <td>{formatPercent(family.winRate)}</td>
                    <td>{formatMoney(family.expectancy)}</td>
                    <td>{family.avgQuality ?? "--"}</td>
                    <td>
                      <span className={`status-pill ${badgeClass(family.lastOutcome)}`}>
                        {family.lastOutcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Recent Journal Stream" subtitle="Tail of vipisi_journal_v4.csv">
          <div className="journal-list">
            {journalTail.map((row) => (
              <article className="journal-item" key={row.id}>
                <div className="journal-top">
                  <strong>{row.timestamp}</strong>
                  <span>{row.variantId}</span>
                  <span>{row.profile}</span>
                </div>
                <p>{row.rawSignalReason || row.signalFamily}</p>
                <div className="feed-meta">
                  <span>{row.symbol}</span>
                  <span>{row.qualityGrade || "--"}</span>
                  <span>{row.outcome}</span>
                  <span>{formatMoney(row.balance)}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Operator Controls" subtitle="Documented local commands for MVP handoff">
          <div className="controls-list">
            {commands.map((item) => (
              <article className="command-card" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.command}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(item.command)}
                >
                  Copy
                </button>
              </article>
            ))}
          </div>
          <p className="controls-note">
            Commands are placeholders by design in this MVP. They are surfaced here
            so the terminal remains operator-centered without introducing unsafe
            remote execution.
          </p>
        </Panel>
      </section>
    </main>
  );
}

export default App;
