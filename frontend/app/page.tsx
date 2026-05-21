'use client'
import { useState, useEffect } from 'react'

const API = 'https://portfolio-production-04e6.up.railway.app'

// ─── Types ────────────────────────────────────────────────────────────────────
type Asset = { name: string; value: number; ticker: string }
type Tab = 'analyze' | 'scenario' | 'risk'
type AnalyzeResult = { total_value: number; allocation: { name: string; value: number; weight: number }[]; risk_score: number }
type ScenarioResult = { scenario: string; impact_pct: number; total_old: number; total_new: number; assets: { name: string; old: number; new: number }[] }
type HeatmapEntry = { name: string; ticker: string; value: number; weight: number; volatility_pct: number | null; risk_score: number; vol_available: boolean }
type RiskResult = { monte_carlo: { start: number; mean: number; std: number; results: number[] }; var: { var_95: number; var_99: number }; heatmap: HeatmapEntry[] }
type HistoryAsset = { name: string; ticker: string; dates: number[]; closes: number[]; raw_closes: number[]; last_price: number; fan: { best: number[]; median: number[]; worst: number[]; steps: number } }
type MarketBrief = { summary: string; outlook: string; advice: string[]; sentiment: 'bullish' | 'bearish' | 'neutral' }
type Currency = 'USD' | 'SEK' | 'EUR'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#080808', surface: '#0e0e0e', card: '#111111',
  border: '#1c1c1c', borderHi: '#2a2a2a', platinum: '#c8c8c8',
  muted: '#4a4a4a', faint: '#222222', blue: '#C9A84C',
  blueGlow: '#C9A84C33', green: '#2ecc71', red: '#e74c3c',
  amber: '#e67e22', white: '#f0f0f0',
}

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function callApi<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(`${API}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error((b as { detail?: string }).detail ?? `Server error ${res.status}`) }
  return res.json()
}
async function fetchMarketBrief(assets: Asset[]): Promise<MarketBrief> {
  const res = await fetch(`${API}/brief`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ portfolio: { assets } }) })
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error((b as { detail?: string }).detail ?? `Server error ${res.status}`) }
  return res.json()
}

// ─── Currency ─────────────────────────────────────────────────────────────────
const CURRENCY_META: Record<Currency, { symbol: string; locale: string; flag: string }> = {
  USD: { symbol: '$', locale: 'en-US', flag: '🇺🇸' },
  SEK: { symbol: 'kr', locale: 'sv-SE', flag: '🇸🇪' },
  EUR: { symbol: '€', locale: 'de-DE', flag: '🇪🇺' },
}
function makeFmt(currency: Currency, rates: Record<Currency, number>) {
  const { symbol, locale } = CURRENCY_META[currency]
  const rate = rates[currency]
  return (usd: number) => {
    const converted = usd * rate
    const formatted = converted.toLocaleString(locale, { maximumFractionDigits: 0 })
    return currency === 'SEK' ? `${formatted} ${symbol}` : `${symbol}${formatted}`
  }
}
function toUSD(amount: number, currency: Currency, rates: Record<Currency, number>) { return amount / rates[currency] }
const FALLBACK_RATES: Record<Currency, number> = { USD: 1, SEK: 10.45, EUR: 0.92 }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pct = (n: number) => (n > 0 ? '+' : '') + n.toFixed(1) + '%'
const RISK_COLOR = (s: number) => s >= 66 ? C.red : s >= 33 ? C.amber : C.green
const SCORE_LABEL = (s: number) => s >= 66 ? 'HIGH' : s >= 33 ? 'MED' : 'LOW'
const SENTIMENT_CONFIG = {
  bullish: { color: C.green, icon: '▲', label: 'BULLISH' },
  bearish: { color: C.red, icon: '▼', label: 'BEARISH' },
  neutral: { color: C.amber, icon: '◆', label: 'NEUTRAL' },
}

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${C.bg}; color: ${C.platinum}; font-family: 'Space Mono', monospace; -webkit-tap-highlight-color: transparent; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.faint}; border-radius: 2px; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
  input::placeholder { color: ${C.muted} !important; }
  @keyframes pulse { 0%,100%{opacity:.2} 50%{opacity:1} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
  .anim-in { animation: fadeIn 0.3s ease forwards; }
  .slide-up { animation: slideUp 0.3s cubic-bezier(.4,0,.2,1) forwards; }
`

// ─── Primitives ───────────────────────────────────────────────────────────────
function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, ...style }}>{children}</div>
}
function Divider({ style }: { style?: React.CSSProperties }) {
  return <div style={{ height: 1, background: C.border, ...style }} />
}
function Chip({ children, color, style }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) {
  const c = color ?? C.blue
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 2, background: c + '18', border: `1px solid ${c}44`, color: c, fontSize: 10, fontWeight: 700, letterSpacing: 1, ...style }}>{children}</span>
}
function GhostBtn({ onClick, disabled, children, active, style }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; active?: boolean; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: active ? C.blue + '18' : 'transparent',
      border: `1px solid ${active ? C.blue : C.border}`, borderRadius: 2,
      color: active ? C.blue : C.muted, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: "'Space Mono',monospace", fontSize: 10, fontWeight: 700,
      letterSpacing: 1, padding: '5px 12px', transition: 'all 0.15s',
      textTransform: 'uppercase', opacity: disabled ? 0.4 : 1, ...style,
    }}>{children}</button>
  )
}
function PrimaryBtn({ onClick, disabled, children, fullWidth }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? C.faint : C.blue, border: 'none', borderRadius: 2,
      color: disabled ? C.muted : '#000', cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700,
      letterSpacing: 2, padding: '13px 28px', transition: 'all 0.2s',
      textTransform: 'uppercase', boxShadow: disabled ? 'none' : `0 0 24px ${C.blueGlow}`,
      width: fullWidth ? '100%' : 'auto',
    }}>{children}</button>
  )
}
function StatCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ padding: '12px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, flex: '1 1 120px', minWidth: 0 }}>
      <Label style={{ marginBottom: 6 }}>{label}</Label>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: color ?? C.white, lineHeight: 1, letterSpacing: -0.5, wordBreak: 'break-all' }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  )
}

