import React, { useEffect, useMemo, useRef, useState } from "react";

type LogRow = {
  id: number;
  ts: string; // D1 datetime text
  ip: string;
  source: string;
  method: string;
  path: string;
  status: number;
  latency_ms: number;
  cache: string;
  user_agent: string;
};

type Stats = {
  ok: boolean;
  total: number;
  lastHour: number;
  lastDay: number;
  bySource: Array<{ source: string; v: number }>;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function safeJsonParse<T = any>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function toQuery(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (!s) return;
    sp.set(k, s);
  });
  const q = sp.toString();
  return q ? `?${q}` : "";
}

function formatTs(ts: string) {
  // D1 returns "YYYY-MM-DD HH:MM:SS" (UTC-ish). Convert safely.
  // If it won't parse, just return raw.
  const isoGuess = ts.includes("T") ? ts : ts.replace(" ", "T") + "Z";
  const d = new Date(isoGuess);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

function statusBadge(status: number) {
  const base: React.CSSProperties = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "rgba(0,0,0,0.03)",
  };

  if (status >= 200 && status < 300) return <span style={base}>✅ {status}</span>;
  if (status >= 300 && status < 400) return <span style={base}>↪️ {status}</span>;
  if (status >= 400 && status < 500) return <span style={base}>⚠️ {status}</span>;
  return <span style={base}>🛑 {status}</span>;
}

