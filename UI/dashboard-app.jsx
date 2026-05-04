// Dashboard page
const { useState: useStateD, useEffect: useEffectD } = React;
const { AreaChart, BarChart, LineChart, DonutChart, RadialGauge, Heatmap, SankeyChart, RadarChart, ScatterPlot, SparkBar, LiveTrace, TopologyMini, ActivityGrid, CHART_COLORS, PALETTE } = Charts;

// Generate sample data
const gen = (n, base, vol) => Array.from({length:n}, (_,i) => Math.max(0, Math.round(base + Math.sin(i*0.4)*vol*0.5 + (Math.random()-0.5)*vol)));
const xLabels = (n) => Array.from({length:n}, (_,i) => `${(i*4).toString().padStart(2,'0')}h`);

const runVolumeData = Array.from({length: 24}, (_,i) => ({
  x: `${i}h`,
  agents: 80 + Math.sin(i*0.4)*30 + Math.random()*30,
  tools: 60 + Math.sin(i*0.4 + 0.6)*20 + Math.random()*20,
  rag: 40 + Math.sin(i*0.4 + 1)*15 + Math.random()*15,
}));

const tokenSpendData = Array.from({length: 14}, (_,i) => ({
  x: `D${i+1}`,
  gpt: 1200 + Math.random()*800,
  claude: 900 + Math.random()*600,
  gemini: 600 + Math.random()*400,
  llama: 200 + Math.random()*300,
}));

function KPICard({ label, value, delta, deltaUp, sparkData, accent = 'cyan' }) {
  const color = CHART_COLORS[accent];
  return (
    <div className="kpi-card">
      <div className="kpi-card-head">
        <span className="eyebrow">{label}</span>
        <span className={`kpi-delta ${deltaUp ? 'up' : 'down'} mono`}>{deltaUp ? '↑' : '↓'} {delta}</span>
      </div>
      <div className="kpi-card-val serif">{value}</div>
      <div className="kpi-card-spark"><SparkBar data={sparkData} color={color}/></div>
    </div>
  );
}

function Card({ title, subtitle, eyebrow, controls, children, className = '', icon }) {
  const I = icon ? Icons[icon] : null;
  return (
    <div className={`dash-card ${className}`}>
      <div className="dash-card-head">
        <div className="dash-card-titles">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <div className="dash-card-title-row">
            {I && <I size={14}/>}
            <h3 className="dash-card-title">{title}</h3>
          </div>
          {subtitle && <div className="dash-card-sub">{subtitle}</div>}
        </div>
        {controls && <div className="dash-card-ctrl">{controls}</div>}
      </div>
      <div className="dash-card-body">{children}</div>
    </div>
  );
}

function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((it,i) => (
        <span key={i} className="legend-item">
          <span className="legend-swatch" style={{background: it.color || PALETTE[i]}}></span>
          {it.label}
        </span>
      ))}
    </div>
  );
}

function SegBtn({ children, active, onClick }) {
  return <button className={`segbtn ${active?'active':''}`} onClick={onClick}>{children}</button>;
}