// ─── Market Brief ─────────────────────────────────────────────────────────────
function MarketBriefCard({ brief, loading, error, onFetch, hasAssets }: { brief: MarketBrief | null; loading: boolean; error: string | null; onFetch: () => void; hasAssets: boolean }) {
  const sentiment = brief ? SENTIMENT_CONFIG[brief.sentiment] : null
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: C.faint, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Label>◈ AI Market Brief</Label>
          {sentiment && <Chip color={sentiment.color}>{sentiment.icon} {sentiment.label}</Chip>}
        </div>
        <GhostBtn onClick={onFetch} disabled={loading || !hasAssets} active={!brief}>
          {loading ? '⟳ Searching' : brief ? '↻ Refresh' : '▶ Get Brief'}
        </GhostBtn>
      </div>
      <div style={{ padding: 14 }}>
        {!brief && !loading && !error && <p style={{ color: C.muted, fontSize: 11, fontStyle: 'italic', lineHeight: 1.6 }}>{hasAssets ? 'Search the web for current conditions and get personalised advice.' : 'Add assets first.'}</p>}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
            <div style={{ display: 'flex', gap: 4 }}>{[0,1,2,3].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: C.blue, animation: `pulse 1.4s ease-in-out ${i*0.18}s infinite` }} />)}</div>
            <span style={{ color: C.muted, fontSize: 11 }}>Searching web for market news…</span>
          </div>
        )}
        {error && <div style={{ color: C.red, fontSize: 11 }}>⚠ {error}</div>}
        {brief && !loading && (
          <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><Label style={{ marginBottom: 6 }}>What's happening</Label><p style={{ fontSize: 12, color: C.platinum, lineHeight: 1.8 }}>{brief.summary}</p></div>
            {brief.outlook && <div><Label style={{ marginBottom: 6 }}>Portfolio Outlook</Label><p style={{ fontSize: 12, color: C.platinum, lineHeight: 1.8 }}>{brief.outlook}</p></div>}
            <div>
              <Label style={{ marginBottom: 8 }}>Recommended Actions</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {brief.advice.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, width: 18, height: 18, background: C.blue, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, borderRadius: 1 }}>{i + 1}</div>
                    <span style={{ fontSize: 12, color: C.platinum, lineHeight: 1.7 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
              <p style={{ fontSize: 9, color: C.muted, letterSpacing: 0.5 }}>AI-GENERATED · NOT FINANCIAL ADVICE · DO YOUR OWN RESEARCH</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Analyze Panel ────────────────────────────────────────────────────────────
function AnalyzePanel({ result, assets, fmt }: { result: AnalyzeResult; assets: Asset[]; fmt: (n: number) => string }) {
  const [brief, setBrief] = useState<MarketBrief | null>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [briefError, setBriefError] = useState<string | null>(null)
  const scoreColor = result.risk_score >= 70 ? C.green : result.risk_score >= 40 ? C.amber : C.red
  async function getMarketBrief() {
    setBriefLoading(true); setBriefError(null)
    try { setBrief(await fetchMarketBrief(assets)) }
    catch (e: unknown) { setBriefError(e instanceof Error ? e.message : 'Failed') }
    finally { setBriefLoading(false) }
  }
  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard label="Total Value" value={fmt(result.total_value)} />
        <StatCard label="Diversification" value={`${result.risk_score}/100`} color={scoreColor} sub="Higher = more diversified" />
      </div>
      <div>
        <Label style={{ marginBottom: 12 }}>Allocation</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {result.allocation.map((a, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: C.platinum }}>{a.name}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{fmt(a.value)} <span style={{ color: C.blue }}>{a.weight}%</span></span>
              </div>
              <div style={{ height: 3, background: C.faint, borderRadius: 1 }}>
                <div style={{ width: `${a.weight}%`, height: '100%', background: `linear-gradient(90deg,${C.blue},${C.blue}aa)`, borderRadius: 1, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)', boxShadow: `0 0 8px ${C.blueGlow}` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <MarketBriefCard brief={brief} loading={briefLoading} error={briefError} onFetch={getMarketBrief} hasAssets={assets.length > 0} />
    </div>
  )
}

// ─── Scenario Panel ───────────────────────────────────────────────────────────
function ScenarioPanel({ result, fmt }: { result: ScenarioResult; fmt: (n: number) => string }) {
  const gain = result.total_new - result.total_old
  const isLoss = gain < 0
  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard label="Scenario" value={result.scenario.toUpperCase()} />
        <StatCard label="Market Move" value={pct(result.impact_pct)} color={isLoss ? C.red : C.green} />
        <StatCard label="Before" value={fmt(result.total_old)} />
        <StatCard label="After" value={fmt(result.total_new)} color={isLoss ? C.red : C.green} />
        <StatCard label="P&L" value={`${isLoss ? '−' : '+'}${fmt(Math.abs(gain))}`} color={isLoss ? C.red : C.green} />
      </div>
      <div>
        <Label style={{ marginBottom: 10 }}>Asset Impact</Label>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 3, overflow: 'hidden', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3,90px)', padding: '8px 14px', background: C.faint, borderBottom: `1px solid ${C.border}`, minWidth: 320 }}>
            {['Asset','Before','After','Change'].map(h => <Label key={h}>{h}</Label>)}
          </div>
          {result.assets.map((a, i) => {
            const diff = a.new - a.old
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3,90px)', padding: '11px 14px', borderBottom: i < result.assets.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center', minWidth: 320 }}>
                <span style={{ fontSize: 12, color: C.platinum }}>{a.name}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{fmt(a.old)}</span>
                <span style={{ fontSize: 11, color: C.platinum }}>{fmt(a.new)}</span>
                <span style={{ fontSize: 11, color: diff < 0 ? C.red : C.green, fontWeight: 700 }}>{diff < 0 ? '−' : '+'}  {fmt(Math.abs(diff))}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── History Chart ────────────────────────────────────────────────────────────
const ASSET_COLORS = [C.blue, '#9b59b6', C.amber, '#1abc9c', '#e74c3c', '#3498db', '#f39c12']

function HistoryChart({ assets }: { assets: HistoryAsset[] }) {
  if (assets.length === 0) return (
    <div style={{ color: C.muted, fontSize: 11, textAlign: 'center', padding: '32px 0', border: `1px dashed ${C.border}`, borderRadius: 3 }}>
      No tickers detected — add tickers like AAPL, BTC-USD to see this chart.
    </div>
  )
  const maxHistLen = Math.max(...assets.map(a => a.dates.length))
  const simSteps = assets[0]?.fan.steps ?? 50
  const totalPoints = maxHistLen + simSteps
  const W = 700, H = 260, PAD = { top: 18, right: 70, bottom: 34, left: 50 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const allY: number[] = []
  assets.forEach(a => { allY.push(...a.closes); allY.push(...a.fan.best.map(v => a.closes[a.closes.length-1]+v), ...a.fan.worst.map(v => a.closes[a.closes.length-1]+v)) })
  const padY = (Math.max(...allY) - Math.min(...allY)) * 0.12
  const yMin = Math.min(...allY) - padY, yMax = Math.max(...allY) + padY
  const xS = (i: number) => PAD.left + (i / (totalPoints - 1)) * chartW
  const yS = (v: number) => PAD.top + chartH - ((v - yMin) / (yMax - yMin)) * chartH
  const todayX = xS(maxHistLen - 1)
  function path(vals: number[], si: number) { return vals.map((v, i) => `${i===0?'M':'L'}${xS(si+i).toFixed(1)},${yS(v).toFixed(1)}`).join(' ') }
  const firstDate = assets[0]?.dates[0], midDate = assets[0]?.dates[Math.floor(assets[0].dates.length/2)]
  const xLabels = [
    { x: PAD.left, label: firstDate ? new Date(firstDate).toLocaleDateString('en-GB',{month:'short',year:'2-digit'}) : '' },
    { x: xS(Math.floor(maxHistLen/2)), label: midDate ? new Date(midDate).toLocaleDateString('en-GB',{month:'short',year:'2-digit'}) : '' },
    { x: todayX, label: 'TODAY', hi: true },
    { x: xS(maxHistLen+25), label: '+25D' },
    { x: xS(totalPoints-1), label: '+50D' },
  ]
  const yLabels = Array.from({length:5},(_,i)=>{const v=yMin+(i/4)*(yMax-yMin);return{y:yS(v),label:(v>=0?'+':'')+v.toFixed(1)+'%'}})
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <svg width={W} height={H} style={{ display: 'block', minWidth: W }}>
        {yLabels.map((l,i)=><line key={i} x1={PAD.left} y1={l.y} x2={W-PAD.right} y2={l.y} stroke={C.border} strokeWidth={1}/>)}
        {yMin<0&&yMax>0&&<line x1={PAD.left} y1={yS(0)} x2={W-PAD.right} y2={yS(0)} stroke={C.borderHi} strokeWidth={1} strokeDasharray="3 4"/>}
        <line x1={todayX} y1={PAD.top} x2={todayX} y2={H-PAD.bottom} stroke={C.blue} strokeWidth={1} strokeDasharray="3 3" opacity={0.5}/>
        <text x={todayX+4} y={PAD.top+10} fill={C.blue} fontSize={7} fontFamily="'Syne',sans-serif" fontWeight={700} letterSpacing={1}>TODAY</text>
        {assets.map((a,ai)=>{
          const color=ASSET_COLORS[ai%ASSET_COLORS.length],si=a.closes.length-1,lc=a.closes[si]
          const off=(v:number)=>lc+v
          const bf=a.fan.best.map(off),mf=a.fan.median.map(off),wf=a.fan.worst.map(off)
          return(
            <g key={ai}>
              <path d={`${path(bf,si)} ${[...wf].reverse().map((v,i)=>`L${xS(si+wf.length-1-i).toFixed(1)},${yS(v).toFixed(1)}`).join(' ')} Z`} fill={color} fillOpacity={0.05}/>
              <path d={path(wf,si)} fill="none" stroke={C.red} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.65}/>
              <path d={path(bf,si)} fill="none" stroke={C.green} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.65}/>
              <path d={path(mf,si)} fill="none" stroke={C.amber} strokeWidth={2} strokeDasharray="6 3" opacity={0.8}/>
              <path d={path(a.closes,0)} fill="none" stroke={color} strokeWidth={2}/>
              <circle cx={xS(si)} cy={yS(lc)} r={4} fill={C.bg} stroke={color} strokeWidth={2}/>
            </g>
          )
        })}
        {yLabels.map((l,i)=><text key={i} x={PAD.left-5} y={l.y+4} fill={C.muted} fontSize={7} fontFamily="'Space Mono',monospace" textAnchor="end">{l.label}</text>)}
        {xLabels.map((l,i)=><text key={i} x={l.x} y={H-PAD.bottom+15} fill={(l as {hi?:boolean}).hi?C.blue:C.muted} fontSize={7} fontFamily="'Syne',sans-serif" fontWeight={700} letterSpacing={1} textAnchor="middle">{l.label}</text>)}
      </svg>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, paddingLeft: PAD.left }}>
        {assets.map((a,i)=>(
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 2, background: ASSET_COLORS[i%ASSET_COLORS.length] }}/>
            <span style={{ fontSize: 10, color: C.platinum }}>{a.name}</span>
            <Chip color={ASSET_COLORS[i%ASSET_COLORS.length]} style={{ fontSize: 8 }}>{a.ticker}</Chip>
          </div>
        ))}
        {[{color:C.green,label:'Best P90'},{color:C.amber,label:'Median'},{color:C.red,label:'Worst P10'}].map(l=>(
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 14, height: 2, background: l.color, opacity: 0.8 }}/>
            <span style={{ fontSize: 9, color: l.color, fontWeight: 700 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Risk Panel ───────────────────────────────────────────────────────────────
function RiskPanel({ result, fmt, assets }: { result: RiskResult; fmt: (n: number) => string; assets: Asset[] }) {
  const { monte_carlo: mc, var: v, heatmap } = result
  const [historyData, setHistoryData] = useState<HistoryAsset[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [histError, setHistError] = useState<string | null>(null)
  const [histFetched, setHistFetched] = useState(false)
  async function fetchHistory() {
    setHistLoading(true); setHistError(null)
    try {
      const res = await fetch(`${API}/history`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ portfolio: { assets } }) })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setHistoryData(data.assets); setHistFetched(true)
    } catch (e: unknown) { setHistError(e instanceof Error ? e.message : 'Failed') }
    finally { setHistLoading(false) }
  }
  const min = Math.min(...mc.results), max = Math.max(...mc.results)
  const buckets = 14, bucketSize = (max - min) / buckets
  const hist = Array.from({length:buckets},(_,i)=>{const lo=min+i*bucketSize,hi=lo+bucketSize;return mc.results.filter(r=>r>=lo&&(i===buckets-1?r<=hi:r<hi)).length})
  const histMax = Math.max(...hist)
  const anyVol = heatmap.some(h => h.vol_available)
  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard label="Start Value" value={fmt(mc.start)} />
        <StatCard label="Expected (50d)" value={fmt(mc.mean)} color={C.blue} sub="Mean of 500 simulations" />
        <StatCard label="Std Dev" value={fmt(mc.std)} color={C.amber} sub="Spread of outcomes" />
        <StatCard label="95% VaR" value={fmt(v.var_95)} color={C.red} sub="Max loss @ 95% conf." />
        <StatCard label="99% VaR" value={fmt(v.var_99)} color={C.red} sub="Max loss @ 99% conf." />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Label>1Y History + Forecast</Label>
          <GhostBtn onClick={fetchHistory} disabled={histLoading} active={!histFetched}>
            {histLoading ? '⟳ Loading' : histFetched ? '↻ Refresh' : '▶ Load Chart'}
          </GhostBtn>
        </div>
        {histError && <div style={{ color: C.red, fontSize: 11, marginBottom: 8 }}>⚠ {histError}</div>}
        {histLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0', color: C.muted, fontSize: 11 }}>
            <div style={{ display: 'flex', gap: 4 }}>{[0,1,2].map(i=><div key={i} style={{ width:4,height:4,borderRadius:'50%',background:C.blue,animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}</div>
            Fetching price data…
          </div>
        )}
        {!histLoading && histFetched && <HistoryChart assets={historyData} />}
        {!histLoading && !histFetched && <div style={{ padding: '16px 0', color: C.muted, fontSize: 11 }}>Click <span style={{ color: C.blue }}>Load Chart</span> to fetch 1 year of price history.</div>}
      </div>
      <Divider />
      <div>
        <Label style={{ marginBottom: 12 }}>Outcome Distribution — 500 Simulations · 50 Days</Label>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 64 }}>
          {hist.map((count,i)=>{
            const ratio=count/histMax,mid=buckets/2
            const color=i<mid*0.4?C.red:i>mid*1.6?C.green:C.blue
            return <div key={i} title={`${count}`} style={{ flex:1,height:`${ratio*100}%`,minHeight:2,background:color,opacity:0.4+ratio*0.5,borderRadius:'1px 1px 0 0' }}/>
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 9, color: C.red }}>↓ {fmt(min)}</span>
          <span style={{ fontSize: 9, color: C.muted }}>range</span>
          <span style={{ fontSize: 9, color: C.green }}>↑ {fmt(max)}</span>
        </div>
      </div>
      <Divider />
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
          <Label>Risk Heatmap</Label>
          {anyVol ? <span style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>50% VOL + 50% CONCENTRATION</span> : <Chip color={C.amber}>⚠ Add tickers</Chip>}
        </div>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 3, overflow: 'hidden' }}>
          {heatmap.map((h, i) => {
            const color = RISK_COLOR(h.risk_score)
            return (
              <div key={i} style={{ padding: '12px 14px', borderBottom: i < heatmap.length-1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, color: C.platinum }}>{h.name}</div>
                    {h.ticker && <div style={{ fontSize: 9, color: C.muted, marginTop: 2, letterSpacing: 1 }}>{h.ticker}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color }}>{h.risk_score}</span>
                    <Chip color={color} style={{ marginLeft: 6, fontSize: 8 }}>{SCORE_LABEL(h.risk_score)}</Chip>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>Weight: <span style={{ color: C.platinum }}>{h.weight}%</span></span>
                  <span style={{ fontSize: 10, color: C.muted }}>Ann. Vol: {h.vol_available ? <span style={{ color }}>{h.volatility_pct}%</span> : <span style={{ color: C.faint }}>—</span>}</span>
                </div>
                <div style={{ height: 4, background: C.faint, borderRadius: 2 }}>
                  <div style={{ width: `${h.risk_score}%`, height: '100%', background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}66`, transition: 'width 0.5s' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Portfolio Builder (shared between sidebar and mobile sheet) ──────────────
function PortfolioBuilder({ assets, name, setName, value, setValue, ticker, setTicker, currency, total, fmt, error, onAdd, onRemove }: {
  assets: Asset[]; name: string; setName: (v: string) => void; value: string; setValue: (v: string) => void
  ticker: string; setTicker: (v: string) => void; currency: Currency; total: number
  fmt: (n: number) => string; error: string | null; onAdd: () => void; onRemove: (i: number) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAdd()} placeholder="Asset name" style={iStyle} />
      <input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAdd()} placeholder={`Value in ${currency}`} type="number" min={0} style={iStyle} />
      <div style={{ position: 'relative' }}>
        <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && onAdd()} placeholder="Ticker (AAPL, BTC-USD…)" style={{ ...iStyle, paddingRight: 52 }} />
        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 8, color: C.muted, letterSpacing: 1 }}>OPT</span>
      </div>
      {error && <div style={{ fontSize: 10, color: C.red }}>⚠ {error}</div>}
      <GhostBtn onClick={onAdd} active style={{ width: '100%', padding: '9px', fontSize: 10 }}>+ Add Asset</GhostBtn>
      {assets.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Label>{assets.length} Asset{assets.length > 1 ? 's' : ''}</Label>
            <span style={{ fontSize: 10, color: C.blue, fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{fmt(total)}</span>
          </div>
          {assets.map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 12, color: C.platinum, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {a.name}
                  {a.ticker && <Chip color={C.blue} style={{ fontSize: 8 }}>{a.ticker}</Chip>}
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                  {fmt(a.value)} · <span style={{ color: C.blue }}>{total > 0 ? ((a.value / total) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
              <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: C.faint, cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Page() {
  const isMobile = useIsMobile()
  const [assets, setAssets]   = useState<Asset[]>([])
  const [name, setName]       = useState('')
  const [value, setValue]     = useState('')
  const [ticker, setTicker]   = useState('')
  const [tab, setTab]         = useState<Tab>('analyze')
  const [mobileView, setMobileView] = useState<'main' | 'portfolio'>('main')
  const [scenario, setScenario] = useState<'crash' | 'rally' | 'default'>('crash')
  const [analyzeResult, setAnalyzeResult]   = useState<AnalyzeResult | null>(null)
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null)
  const [riskResult, setRiskResult]         = useState<RiskResult | null>(null)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [rates, setRates]       = useState<Record<Currency, number>>(FALLBACK_RATES)
  const [ratesLabel, setRatesLabel] = useState<string>('LOADING')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(data => {
        const r = data.rates
        setRates({ USD: 1, SEK: r['SEK'] ?? FALLBACK_RATES.SEK, EUR: r['EUR'] ?? FALLBACK_RATES.EUR })
        setRatesLabel(`LIVE ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
      })
      .catch(() => setRatesLabel('OFFLINE'))
  }, [])

  const fmt = makeFmt(currency, rates)
  const total = assets.reduce((s, a) => s + a.value, 0)
  const isLive = ratesLabel.startsWith('LIVE')

  function clearResults() { setAnalyzeResult(null); setScenarioResult(null); setRiskResult(null) }
  function addAsset() {
    const num = parseFloat(value)
    if (!name.trim()) return setError('Name required.')
    if (isNaN(num) || num <= 0) return setError('Value must be positive.')
    setAssets(prev => [...prev, { name: name.trim(), value: toUSD(num, currency, rates), ticker: ticker.trim().toUpperCase() }])
    setName(''); setValue(''); setTicker(''); setError(null); clearResults()
    if (isMobile) setMobileView('main')
  }
  function removeAsset(i: number) { setAssets(prev => prev.filter((_, idx) => idx !== i)); clearResults() }
  async function run() {
    if (assets.length === 0) return setError('Add at least one asset.')
    setLoading(true); setError(null)
    const portfolio = { assets }
    try {
      if (tab === 'analyze') setAnalyzeResult(await callApi<AnalyzeResult>('/analyze', { portfolio }))
      else if (tab === 'scenario') setScenarioResult(await callApi<ScenarioResult>('/scenario', { portfolio, scenario }))
      else setRiskResult(await callApi<RiskResult>('/risk', { portfolio }))
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Backend not responding.') }
    finally { setLoading(false) }
  }

  const TABS = [
    { id: 'analyze' as Tab,  label: 'Analyze',  icon: '○' },
    { id: 'scenario' as Tab, label: 'Scenario', icon: '◇' },
    { id: 'risk' as Tab,     label: 'Risk',     icon: '△' },
  ]
  const activeResult = tab === 'analyze' ? analyzeResult : tab === 'scenario' ? scenarioResult : riskResult
  const SCENARIOS = [
    { id: 'crash' as const,   label: 'CRASH',      sub: '−35%', color: C.red },
    { id: 'rally' as const,   label: 'RALLY',      sub: '+25%', color: C.green },
    { id: 'default' as const, label: 'CORRECTION', sub: '−20%', color: C.amber },
  ]

  const builderProps = { assets, name, setName, value, setValue, ticker, setTicker, currency, total, fmt, error, onAdd: addAsset, onRemove: removeAsset }

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: C.bg }}>

        {/* ── Header ── */}
        <header style={{ borderBottom: `1px solid ${C.border}`, padding: isMobile ? '0 16px' : '0 28px', display: 'flex', alignItems: 'center', height: 52, gap: 12, flexShrink: 0 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 13 : 15, fontWeight: 800, color: C.blue, letterSpacing: 2 }}>PORTFOLIO</div>
          {!isMobile && <div style={{ fontSize: 8, color: C.white, letterSpacing: 2 }}>AI TERMINAL</div>}
          <div style={{ flex: 1 }} />
          {/* Currency */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6 }}>
            {!isMobile && (
              <div style={{ marginRight: 4 }}>
                <div style={{ fontSize: 8, color: C.muted, letterSpacing: 1 }}>RATES</div>
                <div style={{ fontSize: 8, color: isLive ? C.green : C.amber, letterSpacing: 1 }}>{ratesLabel}</div>
              </div>
            )}
            {(['USD', 'SEK', 'EUR'] as Currency[]).map(c => {
              const { flag } = CURRENCY_META[c]
              return (
                <button key={c} onClick={() => setCurrency(c)} style={{
                  background: currency === c ? C.blue : 'transparent',
                  border: `1px solid ${currency === c ? C.blue : C.border}`,
                  borderRadius: 2, color: currency === c ? '#000' : C.muted,
                  cursor: 'pointer', fontFamily: "'Syne',sans-serif",
                  fontSize: isMobile ? 9 : 9, fontWeight: 700, letterSpacing: 1,
                  padding: isMobile ? '4px 7px' : '4px 9px', transition: 'all 0.15s',
                }}>{flag} {c}</button>
              )
            })}
          </div>
        </header>

        {/* ── DESKTOP LAYOUT ── */}
        {!isMobile && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            <aside style={{ width: 268, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}` }}>
                <Label style={{ marginBottom: 14, color: C.white }}>Portfolio Builder</Label>
                <PortfolioBuilder {...builderProps} />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
                {assets.length === 0 && <p style={{ fontSize: 10, color: C.faint, textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>Add your first asset<br />to get started</p>}
              </div>
            </aside>
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 28px', flexShrink: 0 }}>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    background: 'none', border: 'none',
                    borderBottom: tab === t.id ? `2px solid ${C.blue}` : '2px solid transparent',
                    color: tab === t.id ? C.white : C.muted,
                    cursor: 'pointer', padding: '14px 20px',
                    fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700,
                    letterSpacing: 2, textTransform: 'uppercase', transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ color: tab === t.id ? C.blue : C.faint }}>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {tab === 'scenario' && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Label style={{ marginRight: 4 }}>Scenario</Label>
                    {SCENARIOS.map(s => (
                      <button key={s.id} onClick={() => setScenario(s.id)} style={{ background: scenario === s.id ? s.color+'18' : 'transparent', border: `1px solid ${scenario === s.id ? s.color : C.border}`, borderRadius: 2, color: scenario === s.id ? s.color : C.muted, cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '6px 14px', transition: 'all .15s' }}>
                        {s.label} <span style={{ opacity: 0.7 }}>{s.sub}</span>
                      </button>
                    ))}
                  </div>
                )}
                {tab === 'risk' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: C.green+'08', border: `1px solid ${C.green}22`, borderRadius: 2 }}>
                    <span style={{ color: C.green, fontSize: 10 }}>◆</span>
                    <span style={{ fontSize: 10, color: C.muted }}>Fetches live price history from Yahoo Finance for assets with tickers.</span>
                  </div>
                )}
                <div><PrimaryBtn onClick={run} disabled={loading || assets.length === 0}>{loading ? '⟳  Computing…' : `▶  Run ${tab === 'analyze' ? 'Analysis' : tab === 'scenario' ? 'Scenario' : 'Risk Engine'}`}</PrimaryBtn></div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, padding: 24, minHeight: 180 }}>
                  {!activeResult && !loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140, gap: 8 }}>
                      <div style={{ fontSize: 28, color: C.faint }}>◇</div>
                      <p style={{ fontSize: 11, color: C.muted }}>{assets.length === 0 ? 'Add assets in the sidebar to get started.' : 'Press Run to generate results.'}</p>
                    </div>
                  )}
                  {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 140, gap: 12 }}>
                      <div style={{ display: 'flex', gap: 6 }}>{[0,1,2,3].map(i=><div key={i} style={{ width:6,height:6,borderRadius:'50%',background:C.blue,animation:`pulse 1.4s ease-in-out ${i*0.18}s infinite` }}/>)}</div>
                      <p style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>COMPUTING…</p>
                    </div>
                  )}
                  {!loading && tab === 'analyze'  && analyzeResult  && <AnalyzePanel  result={analyzeResult}  assets={assets} fmt={fmt} />}
                  {!loading && tab === 'scenario' && scenarioResult && <ScenarioPanel result={scenarioResult} fmt={fmt} />}
                  {!loading && tab === 'risk'     && riskResult     && <RiskPanel     result={riskResult}     fmt={fmt} assets={assets} />}
                </div>
              </div>
            </main>
          </div>
        )}

        {/* ── MOBILE LAYOUT ── */}
        {isMobile && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Mobile: Portfolio sheet */}
            {mobileView === 'portfolio' && (
              <div className="slide-up" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Label style={{ color: C.white }}>Portfolio Builder</Label>
                  <button onClick={() => setMobileView('main')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20, padding: 4 }}>✕</button>
                </div>
                <PortfolioBuilder {...builderProps} />
              </div>
            )}

            {/* Mobile: Main view */}
            {mobileView === 'main' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Tab bar */}
                <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                  {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                      flex: 1, background: 'none', border: 'none',
                      borderBottom: tab === t.id ? `2px solid ${C.blue}` : '2px solid transparent',
                      color: tab === t.id ? C.white : C.muted,
                      cursor: 'pointer', padding: '12px 4px',
                      fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700,
                      letterSpacing: 1, textTransform: 'uppercase', transition: 'all .15s',
                    }}>
                      <div style={{ color: tab === t.id ? C.blue : C.faint, fontSize: 12, marginBottom: 2 }}>{t.icon}</div>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Asset summary bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 3 }}>
                    <div>
                      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>PORTFOLIO</div>
                      <div style={{ fontSize: 14, fontFamily: "'Syne',sans-serif", fontWeight: 800, color: assets.length > 0 ? C.blue : C.muted }}>{assets.length > 0 ? fmt(total) : 'No assets'}</div>
                    </div>
                    <button onClick={() => setMobileView('portfolio')} style={{ background: C.blue+'18', border: `1px solid ${C.blue}44`, borderRadius: 2, color: C.blue, cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: '6px 12px' }}>
                      {assets.length > 0 ? `${assets.length} ASSET${assets.length > 1 ? 'S' : ''} ›` : '+ ADD ASSETS'}
                    </button>
                  </div>

                  {/* Scenario picker */}
                  {tab === 'scenario' && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {SCENARIOS.map(s => (
                        <button key={s.id} onClick={() => setScenario(s.id)} style={{ flex: '1 1 80px', background: scenario === s.id ? s.color+'18' : 'transparent', border: `1px solid ${scenario === s.id ? s.color : C.border}`, borderRadius: 2, color: scenario === s.id ? s.color : C.muted, cursor: 'pointer', fontFamily: "'Syne',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '8px 6px', transition: 'all .15s', textAlign: 'center' }}>
                          {s.label}<br/><span style={{ fontSize: 9, opacity: 0.7 }}>{s.sub}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {error && <div style={{ fontSize: 11, color: C.red, padding: '8px 12px', background: C.red+'10', border: `1px solid ${C.red}33`, borderRadius: 2 }}>⚠ {error}</div>}

                  <PrimaryBtn onClick={run} disabled={loading || assets.length === 0} fullWidth>
                    {loading ? '⟳  Computing…' : `▶  Run ${tab === 'analyze' ? 'Analysis' : tab === 'scenario' ? 'Scenario' : 'Risk Engine'}`}
                  </PrimaryBtn>

                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, padding: 16, minHeight: 160 }}>
                    {!activeResult && !loading && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 120, gap: 8 }}>
                        <div style={{ fontSize: 24, color: C.faint }}>◇</div>
                        <p style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>{assets.length === 0 ? 'Tap "+ Add Assets" to get started.' : 'Press Run to generate results.'}</p>
                      </div>
                    )}
                    {loading && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 120, gap: 12 }}>
                        <div style={{ display: 'flex', gap: 6 }}>{[0,1,2,3].map(i=><div key={i} style={{ width:6,height:6,borderRadius:'50%',background:C.blue,animation:`pulse 1.4s ease-in-out ${i*0.18}s infinite` }}/>)}</div>
                        <p style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>COMPUTING…</p>
                      </div>
                    )}
                    {!loading && tab === 'analyze'  && analyzeResult  && <AnalyzePanel  result={analyzeResult}  assets={assets} fmt={fmt} />}
                    {!loading && tab === 'scenario' && scenarioResult && <ScenarioPanel result={scenarioResult} fmt={fmt} />}
                    {!loading && tab === 'risk'     && riskResult     && <RiskPanel     result={riskResult}     fmt={fmt} assets={assets} />}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

const iStyle: React.CSSProperties = {
  background: C.faint, border: `1px solid ${C.border}`, borderRadius: 2,
  color: C.platinum, fontFamily: "'Space Mono',monospace", fontSize: 12,
  padding: '9px 10px', width: '100%', outline: 'none', transition: 'border-color .15s',
}