export default function Admin() {
  // ------------------------------------
  // Admin auth token (user-entered)
  // ------------------------------------
  const [adminKey, setAdminKey] = useState<string>(() => {
    return sessionStorage.getItem("pj_admin_key") || "";
  });
  const [adminKeyInput, setAdminKeyInput] = useState<string>(() => {
    return sessionStorage.getItem("pj_admin_key") || "";
  });
  const [authError, setAuthError] = useState<string>("");

  const isAuthed = useMemo(() => adminKey.trim().length > 0, [adminKey]);

  const saveAdminKey = () => {
    const k = adminKeyInput.trim();
    setAuthError("");
    setAdminKey(k);
    if (k) sessionStorage.setItem("pj_admin_key", k);
    else sessionStorage.removeItem("pj_admin_key");
  };

  const clearAdminKey = () => {
    setAuthError("");
    setAdminKey("");
    setAdminKeyInput("");
    sessionStorage.removeItem("pj_admin_key");
  };

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {
      Accept: "application/json",
    };
    if (adminKey.trim()) h.Authorization = `Bearer ${adminKey.trim()}`;
    return h;
  }, [adminKey]);

  // ------------------------------------
  // API tester state
  // ------------------------------------
  const [endpoint, setEndpoint] = useState<string>("/proxy/routes/jaas");
  const [topic, setTopic] = useState<string>("budget");
  const [tone, setTone] = useState<string>("snarky");
  const [intensity, setIntensity] = useState<number>(3);

  const [testerLoading, setTesterLoading] = useState<boolean>(false);
  const [testerError, setTesterError] = useState<string>("");
  const [testerStatus, setTesterStatus] = useState<number | null>(null);
  const [testerLatency, setTesterLatency] = useState<number | null>(null);
  const [testerRespHeaders, setTesterRespHeaders] = useState<Record<string, string>>({});
  const [testerRespBody, setTesterRespBody] = useState<any>(null);
  const [testerRawBody, setTesterRawBody] = useState<string>("");

  const testerUrl = useMemo(() => {
    const sp = new URLSearchParams();
    if (endpoint === "/proxy/routes/jaas") {
      if (topic.trim()) sp.set("topic", topic.trim());
      if (tone.trim()) sp.set("tone", tone.trim());
      if (Number.isFinite(intensity)) sp.set("intensity", String(intensity));
    }
    return `${endpoint}${sp.toString() ? `?${sp.toString()}` : ""}`;
  }, [endpoint, topic, tone, intensity]);

  const runTest = async () => {
    setTesterLoading(true);
    setTesterError("");
    setTesterStatus(null);
    setTesterLatency(null);
    setTesterRespHeaders({});
    setTesterRespBody(null);
    setTesterRawBody("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const started = performance.now();
    try {
      const res = await fetch(testerUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-PJ-Source": "ui-admin",
        },
        signal: controller.signal,
      });

      const ended = performance.now();
      setTesterLatency(Math.round(ended - started));
      setTesterStatus(res.status);

      const headersObj: Record<string, string> = {};
      res.headers.forEach((v, k) => (headersObj[k] = v));
      setTesterRespHeaders(headersObj);

      const text = await res.text();
      setTesterRawBody(text);

      const parsed = safeJsonParse(text);
      setTesterRespBody(parsed ?? text);
    } catch (e: any) {
      const ended = performance.now();
      setTesterLatency(Math.round(ended - started));
      setTesterError(e?.name === "AbortError" ? "Request timed out (15s)" : (e?.message || String(e)));
    } finally {
      clearTimeout(timeout);
      setTesterLoading(false);
    }
  };

  // ------------------------------------
  // Logs + Stats state
  // ------------------------------------
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsErr, setStatsErr] = useState<string>("");

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [logsTotal, setLogsTotal] = useState<number>(0);
  const [logsErr, setLogsErr] = useState<string>("");

  const [limit, setLimit] = useState<number>(100);
  const [offset, setOffset] = useState<number>(0);

  const [filterSource, setFilterSource] = useState<string>("");
  const [filterPath, setFilterPath] = useState<string>("");
  const [filterIp, setFilterIp] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const autoRefreshRef = useRef<boolean>(false);

  useEffect(() => {
    autoRefreshRef.current = autoRefresh;
  }, [autoRefresh]);

  const loadStats = async () => {
    if (!isAuthed) {
      setStats(null);
      setStatsErr("Enter admin API key to load stats.");
      return;
    }

    setStatsErr("");
    try {
      const res = await fetch("/admin/api/stats", {
        method: "GET",
        headers: authHeaders,
      });

      if (res.status === 401) {
        setAuthError("Unauthorized: your admin key is wrong (or missing ADMIN_API_KEY in Worker).");
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Stats request failed (${res.status})`);
      }
      setStats(data);
    } catch (e: any) {
      setStats(null);
      setStatsErr(e?.message || String(e));
    }
  };

  const loadLogs = async (opts?: { resetOffset?: boolean }) => {
    if (!isAuthed) {
      setLogs([]);
      setLogsTotal(0);
      setLogsErr("Enter admin API key to load logs.");
      return;
    }

    setLogsErr("");
    setLogsLoading(true);

    const nextOffset = opts?.resetOffset ? 0 : offset;

    const query = toQuery({
      limit,
      offset: nextOffset,
      source: filterSource.trim() || undefined,
      path: filterPath.trim() || undefined,
      ip: filterIp.trim() || undefined,
      status: filterStatus.trim() || undefined,
    });

    try {
      const res = await fetch(`/admin/api/logs${query}`, {
        method: "GET",
        headers: authHeaders,
      });

      if (res.status === 401) {
        setAuthError("Unauthorized: your admin key is wrong (or missing ADMIN_API_KEY in Worker).");
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Logs request failed (${res.status})`);
      }

      setLogs(Array.isArray(data?.rows) ? data.rows : []);
      setLogsTotal(Number(data?.total || 0));

      if (opts?.resetOffset) setOffset(0);
    } catch (e: any) {
      setLogs([]);
      setLogsTotal(0);
      setLogsErr(e?.message || String(e));
    } finally {
      setLogsLoading(false);
    }
  };

  // initial load (only after a key is set)
  useEffect(() => {
    if (!isAuthed) return;
    loadStats();
    loadLogs({ resetOffset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  // auto refresh loop
  useEffect(() => {
    let cancelled = false;

    const loop = async () => {
      while (!cancelled) {
        await sleep(5000);
        if (cancelled) return;
        if (!autoRefreshRef.current) continue;
        // keep it light: refresh stats + first page only
        await Promise.all([loadStats(), loadLogs()]);
      }
    };

    loop();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canPrev = offset > 0;
  const canNext = offset + limit < logsTotal;

  const headerStyle: React.CSSProperties = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 16,
  };

  const cardStyle: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 16,
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  };

  const labelStyle: React.CSSProperties = { fontSize: 12, opacity: 0.8, marginBottom: 6 };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    outline: "none",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    cursor: "pointer",
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "black",
    color: "white",
    border: "1px solid black",
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Admin</h1>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            API tester + request analytics (D1)
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto refresh (5s)
          </label>

          <button style={buttonStyle} onClick={() => { loadStats(); loadLogs(); }} disabled={!isAuthed}>
            Refresh now
          </button>

          <button style={buttonStyle} onClick={clearAdminKey}>
            Clear key
          </button>
        </div>
      </div>

      {/* Admin key gate */}
      {!isAuthed && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Admin access</h2>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 12 }}>
            Enter your <b>ADMIN_API_KEY</b>. It is stored only in this browser session storage.
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="password"
              placeholder="ADMIN_API_KEY"
              value={adminKeyInput}
              onChange={(e) => setAdminKeyInput(e.target.value)}
              style={{ ...inputStyle, maxWidth: 520 }}
            />
            <button style={primaryButtonStyle} onClick={saveAdminKey}>
              Save
            </button>
          </div>
          {(authError || statsErr || logsErr) && (
            <div style={{ marginTop: 12, color: "#b00020", fontSize: 13 }}>
              {authError || statsErr || logsErr}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Usage snapshot</h2>

        {!isAuthed ? (
          <div style={{ fontSize: 13, opacity: 0.8 }}>Enter admin key to view stats.</div>
        ) : statsErr ? (
          <div style={{ fontSize: 13, color: "#b00020" }}>{statsErr}</div>
        ) : !stats ? (
          <div style={{ fontSize: 13, opacity: 0.8 }}>Loading…</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Total requests logged</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.total}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Last hour</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.lastHour}</div>
              </div>
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Last 24 hours</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.lastDay}</div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>By source (last 24h)</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {stats.bySource?.length ? (
                  stats.bySource.map((s) => (
                    <button
                      key={s.source}
                      style={{
                        ...buttonStyle,
                        padding: "6px 10px",
                        fontSize: 12,
                        background: filterSource === s.source ? "black" : "white",
                        color: filterSource === s.source ? "white" : "black",
                      }}
                      onClick={() => {
                        setFilterSource(filterSource === s.source ? "" : s.source);
                        // reset paging and reload
                        setTimeout(() => loadLogs({ resetOffset: true }), 0);
                      }}
                    >
                      {s.source}: {s.v}
                    </button>
                  ))
                ) : (
                  <span style={{ fontSize: 13, opacity: 0.75 }}>No data</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* API Tester */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>UI API tester</h2>
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 12 }}>
          This simulates real browser traffic. Requests are tagged as <b>X-PJ-Source: ui-admin</b>.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          <div>
            <div style={labelStyle}>Endpoint</div>
            <select
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              style={inputStyle}
            >
              <option value="/proxy/routes/jaas">/proxy/routes/jaas</option>
              <option value="/proxy/routes/jaas/topics">/proxy/routes/jaas/topics</option>
              <option value="/proxy/routes/jaas/tones">/proxy/routes/jaas/tones</option>
            </select>
          </div>

          <div>
            <div style={labelStyle}>Topic</div>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="budget"
              style={inputStyle}
              disabled={endpoint !== "/proxy/routes/jaas"}
            />
          </div>

          <div>
            <div style={labelStyle}>Tone</div>
            <input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="snarky"
              style={inputStyle}
              disabled={endpoint !== "/proxy/routes/jaas"}
            />
          </div>

          <div>
            <div style={labelStyle}>Intensity</div>
            <input
              type="number"
              min={1}
              max={5}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              style={inputStyle}
              disabled={endpoint !== "/proxy/routes/jaas"}
            />
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button style={primaryButtonStyle} onClick={runTest} disabled={testerLoading}>
            {testerLoading ? "Running…" : "Run test"}
          </button>

          <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12, opacity: 0.9 }}>
            GET {testerUrl}
          </div>

          {testerStatus !== null && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div>{statusBadge(testerStatus)}</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {testerLatency !== null ? `${testerLatency}ms` : ""}
              </div>
            </div>
          )}
        </div>

        {testerError && (
          <div style={{ marginTop: 10, color: "#b00020", fontSize: 13 }}>{testerError}</div>
        )}

        {(testerStatus !== null || testerRawBody) && (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <div style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: 10, background: "rgba(0,0,0,0.03)", fontSize: 12, opacity: 0.75 }}>
                Response body
              </div>
              <pre style={{ margin: 0, padding: 12, fontSize: 12, overflow: "auto" }}>
                {typeof testerRespBody === "string"
                  ? testerRespBody
                  : JSON.stringify(testerRespBody, null, 2)}
              </pre>
            </div>

            <div style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: 10, background: "rgba(0,0,0,0.03)", fontSize: 12, opacity: 0.75 }}>
                Response headers (subset)
              </div>
              <pre style={{ margin: 0, padding: 12, fontSize: 12, overflow: "auto" }}>
                {JSON.stringify(
                  Object.fromEntries(
                    Object.entries(testerRespHeaders).filter(([k]) =>
                      [
                        "cf-cache-status",
                        "age",
                        "cache-control",
                        "expires",
                        "vary",
                        "x-pj-cache",
                        "x-pj-upstream-status",
                        "x-pj-upstream-url",
                      ].includes(k.toLowerCase())
                    )
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Logs Viewer */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>Request logs</h2>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Showing {logs.length} of {logsTotal}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              style={buttonStyle}
              onClick={() => loadLogs({ resetOffset: true })}
              disabled={!isAuthed || logsLoading}
            >
              Apply filters
            </button>
            <button
              style={buttonStyle}
              onClick={() => {
                setFilterSource("");
                setFilterPath("");
                setFilterIp("");
                setFilterStatus("");
                setOffset(0);
                setTimeout(() => loadLogs({ resetOffset: true }), 0);
              }}
              disabled={!isAuthed || logsLoading}
            >
              Clear filters
            </button>
          </div>
        </div>

        {!isAuthed ? (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>Enter admin key to view logs.</div>
        ) : (
          <>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div>
                <div style={labelStyle}>Filter: source</div>
                <input
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  placeholder="ui-admin / ui / unknown"
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={labelStyle}>Filter: path</div>
                <input
                  value={filterPath}
                  onChange={(e) => setFilterPath(e.target.value)}
                  placeholder="/proxy/routes/jaas"
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={labelStyle}>Filter: IP</div>
                <input
                  value={filterIp}
                  onChange={(e) => setFilterIp(e.target.value)}
                  placeholder="1.2.3.4"
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={labelStyle}>Filter: status</div>
                <input
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  placeholder="200"
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={labelStyle}>Limit</div>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div>
                <div style={labelStyle}>Offset</div>
                <input
                  type="number"
                  min={0}
                  value={offset}
                  onChange={(e) => setOffset(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                style={buttonStyle}
                onClick={() => {
                  const next = Math.max(0, offset - limit);
                  setOffset(next);
                  setTimeout(() => loadLogs(), 0);
                }}
                disabled={!canPrev || logsLoading}
              >
                Prev
              </button>
              <button
                style={buttonStyle}
                onClick={() => {
                  const next = offset + limit;
                  setOffset(next);
                  setTimeout(() => loadLogs(), 0);
                }}
                disabled={!canNext || logsLoading}
              >
                Next
              </button>
              <button style={buttonStyle} onClick={() => loadLogs()} disabled={logsLoading}>
                {logsLoading ? "Loading…" : "Refresh"}
              </button>

              {logsErr && <div style={{ color: "#b00020", fontSize: 13 }}>{logsErr}</div>}
            </div>

            <div style={{ marginTop: 12, overflow: "auto", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.03)" }}>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>Time</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>Source</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>IP</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>Method</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>Path</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>Status</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>Latency</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>Cache</th>
                    <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>User-Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,0.06)", whiteSpace: "nowrap" }}>
                        {formatTs(r.ts)}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        <button
                          style={{ ...buttonStyle, padding: "4px 8px", fontSize: 12 }}
                          onClick={() => {
                            setFilterSource(r.source || "");
                            setOffset(0);
                            setTimeout(() => loadLogs({ resetOffset: true }), 0);
                          }}
                          title="Filter by this source"
                        >
                          {r.source || "-"}
                        </button>
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,0.06)", whiteSpace: "nowrap" }}>
                        <button
                          style={{ ...buttonStyle, padding: "4px 8px", fontSize: 12 }}
                          onClick={() => {
                            setFilterIp(r.ip || "");
                            setOffset(0);
                            setTimeout(() => loadLogs({ resetOffset: true }), 0);
                          }}
                          title="Filter by this IP"
                        >
                          {r.ip || "-"}
                        </button>
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>{r.method}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                        <button
                          style={{ ...buttonStyle, padding: "4px 8px", fontSize: 12 }}
                          onClick={() => {
                            setFilterPath(r.path || "");
                            setOffset(0);
                            setTimeout(() => loadLogs({ resetOffset: true }), 0);
                          }}
                          title="Filter by this path"
                        >
                          {r.path}
                        </button>
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,0.06)", whiteSpace: "nowrap" }}>
                        {statusBadge(r.status)}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,0.06)", whiteSpace: "nowrap" }}>
                        {r.latency_ms}ms
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>{r.cache}</td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,0.06)", maxWidth: 380 }}>
                        <span title={r.user_agent} style={{ display: "inline-block", maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.user_agent}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!logs.length && (
                    <tr>
                      <td colSpan={9} style={{ padding: 12, fontSize: 13, opacity: 0.75 }}>
                        No rows (try clearing filters)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