function Dashboard() {
  const [range, setRange] = useStateD('24h');
  const [tab, setTab] = useStateD('overview');

  return (
    <AppShell active="overview" breadcrumb={['Operate', 'Overview']}
      title={
        <div className="page-title-row">
          <div>
            <h1 className="page-title serif">Good afternoon, <em>Kofi</em>.</h1>
            <p className="page-sub">Your fleet is healthy. <span style={{color:'var(--accent-cyan)'}}>187</span> agents online across 38 regions, <span style={{color:'var(--accent-amber)'}}>3</span> open incidents, and an active orchestration backlog of 42.</p>
          </div>
          <div className="page-controls">
            <div className="seg">
              <SegBtn active={range==='1h'} onClick={()=>setRange('1h')}>1H</SegBtn>
              <SegBtn active={range==='24h'} onClick={()=>setRange('24h')}>24H</SegBtn>
              <SegBtn active={range==='7d'} onClick={()=>setRange('7d')}>7D</SegBtn>
              <SegBtn active={range==='30d'} onClick={()=>setRange('30d')}>30D</SegBtn>
            </div>
            <button className="btn"><Icons.refresh size={13}/> Refresh</button>
            <button className="btn"><Icons.download size={13}/> Export</button>
            <button className="btn btn-primary"><Icons.plus size={13}/> Deploy Agent</button>
          </div>
        </div>
      }
    >
      <div className="dash-content">

        {/* Tabs */}
        <div className="dash-tabs">
          {['Overview','Agents','Models','Tools & MCP','Spend','Reliability','Security'].map(t => (
            <button key={t} className={`dash-tab ${tab===t.toLowerCase().split(' ')[0]?'active':''}`} onClick={()=>setTab(t.toLowerCase().split(' ')[0])}>{t}</button>
          ))}
        </div>

        {/* KPI strip */}
        <div className="kpi-strip">
          <KPICard label="Agent Runs · 24h" value="12,481" delta="+18.2%" deltaUp sparkData={gen(24, 50, 30)} accent="cyan"/>
          <KPICard label="MCP Tool Calls" value="4.2M" delta="+9.4%" deltaUp sparkData={gen(24, 40, 25)} accent="cyanBright"/>
          <KPICard label="P95 Latency" value="182ms" delta="-12ms" deltaUp sparkData={gen(24, 60, 20)} accent="mint"/>
          <KPICard label="Token Spend" value="$8,247" delta="+4.1%" deltaUp={false} sparkData={gen(24, 45, 25)} accent="amber"/>
          <KPICard label="Trust Score" value="0.942" delta="+0.03" deltaUp sparkData={gen(24, 55, 10)} accent="violet"/>
          <KPICard label="Guardrail Hits" value="37" delta="+2" deltaUp={false} sparkData={gen(24, 30, 30)} accent="rose"/>
        </div>

        {/* Row 1: Run volume + topology + radial */}
        <div className="dash-grid g-1">
          <Card title="Orchestration Run Volume" eyebrow="Real-time · 24h"
                icon="trend"
                subtitle="Agent invocations stratified by execution layer"
                controls={<Legend items={[
                  {label:'Agent runs', color:CHART_COLORS.cyan},
                  {label:'Tool calls', color:CHART_COLORS.amber},
                  {label:'RAG queries', color:CHART_COLORS.violet},
                ]}/>}>
            <AreaChart data={runVolumeData} height={240}
              series={[
                {key:'agents', color:CHART_COLORS.cyan},
                {key:'tools', color:CHART_COLORS.amber},
                {key:'rag', color:CHART_COLORS.violet},
              ]}/>
          </Card>

          <Card title="Fleet Topology" eyebrow="Mesh · Live"
                icon="network"
                subtitle="MCP gateway · 187 agents · 68 servers">
            <div className="topo-wrap">
              <TopologyMini size={240}/>
              <div className="topo-stats">
                <div><span className="eyebrow">Avg fanout</span><span className="mono">3.2</span></div>
                <div><span className="eyebrow">Edge calls/s</span><span className="mono">486</span></div>
                <div><span className="eyebrow">Hot path</span><span className="mono">core→tools</span></div>
              </div>
            </div>
          </Card>

          <Card title="Plane Reliability" eyebrow="SLO · this hour" icon="shield">
            <div className="gauge-stack">
              <RadialGauge value={99} label="availability" sub="SLO 99.9% · ok" color={CHART_COLORS.mint}/>
              <RadialGauge value={87} label="success rate" sub="vs 90% target" color={CHART_COLORS.cyan}/>
              <RadialGauge value={72} label="error budget" sub="14d window" color={CHART_COLORS.amber}/>
            </div>
          </Card>
        </div>

        {/* Row 2: Sankey, model mix, radar */}
        <div className="dash-grid g-2">
          <Card title="Request Flow · Agent → Tool → Outcome" eyebrow="Sankey · 1h" icon="flow">
            <SankeyChart height={240}
              left={[
                {label:'Research Agents', value: 1280, color:CHART_COLORS.cyan},
                {label:'Sales Copilots', value: 940, color:CHART_COLORS.violet},
                {label:'Code Agents', value: 820, color:CHART_COLORS.mint},
                {label:'Ops Agents', value: 460, color:CHART_COLORS.amber},
              ]}
              right={[
                {label:'Web Search', value: 1100, color:CHART_COLORS.cyan, from:[0,1,3]},
                {label:'CRM Tools', value: 870, color:CHART_COLORS.violet, from:[1,3]},
                {label:'Code Exec', value: 720, color:CHART_COLORS.mint, from:[2]},
                {label:'Vector DB', value: 540, color:CHART_COLORS.cyanBright, from:[0,2]},
                {label:'Human Review', value: 270, color:CHART_COLORS.amber, from:[1,3]},
              ]}/>
          </Card>

          <Card title="Token Spend by Model · 14d" eyebrow="Stacked · USD" icon="bars"
                controls={<Legend items={[
                  {label:'GPT-class'},
                  {label:'Claude'},
                  {label:'Gemini'},
                  {label:'Llama'},
                ]}/>}>
            <BarChart data={tokenSpendData} stacked height={240}
              series={[
                {key:'gpt', color:CHART_COLORS.cyan},
                {key:'claude', color:CHART_COLORS.amber},
                {key:'gemini', color:CHART_COLORS.violet},
                {key:'llama', color:CHART_COLORS.mint},
              ]}/>
          </Card>

          <Card title="Agent Capability Radar" eyebrow="Eval · v4" icon="brain">
            <RadarChart size={240}
              axes={['Reasoning','Tool Use','Latency','Faithfulness','Cost','Recovery','Safety','Determinism']}
              datasets={[
                { name:'atlas-v4', values:[88, 92, 76, 84, 70, 80, 95, 78], color: CHART_COLORS.cyan },
                { name:'atlas-v3', values:[78, 82, 84, 72, 86, 70, 88, 70], color: CHART_COLORS.amber },
              ]}/>
            <Legend items={[
              {label:'atlas-v4 (current)', color:CHART_COLORS.cyan},
              {label:'atlas-v3 (prev)', color:CHART_COLORS.amber},
            ]}/>
          </Card>
        </div>

        {/* Row 3: Heatmap + Donut + Activity */}
        <div className="dash-grid g-3">
          <Card title="Region × Hour Latency Heatmap" eyebrow="P95 ms · 24h" icon="globe">
            <Heatmap rows={6} cols={24} height={200}
              rowLabels={['us-ashburn','us-phoenix','eu-frankfurt','eu-london','ap-tokyo','sa-saopaulo']}
              colLabels={Array.from({length:24}, (_,i) => `${i}`)}
              data={Array.from({length: 6*24}, () => 80 + Math.random()*220)}/>
          </Card>

          <Card title="MCP Server Mix" eyebrow="By calls · 1h" icon="cube">
            <div className="donut-wrap">
              <DonutChart size={200} centerLabel="active" centerValue="68"
                data={[
                  {label:'Search', value:1200, color:CHART_COLORS.cyan},
                  {label:'CRM', value:820, color:CHART_COLORS.violet},
                  {label:'Code', value:640, color:CHART_COLORS.mint},
                  {label:'Vector', value:420, color:CHART_COLORS.amber},
                  {label:'Human', value:200, color:CHART_COLORS.rose},
                ]}/>
              <div className="donut-legend">
                {[
                  {l:'Search · 38%', c:CHART_COLORS.cyan, v:'1.2M'},
                  {l:'CRM · 26%', c:CHART_COLORS.violet, v:'820k'},
                  {l:'Code Exec · 20%', c:CHART_COLORS.mint, v:'640k'},
                  {l:'Vector · 13%', c:CHART_COLORS.amber, v:'420k'},
                  {l:'Human Review · 6%', c:CHART_COLORS.rose, v:'200k'},
                ].map(d => (
                  <div key={d.l} className="dl-row">
                    <span className="legend-swatch" style={{background:d.c}}></span>
                    <span className="dl-l">{d.l}</span>
                    <span className="dl-v mono">{d.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Activity Pulse · 26 weeks" eyebrow="Heatmap · run density" icon="spark">
            <ActivityGrid weeks={26} height={120}/>
            <div className="ap-meta">
              <div><span className="eyebrow">Streak</span><span className="mono">142d</span></div>
              <div><span className="eyebrow">Peak day</span><span className="mono">14,892</span></div>
              <div><span className="eyebrow">Median</span><span className="mono">9,318</span></div>
            </div>
          </Card>
        </div>

        {/* Row 4: Live trace + scatter + status feed */}
        <div className="dash-grid g-4">
          <Card title="Live Latency Trace · gateway" eyebrow="Streaming · ms" icon="bolt">
            <LiveTrace data={gen(180, 60, 50)} height={120} color={CHART_COLORS.cyan}/>
            <div className="lt-meta">
              <span><span className="dot dot-pulse" style={{color:CHART_COLORS.cyan}}></span><span className="mono">streaming · 5s window</span></span>
              <span className="mono">p50 78ms · p95 182ms · p99 412ms</span>
            </div>
          </Card>

          <Card title="Cost vs Quality" eyebrow="Per-agent · last 7d" icon="chart" subtitle="Bubble = volume">
            <ScatterPlot height={200} xLabel="cost / 1k tasks ($)" yLabel="quality (eval score)"
              data={[
                {x: 12, y: 88, s: 30, color:CHART_COLORS.cyan},
                {x: 28, y: 92, s: 50, color:CHART_COLORS.cyan},
                {x: 8, y: 72, s: 80, color:CHART_COLORS.amber},
                {x: 4, y: 64, s: 60, color:CHART_COLORS.amber},
                {x: 22, y: 84, s: 40, color:CHART_COLORS.violet},
                {x: 36, y: 95, s: 25, color:CHART_COLORS.violet},
                {x: 14, y: 80, s: 70, color:CHART_COLORS.mint},
                {x: 18, y: 86, s: 55, color:CHART_COLORS.mint},
                {x: 30, y: 78, s: 35, color:CHART_COLORS.rose},
              ]}/>
          </Card>

          <Card title="Incident & Event Stream" eyebrow="Live · Sev 1-4" icon="alert">
            <div className="event-stream">
              {[
                {sev:'2', tag:'GUARDRAIL', t:'14:41', msg:'PII mask triggered · agent Atlas-CR-7 · redacted 3 spans',color:'amber'},
                {sev:'4', tag:'INFO', t:'14:39', msg:'Auto-scaled mcp-search-pool +6 replicas (load 84%)',color:'cyan'},
                {sev:'2', tag:'POLICY', t:'14:36', msg:'Tool perm denied: "internal-fin/transfer" · principal cs-bot-12',color:'amber'},
                {sev:'3', tag:'RETRY', t:'14:32', msg:'Run #2738 retried · upstream 503 from gemini-flash',color:'violet'},
                {sev:'1', tag:'CRITICAL', t:'14:28', msg:'Region eu-london · gateway p99 4.2s · paged on-call',color:'rose'},
                {sev:'4', tag:'DEPLOY', t:'14:21', msg:'agent atlas-v4.2.1 promoted to canary (5%)',color:'mint'},
                {sev:'4', tag:'INFO', t:'14:14', msg:'Vector index rebuild complete · 12.4M vectors · 38s',color:'cyan'},
              ].map((e,i) => (
                <div key={i} className="event-row">
                  <span className={`event-sev sev-${e.sev}`}>S{e.sev}</span>
                  <span className={`event-tag tag-${e.color}`}>{e.tag}</span>
                  <span className="event-msg">{e.msg}</span>
                  <span className="event-time mono">{e.t}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 5: bar charts and breakdowns */}
        <div className="dash-grid g-5">
          <Card title="Top Agents by Volume" eyebrow="last 24h · invocations" icon="bars">
            <BarChart horizontal height={260}
              data={[
                {x:'atlas-research-v4', a: 4280},
                {x:'atlas-sales-v3', a: 3120},
                {x:'atlas-code-v2', a: 2680},
                {x:'atlas-ops-v1', a: 2240},
                {x:'atlas-rag-v3', a: 1840},
                {x:'atlas-eval-v2', a: 1320},
                {x:'atlas-router-v1', a: 980},
                {x:'atlas-translate-v2', a: 640},
              ]}
              series={[{key:'a', color:CHART_COLORS.cyan}]}/>
          </Card>

          <Card title="Tokens In / Out · per Model" eyebrow="grouped · today" icon="brain"
                controls={<Legend items={[{label:'input'},{label:'output'}]}/>}>
            <BarChart height={260}
              data={[
                {x:'gpt-4o', i: 4200, o: 1800},
                {x:'claude-4', i: 3800, o: 2200},
                {x:'gemini-2', i: 2400, o: 1100},
                {x:'llama-3', i: 1600, o: 900},
                {x:'mistral-l', i: 1100, o: 600},
                {x:'cohere-r', i: 800, o: 420},
              ]}
              series={[
                {key:'i', color:CHART_COLORS.cyan},
                {key:'o', color:CHART_COLORS.amber},
              ]}/>
          </Card>

          <Card title="Quality Score Trend" eyebrow="Eval · 30d" icon="trend">
            <LineChart height={260}
              data={Array.from({length: 30}, (_,i) => ({
                x: `D${i+1}`,
                v4: 80 + Math.sin(i*0.3)*4 + Math.random()*4,
                v3: 76 + Math.sin(i*0.4)*5 + Math.random()*3,
                target: 85,
              }))}
              series={[
                {key:'v4', color:CHART_COLORS.cyan},
                {key:'v3', color:CHART_COLORS.amber},
                {key:'target', color:CHART_COLORS.mint},
              ]}/>
            <Legend items={[
              {label:'atlas-v4', color:CHART_COLORS.cyan},
              {label:'atlas-v3', color:CHART_COLORS.amber},
              {label:'target 85', color:CHART_COLORS.mint},
            ]}/>
          </Card>
        </div>

        {/* Row 6: lower band */}
        <div className="dash-grid g-6">
          <Card title="Active Orchestrations" eyebrow="42 running · 1,284 queued" icon="flow">
            <div className="orch-list">
              {[
                {id:'#2741', name:'Quarterly briefing · Banco Mila', step:'4/5', pct:80, status:'ok'},
                {id:'#2740', name:'Vendor risk eval · NorthWind', step:'2/8', pct:25, status:'ok'},
                {id:'#2739', name:'Customer escalation triage', step:'7/7', pct:100, status:'done'},
                {id:'#2738', name:'Code review · pr-4892', step:'3/4', pct:75, status:'warn'},
                {id:'#2737', name:'Lead enrichment · 200 records', step:'48/200', pct:24, status:'ok'},
                {id:'#2736', name:'Transcript synthesis batch', step:'1/12', pct:8, status:'ok'},
              ].map(o => (
                <div key={o.id} className="orch-row">
                  <span className="orch-id mono">{o.id}</span>
                  <span className="orch-name">{o.name}</span>
                  <span className="orch-step mono">{o.step}</span>
                  <div className="orch-bar"><div className={`orch-bar-fill s-${o.status}`} style={{width: `${o.pct}%`}}></div></div>
                  <span className={`pill pill-${o.status==='warn'?'warn':o.status==='done'?'ok':'info'}`}>{o.status}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Guardrail Composition" eyebrow="last 24h · 37 hits" icon="shield">
            <div className="donut-wrap">
              <DonutChart size={170} centerLabel="hits" centerValue="37"
                data={[
                  {label:'PII', value:14, color:CHART_COLORS.amber},
                  {label:'Toxicity', value:8, color:CHART_COLORS.rose},
                  {label:'Off-topic', value:7, color:CHART_COLORS.violet},
                  {label:'Tool perms', value:5, color:CHART_COLORS.cyan},
                  {label:'Cost cap', value:3, color:CHART_COLORS.mint},
                ]}/>
              <div className="donut-legend small">
                {[
                  {l:'PII redaction', c:CHART_COLORS.amber, v:'14'},
                  {l:'Toxicity', c:CHART_COLORS.rose, v:'8'},
                  {l:'Off-topic', c:CHART_COLORS.violet, v:'7'},
                  {l:'Tool permissions', c:CHART_COLORS.cyan, v:'5'},
                  {l:'Cost cap', c:CHART_COLORS.mint, v:'3'},
                ].map(d => (
                  <div key={d.l} className="dl-row">
                    <span className="legend-swatch" style={{background:d.c}}></span>
                    <span className="dl-l">{d.l}</span>
                    <span className="dl-v mono">{d.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Quick Actions" eyebrow="shortcuts" icon="bolt">
            <div className="qa-grid">
              {[
                {i:'agent', l:'Deploy Agent'},
                {i:'flow', l:'New Orchestration'},
                {i:'cube', l:'Connect MCP'},
                {i:'api', l:'Register Tool'},
                {i:'shield', l:'New Policy'},
                {i:'key', l:'Mint API Key'},
                {i:'user', l:'Invite Member',  href:'roles.html'},
                {i:'doc', l:'View Audit Log'},
              ].map(qa => {
                const I = Icons[qa.i];
                const Wrapper = qa.href ? 'a' : 'button';
                const props = qa.href ? {href: qa.href} : {};
                return (
                  <Wrapper key={qa.l} className="qa-btn" {...props}>
                    <I size={18}/>
                    <span>{qa.l}</span>
                  </Wrapper>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Footer link */}
        <div className="dash-foot">
          <a href="roles.html" className="dash-foot-link">
            <Icons.user size={14}/> View Roles &amp; Users management
            <Icons.arrow size={14}/>
          </a>
          <a href="login.html" className="dash-foot-link">
            <Icons.lock size={14}/> Back to login
          </a>
        </div>
      </div>
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard/>);
