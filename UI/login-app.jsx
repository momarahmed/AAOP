// Login page for Fusion MCP
const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "cyan",
  "particles": 36,
  "showHero": true,
  "showPreview": true,
  "showTicker": true,
  "blobOpacity": 0.5,
  "heroTitle": "One control plane for every agent, model and tool in your stack.",
  "ctaLabel": "Continue · Authorize Session",
  "tenant": "atlas-prod"
}/*EDITMODE-END*/;

const ACCENT_MAP = {
  cyan:   { c: 'oklch(85% 0.16 195)', label: 'Cyan' },
  amber:  { c: 'oklch(80% 0.13 70)',  label: 'Amber' },
  violet: { c: 'oklch(70% 0.13 290)', label: 'Violet' },
  mint:   { c: 'oklch(80% 0.13 160)', label: 'Mint' },
  rose:   { c: 'oklch(70% 0.18 20)',  label: 'Rose' },
};

const TweaksCtx = React.createContext(TWEAK_DEFAULTS);

// Animated background — flowing organic blobs + data lines + agent constellation
function VectorBackground({ particleCount = 36, accent = 'cyan', blobOpacity = 0.5 }) {
  const canvasRef = useRef(null);
  const accentColor = ACCENT_MAP[accent]?.c || ACCENT_MAP.cyan.c;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle network — agents communicating
    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;
    const nodes = Array.from({ length: particleCount }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 1 + Math.random() * 1.8,
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W(), H());
      // Move
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.02;
        if (n.x < 0 || n.x > W()) n.vx *= -1;
        if (n.y < 0 || n.y > H()) n.vy *= -1;
      });
      // Draw connecting lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 180) {
            const alpha = (1 - d / 180) * 0.25;
            ctx.strokeStyle = `oklch(78% 0.14 200 / ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // Draw nodes
      nodes.forEach(n => {
        const glow = 1 + Math.sin(n.pulse) * 0.3;
        ctx.fillStyle = `oklch(85% 0.16 195 / 0.7)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * glow, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `oklch(85% 0.16 195 / 0.15)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * glow * 4, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [particleCount]);

  return (
    <div className="vec-bg">
      {/* Layered organic SVG blobs */}
      <svg className="vec-blobs" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="bgGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="oklch(50% 0.08 195)" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="oklch(28% 0.04 195)" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(85% 0.16 195)" stopOpacity="0"/>
            <stop offset="50%" stopColor="oklch(85% 0.16 195)" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="oklch(85% 0.16 195)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <ellipse cx="200" cy="200" rx="500" ry="320" fill="url(#bgGlow)"/>
        <ellipse cx="1400" cy="800" rx="600" ry="400" fill="url(#bgGlow)"/>

        {/* Organic blob 1 */}
        <path d="M 100 500 C 100 300, 300 200, 500 250 S 800 400, 750 600 S 500 800, 300 750 S 100 700, 100 500 Z"
          fill="oklch(40% 0.05 195 / 0.18)" stroke="oklch(70% 0.1 195 / 0.15)" strokeWidth="1"/>

        {/* Organic blob 2 */}
        <path d="M 1100 100 C 1300 80, 1500 200, 1480 400 S 1300 600, 1100 550 S 950 350, 1000 200 S 1100 100, 1100 100 Z"
          fill="oklch(38% 0.06 200 / 0.2)" stroke="oklch(70% 0.1 200 / 0.18)" strokeWidth="1"/>

        {/* Concentric rings — orbital agent rings */}
        <g transform="translate(800 500)" opacity="0.4">
          <circle r="180" fill="none" stroke="oklch(78% 0.14 200)" strokeWidth="0.5" strokeDasharray="2 6"/>
          <circle r="280" fill="none" stroke="oklch(78% 0.14 200)" strokeWidth="0.5" strokeDasharray="4 12"/>
          <circle r="400" fill="none" stroke="oklch(78% 0.14 200)" strokeWidth="0.4" strokeDasharray="1 8"/>
          <circle r="540" fill="none" stroke="oklch(78% 0.14 200)" strokeWidth="0.3" strokeDasharray="2 16"/>
        </g>

        {/* Flowing data streams */}
        <path d="M -50 700 Q 400 600, 800 700 T 1650 650" fill="none" stroke="url(#lineGrad)" strokeWidth="1.2"/>
        <path d="M -50 760 Q 400 880, 800 800 T 1650 850" fill="none" stroke="url(#lineGrad)" strokeWidth="0.8" opacity="0.6"/>

        {/* Hex grid mesh */}
        <g opacity="0.08">
          {Array.from({length: 20}).map((_,i) =>
            Array.from({length: 12}).map((_,j) => (
              <polygon key={`${i}-${j}`}
                points="20,0 38,11 38,33 20,44 2,33 2,11"
                transform={`translate(${i*60 + (j%2)*30 + 50} ${j*52 + 30})`}
                fill="none" stroke="oklch(85% 0.05 195)" strokeWidth="0.4"/>
            ))
          )}
        </g>
      </svg>
      {/* Animated agent constellation */}
      <canvas ref={canvasRef} className="vec-canvas"></canvas>
      {/* Grid overlay */}
      <div className="vec-grid"></div>
      {/* Vignette */}
      <div className="vec-vignette"></div>
    </div>
  );
}

function Logo({ size = 'md' }) {
  return (
    <div className={`fmcp-logo ${size}`}>
      <svg className="fmcp-mark-svg" width="36" height="36" viewBox="0 0 36 36">
        <defs>
          <linearGradient id="markGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(85% 0.16 195)"/>
            <stop offset="100%" stopColor="oklch(60% 0.12 200)"/>
          </linearGradient>
        </defs>
        {/* Hex outer */}
        <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="url(#markGrad)" strokeWidth="1.5"/>
        {/* Inner connecting nodes */}
        <circle cx="18" cy="10" r="2" fill="oklch(85% 0.16 195)"/>
        <circle cx="10" cy="22" r="2" fill="oklch(85% 0.16 195)"/>
        <circle cx="26" cy="22" r="2" fill="oklch(85% 0.16 195)"/>
        <circle cx="18" cy="18" r="2.5" fill="oklch(85% 0.16 195)"/>
        <line x1="18" y1="10" x2="18" y2="18" stroke="oklch(85% 0.16 195)" strokeWidth="1"/>
        <line x1="10" y1="22" x2="18" y2="18" stroke="oklch(85% 0.16 195)" strokeWidth="1"/>
        <line x1="26" y1="22" x2="18" y2="18" stroke="oklch(85% 0.16 195)" strokeWidth="1"/>
      </svg>
      <div>
        <div className="fmcp-wordmark">Fusion<span style={{color: 'var(--accent-cyan)'}}>·</span>MCP</div>
        <div className="fmcp-sub">Orchestration · AI Agent Platform</div>
      </div>
    </div>
  );
}

function StatusTicker() {
  const [items] = useState([
    { label: 'us-ashburn-1', state: 'ok', latency: '12ms' },
    { label: 'eu-frankfurt-1', state: 'ok', latency: '24ms' },
    { label: 'ap-tokyo-1', state: 'ok', latency: '38ms' },
    { label: 'agent registry', state: 'ok', latency: 'sync' },
    { label: 'mcp gateway', state: 'ok', latency: '4ms' },
  ]);
  return (
    <div className="status-ticker">
      <div className="ticker-label eyebrow">Platform Status · All Systems Operational</div>
      <div className="ticker-items">
        {items.map(i => (
          <div key={i.label} className="ticker-item">
            <span className="ticker-dot"></span>
            <span className="mono">{i.label}</span>
            <span className="ticker-latency mono">{i.latency}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoginCard({ ctaLabel = 'Continue · Authorize Session', initialTenant = 'atlas-prod' }) {
  const [mode, setMode] = useState('credentials'); // credentials | sso | passkey
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('k.osei@fusionmcp.io');
  const [pwd, setPwd] = useState('••••••••••••');
  const [tenant, setTenant] = useState(initialTenant);
  const [keep, setKeep] = useState(true);

  return (
    <div className="login-card">
      <div className="login-card-glow"></div>

      {/* Header */}
      <div className="login-header">
        <div className="login-eyebrow eyebrow eyebrow-cyan">
          <span className="dot dot-pulse" style={{color: 'var(--accent-cyan)'}}></span>
          Secure Tenant Access · v4.2.1
        </div>
        <h1 className="serif login-title">Sign in to your<br/><em>orchestration plane</em></h1>
        <p className="login-sub">Connect to your agents, MCP servers, and orchestration runs across every region.</p>
      </div>

      {/* Mode tabs */}
      <div className="login-tabs">
        <button className={`login-tab ${mode==='credentials'?'active':''}`} onClick={()=>setMode('credentials')}>
          <Icons.user size={14}/> Credentials
        </button>
        <button className={`login-tab ${mode==='sso'?'active':''}`} onClick={()=>setMode('sso')}>
          <Icons.shield size={14}/> Federated SSO
        </button>
        <button className={`login-tab ${mode==='passkey'?'active':''}`} onClick={()=>setMode('passkey')}>
          <Icons.fingerprint size={14}/> Passkey
        </button>
      </div>

      {/* Form */}
      {mode === 'credentials' && (
        <form className="login-form" onSubmit={(e)=>{e.preventDefault(); window.location.href='dashboard.html';}}>
          <div className="field">
            <label>Tenant</label>
            <div className="input-wrap">
              <Icons.cube size={14} className="input-icon"/>
              <input value={tenant} onChange={(e)=>setTenant(e.target.value)} placeholder="your-tenant"/>
              <span className="input-suffix mono">.fusionmcp.io</span>
            </div>
          </div>
          <div className="field">
            <label>User · email or principal</label>
            <div className="input-wrap">
              <Icons.user size={14} className="input-icon"/>
              <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@company.com"/>
            </div>
          </div>
          <div className="field">
            <label>Password <a href="#" className="field-link">Forgot?</a></label>
            <div className="input-wrap">
              <Icons.lock size={14} className="input-icon"/>
              <input type={showPwd?'text':'password'} value={pwd} onChange={(e)=>setPwd(e.target.value)}/>
              <button type="button" className="input-suffix-btn" onClick={()=>setShowPwd(s=>!s)}><Icons.eye size={14}/></button>
            </div>
          </div>

          <label className="checkrow">
            <span className={`check ${keep?'on':''}`} onClick={()=>setKeep(k=>!k)}>{keep && <Icons.check size={10}/>}</span>
            <span>Trust this device for 30 days</span>
            <span className="checkrow-meta mono">MFA required</span>
          </label>

          <button className="btn-pri" type="submit">
            {ctaLabel}
            <Icons.arrow size={14}/>
          </button>

          <div className="form-divider"><span>or sign in with</span></div>

          <div className="provider-row">
            <button type="button" className="provider"><span className="provider-mark">M</span>Microsoft Entra</button>
            <button type="button" className="provider"><span className="provider-mark">G</span>Google Workspace</button>
            <button type="button" className="provider"><span className="provider-mark">O</span>Okta</button>
          </div>
        </form>
      )}

      {mode === 'sso' && (
        <div className="login-form">
          <div className="field">
            <label>Identity provider</label>
            <div className="input-wrap">
              <Icons.globe size={14} className="input-icon"/>
              <input defaultValue="acme-corp.okta.com" placeholder="provider.example.com"/>
            </div>
          </div>
          <div className="sso-list">
            {['Microsoft Entra ID', 'Okta Workforce', 'Google Workspace', 'PingFederate', 'OneLogin', 'SAML 2.0 (custom)'].map(p => (
              <button key={p} className="sso-row">
                <span className="sso-mark">{p[0]}</span>
                <span>{p}</span>
                <Icons.chevR size={14}/>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'passkey' && (
        <div className="login-form passkey-form">
          <div className="passkey-illus">
            <div className="passkey-ring r1"></div>
            <div className="passkey-ring r2"></div>
            <div className="passkey-ring r3"></div>
            <div className="passkey-icon"><Icons.fingerprint size={48} stroke={1.2}/></div>
          </div>
          <div className="passkey-text">
            <div className="serif" style={{fontSize:18}}>Touch your security device</div>
            <p>Awaiting hardware-backed credential. Use a roaming authenticator, platform key, or YubiKey 5 series.</p>
          </div>
          <div className="passkey-meta">
            <div><span className="eyebrow">Method</span><span className="mono">FIDO2 · WebAuthn</span></div>
            <div><span className="eyebrow">Tenant</span><span className="mono">atlas-prod</span></div>
            <div><span className="eyebrow">Origin</span><span className="mono">app.fusionmcp.io</span></div>
          </div>
          <button className="btn-pri" onClick={()=>window.location.href='dashboard.html'}>Authenticate with passkey</button>
        </div>
      )}

      <div className="login-footer">
        <span><Icons.shield size={12}/> SOC 2 · ISO 27001 · HIPAA · FedRAMP Moderate</span>
        <span className="mono">tenant://atlas-prod · region:us-ashburn-1</span>
      </div>
    </div>
  );
}

function PreviewPanel() {
  const [run, setRun] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setRun(r => (r + 1) % 100), 80);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="preview-panel">
      <div className="preview-head">
        <div className="eyebrow eyebrow-amber">
          <span className="dot dot-pulse" style={{color: 'var(--accent-amber)'}}></span>
          Preview Mode · Live Telemetry
        </div>
        <div className="preview-title serif">A glimpse of what's<br/>running inside.</div>
      </div>

      {/* Live agent run preview */}
      <div className="preview-card">
        <div className="pc-head">
          <div className="pc-title">
            <Icons.flow size={14}/>
            <span className="mono">orchestration · run #2741</span>
          </div>
          <span className="pill pill-info"><span className="dot dot-pulse"></span>active</span>
        </div>
        <div className="run-graph">
          <svg viewBox="0 0 320 110" className="rg-svg">
            <defs>
              <linearGradient id="edge" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="oklch(78% 0.14 200)" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="oklch(78% 0.14 200)" stopOpacity="0.7"/>
              </linearGradient>
            </defs>
            {/* Edges */}
            <path d="M 30 55 C 80 55, 80 25, 130 25" stroke="url(#edge)" strokeWidth="1.4" fill="none"/>
            <path d="M 30 55 C 80 55, 80 85, 130 85" stroke="url(#edge)" strokeWidth="1.4" fill="none"/>
            <path d="M 130 25 C 180 25, 180 55, 230 55" stroke="url(#edge)" strokeWidth="1.4" fill="none"/>
            <path d="M 130 85 C 180 85, 180 55, 230 55" stroke="url(#edge)" strokeWidth="1.4" fill="none"/>
            <path d="M 230 55 C 270 55, 270 55, 290 55" stroke="oklch(78% 0.14 200)" strokeWidth="1.6" fill="none" strokeDasharray="3 3" className="rg-dash"/>
            {/* Pulse traveling */}
            <circle r="3" fill="oklch(85% 0.18 195)">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M 30 55 C 80 55, 80 25, 130 25"/>
            </circle>
            {/* Nodes */}
            {[
              {x:30,y:55,l:'plan',c:'cy'},
              {x:130,y:25,l:'tools',c:'cy'},
              {x:130,y:85,l:'rag',c:'cy'},
              {x:230,y:55,l:'verify',c:'amb'},
              {x:290,y:55,l:'·',c:'cy', dim:true},
            ].map((n,i) => (
              <g key={i} transform={`translate(${n.x} ${n.y})`}>
                <circle r="11" fill={n.c==='amb'?'oklch(78% 0.13 70 / 0.15)':'oklch(78% 0.14 200 / 0.15)'} stroke={n.c==='amb'?'oklch(78% 0.13 70)':'oklch(78% 0.14 200)'} strokeWidth="1"/>
                <circle r="3" fill={n.c==='amb'?'oklch(78% 0.13 70)':'oklch(78% 0.14 200)'}/>
                {!n.dim && <text y="26" textAnchor="middle" fill="oklch(82% 0.015 195)" fontSize="8" fontFamily="JetBrains Mono">{n.l}</text>}
              </g>
            ))}
          </svg>
        </div>
        <div className="pc-foot">
          <div className="pc-stat"><span className="eyebrow">step</span><span className="mono">4 / 5</span></div>
          <div className="pc-stat"><span className="eyebrow">tokens</span><span className="mono">48.2k</span></div>
          <div className="pc-stat"><span className="eyebrow">spend</span><span className="mono">$0.184</span></div>
          <div className="pc-stat"><span className="eyebrow">trust</span><span className="mono" style={{color:'var(--ok)'}}>0.94</span></div>
        </div>
      </div>

      {/* Live KPIs sparkline */}
      <div className="preview-card">
        <div className="pc-head">
          <div className="pc-title"><Icons.trend size={14}/><span className="mono">platform · 24h</span></div>
          <span className="mono ink-soft">{run}% sampled</span>
        </div>
        <div className="kpi-row">
          {[
            {l:'agent runs', v:'12,481', d:'+18%', up:true},
            {l:'mcp calls', v:'4.2M', d:'+9%', up:true},
            {l:'p95 latency', v:'182ms', d:'-12ms', up:true},
            {l:'guardrail hits', v:'37', d:'+2', up:false},
          ].map(k=>(
            <div key={k.l} className="kpi">
              <div className="eyebrow">{k.l}</div>
              <div className="kpi-v mono">{k.v}</div>
              <div className={`kpi-d mono ${k.up?'up':'down'}`}>{k.d}</div>
            </div>
          ))}
        </div>
        <div className="spark">
          <svg viewBox="0 0 320 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sp1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(78% 0.14 200)" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="oklch(78% 0.14 200)" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M 0 30 L 20 25 L 40 28 L 60 18 L 80 22 L 100 12 L 120 16 L 140 8 L 160 14 L 180 6 L 200 10 L 220 4 L 240 8 L 260 14 L 280 6 L 300 10 L 320 4 L 320 50 L 0 50 Z" fill="url(#sp1)"/>
            <path d="M 0 30 L 20 25 L 40 28 L 60 18 L 80 22 L 100 12 L 120 16 L 140 8 L 160 14 L 180 6 L 200 10 L 220 4 L 240 8 L 260 14 L 280 6 L 300 10 L 320 4" stroke="oklch(85% 0.16 195)" strokeWidth="1.2" fill="none"/>
          </svg>
        </div>
      </div>

      {/* Active fleet */}
      <div className="preview-card mini-fleet">
        <div className="pc-head">
          <div className="pc-title"><Icons.network size={14}/><span className="mono">agent fleet</span></div>
          <span className="mono ink-soft">187 active</span>
        </div>
        <div className="fleet-grid">
          {Array.from({length: 56}).map((_,i)=> {
            const states = ['ok','ok','ok','ok','ok','warn','ok','ok','ok','ok','idle','ok'];
            const s = states[i % states.length];
            return <span key={i} className={`fleet-cell s-${s}`}></span>;
          })}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, ()=>{}];
  const accent = ACCENT_MAP[t.accent] || ACCENT_MAP.cyan;

  // Apply accent color to root
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-cyan', accent.c);
  }, [accent.c]);

  return (
    <div className="login-shell">
      <VectorBackground particleCount={t.particles} accent={t.accent} blobOpacity={t.blobOpacity}/>

      {/* Top chrome */}
      <header className="top-chrome">
        <Logo/>
        <nav className="top-nav">
          <a href="orchestrations.html">Platform</a>
          <a href="orchestrations.html">Agents</a>
          <a href="orchestrations.html">Documentation</a>
          <a href="orchestrations.html">Status</a>
          <a href="orchestrations.html">Contact</a>
        </nav>
        <div className="top-actions">
          <button className="btn btn-ghost">Request access</button>
        </div>
      </header>

      {/* Main grid */}
      <main className="login-main" style={{
        gridTemplateColumns: t.showHero && t.showPreview
          ? '1fr 460px 380px'
          : t.showHero ? '1fr 460px'
          : t.showPreview ? '460px 380px'
          : '460px'
      }}>
        {t.showHero && (
        <section className="hero">
          <div className="hero-eyebrow eyebrow eyebrow-cyan">
            <span className="hex-mini"></span>
            Fusion MCP · Orchestration Edition · 2026.05
          </div>
          <h1 className="hero-title serif">
            {t.heroTitle}
          </h1>
          <p className="hero-sub">
            Compose deterministic, observable AI orchestrations across MCP servers, internal APIs and humans-in-the-loop.
            Sign in to your tenant to operate the fleet.
          </p>

          <div className="hero-stats">
            <div><div className="hs-num serif">2.4B</div><div className="hs-l">orchestrated calls / month</div></div>
            <div><div className="hs-num serif">99.99<span style={{fontSize:'0.6em'}}>%</span></div><div className="hs-l">platform availability</div></div>
            <div><div className="hs-num serif">38</div><div className="hs-l">global regions</div></div>
          </div>

          <div className="hero-trust">
            <span className="eyebrow">Trusted by enterprises in</span>
            <div className="trust-row">
              {['BANCO·MILA', 'NORTHWIND', 'MERIDIAN', 'KESTREL HEALTH', 'POLARIS LABS', 'OAKVIEW FIN'].map(b => (
                <span key={b} className="trust-mark mono">{b}</span>
              ))}
            </div>
          </div>
        </section>
        )}

        <section className="auth-area">
          <LoginCard ctaLabel={t.ctaLabel} initialTenant={t.tenant}/>
        </section>

        {t.showPreview && (
        <aside className="preview-area">
          <PreviewPanel/>
        </aside>
        )}
      </main>

      {t.showTicker && (
        <footer className="login-foot">
          <StatusTicker/>
        </footer>
      )}

      {/* Tweaks panel */}
      {window.TweaksPanel && (
        <window.TweaksPanel>
          <window.TweakSection label="Layout"/>
          <window.TweakToggle label="Show hero" value={t.showHero} onChange={v=>setTweak('showHero', v)}/>
          <window.TweakToggle label="Show live preview" value={t.showPreview} onChange={v=>setTweak('showPreview', v)}/>
          <window.TweakToggle label="Show status ticker" value={t.showTicker} onChange={v=>setTweak('showTicker', v)}/>
          <window.TweakSection label="Visuals"/>
          <window.TweakRadio label="Accent" value={t.accent}
            options={[{value:'cyan',label:'Cyan'},{value:'amber',label:'Amber'},{value:'violet',label:'Violet'},{value:'mint',label:'Mint'}]}
            onChange={v=>setTweak('accent', v)}/>
          <window.TweakSlider label="Particles" min={0} max={80} step={4} value={t.particles} onChange={v=>setTweak('particles', v)}/>
          <window.TweakSection label="Copy"/>
          <window.TweakText label="Hero headline" value={t.heroTitle} onChange={v=>setTweak('heroTitle', v)}/>
          <window.TweakText label="CTA label" value={t.ctaLabel} onChange={v=>setTweak('ctaLabel', v)}/>
          <window.TweakText label="Default tenant" value={t.tenant} onChange={v=>setTweak('tenant', v)}/>
        </window.TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
