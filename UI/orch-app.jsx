// Orchestrations page — AI UI Builder agent spec viewer
const { useState: useStO, useEffect: useEffO } = React;

const SAMPLE_REQUEST = `Build a customer onboarding flow:
- Lead capture form (name, email, company, use case)
- Auto-enrich via Clearbit
- Score lead with Claude (priority high/med/low)
- If high → notify Slack #sales + create HubSpot deal
- Show success screen with next steps`;

const UI_SCHEMA = {
  "schema": "fusion-mcp/ui-v1",
  "rootId": "page_onboard",
  "components": {
    "page_onboard": {
      "type": "Page",
      "layout": "flex",
      "direction": "column",
      "padding": 32,
      "gap": 24,
      "children": ["hdr_brand", "card_form", "card_status"]
    },
    "hdr_brand": {
      "type": "Header",
      "title": "Welcome — let's get you onboarded",
      "subtitle": "Takes about 90 seconds. We'll route you to the right team automatically."
    },
    "card_form": {
      "type": "Card",
      "title": "Tell us about you",
      "children": ["form_lead"]
    },
    "form_lead": {
      "type": "Form",
      "schema": "lead@1",
      "submitLabel": "Submit & enrich",
      "events": {
        "onSubmit": {
          "workflow": "wf_lead_intake",
          "payload": "$form.values"
        }
      },
      "children": ["fld_name", "fld_email", "fld_company", "fld_usecase"]
    },
    "fld_name":    { "type": "Input", "name": "name",    "label": "Full name",   "required": true },
    "fld_email":   { "type": "Input", "name": "email",   "label": "Work email",  "required": true, "kind": "email" },
    "fld_company": { "type": "Input", "name": "company", "label": "Company",     "required": true },
    "fld_usecase": { "type": "Textarea", "name": "usecase", "label": "What are you trying to build?", "rows": 4 },
    "card_status": {
      "type": "Card",
      "title": "Status",
      "bind": "$state.intake",
      "children": ["status_badge", "status_steps"]
    },
    "status_badge": { "type": "Badge", "bindLabel": "$state.intake.priority" },
    "status_steps": { "type": "Stepper", "bindSteps": "$state.intake.steps" }
  }
};

const WORKFLOW = {
  "schema": "fusion-mcp/workflow-v1",
  "id": "wf_lead_intake",
  "name": "Lead intake & routing",
  "trigger": {
    "type": "webhook",
    "id": "trg_form_submit",
    "ui_event": "form_lead.onSubmit",
    "schema": "lead@1"
  },
  "nodes": [
    {
      "id": "n_validate",
      "type": "schema_validate",
      "schema": "lead@1",
      "next": "n_enrich"
    },
    {
      "id": "n_enrich",
      "type": "http_request",
      "method": "GET",
      "url": "https://person.clearbit.com/v2/combined/find",
      "query": { "email": "{{ $trigger.email }}" },
      "credentials": "clearbit_api_key",
      "next": "n_score"
    },
    {
      "id": "n_score",
      "type": "agent_call",
      "agent": "lead-scorer-v3",
      "model": "claude-4-sonnet",
      "tools": ["mcp/vector-rag", "mcp/firmographics"],
      "input": "$enriched + $trigger",
      "output_schema": { "priority": "enum[high,med,low]", "reason": "string" },
      "next": "n_branch"
    },
    {
      "id": "n_branch",
      "type": "switch",
      "on": "$score.priority",
      "cases": {
        "high": "n_slack_high",
        "med":  "n_hubspot",
        "low":  "n_drip"
      }
    },
    { "id": "n_slack_high", "type": "slack_post", "channel": "#sales", "message": "🎯 High-priority lead: {{ $trigger.name }} ({{ $trigger.company }})", "next": "n_hubspot" },
    { "id": "n_hubspot",    "type": "hubspot_create_deal", "stage": "qualified", "next": "n_callback" },
    { "id": "n_drip",       "type": "marketing_drip", "campaign": "nurture-30", "next": "n_callback" },
    {
      "id": "n_callback",
      "type": "ui_callback",
      "target": "$state.intake",
      "value": {
        "priority": "$score.priority",
        "steps": [
          { "label": "Validated",   "status": "done" },
          { "label": "Enriched",    "status": "done" },
          { "label": "Scored",      "status": "done" },
          { "label": "Routed",      "status": "active" },
          { "label": "Confirmation","status": "pending" }
        ]
      }
    }
  ],
  "credentials": ["clearbit_api_key", "slack_bot_token", "hubspot_api_key"],
  "observability": { "trace": true, "log_level": "info" }
};

function CopyBtn({ text }) {
  const [copied, setCopied] = useStO(false);
  return (
    <button className="copy-btn" onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(()=>setCopied(false), 1400); }}>
      {copied ? <><Icons.check size={11}/> copied</> : <><Icons.copy size={11}/> copy</>}
    </button>
  );
}

function syntaxHighlight(json) {
  // very small JSON highlighter
  const str = JSON.stringify(json, null, 2);
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(?:[^"\\]|\\.)*")(\s*:)/g, '<span class="jk">$1</span>$2')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, (_,s)=>`: <span class="jv-s">${s}</span>`)
    .replace(/:\s*(true|false|null)/g, ': <span class="jv-b">$1</span>')
    .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="jv-n">$1</span>');
}

function NodePill({ node }) {
  const colorMap = {
    webhook: 'cy', schema_validate: 'mint', http_request: 'amber',
    agent_call: 'violet', switch: 'rose', slack_post: 'amber',
    hubspot_create_deal: 'amber', marketing_drip: 'amber', ui_callback: 'cy'
  };
  const c = colorMap[node.type] || 'cy';
  return (
    <div className={`flow-node fn-${c}`}>
      <div className="fn-type mono">{node.type}</div>
      <div className="fn-id mono">{node.id}</div>
    </div>
  );
}

function OrchPage() {
  const [tab, setTab] = useStO('ui');
  const [request, setRequest] = useStO(SAMPLE_REQUEST);
  const [generated, setGenerated] = useStO(true);

  return (
    <AppShell active="orch" breadcrumb={['Compose', 'Orchestrations', 'AI UI Builder']}
      title={
        <div className="page-title-row">
          <div>
            <div className="eyebrow eyebrow-cyan"><span className="dot dot-pulse"></span> Agent · ui-builder-v2 · online</div>
            <h1 className="page-title serif">AI UI &amp; <em>Workflow</em> Builder</h1>
            <p className="page-sub">Describe what you want to build. The agent generates a React drag-and-drop UI schema and a wired Agent workflow — bridged by structured payloads.</p>
          </div>
          <div className="page-controls">
            <button className="btn"><Icons.download size={13}/> Export bundle</button>
            <button className="btn"><Icons.copy size={13}/> Fork</button>
            <button className="btn btn-primary"><Icons.bolt size={13}/> Deploy</button>
          </div>
        </div>
      }
    >
      <div className="orch-content">

        {/* Prompt input */}
        <div className="prompt-card">
          <div className="prompt-head">
            <div className="prompt-title">
              <span className="prompt-mark"><Icons.flow size={14}/></span>
              <div>
                <div className="eyebrow">User Request → Structured Spec</div>
                <div className="serif" style={{fontSize:18, lineHeight:1.2}}>What should we build?</div>
              </div>
            </div>
            <div className="prompt-meta">
              <span className="pill pill-info"><span className="dot"></span>schema · ui-v1 + workflow-v1</span>
              <span className="pill pill-ok"><span className="dot dot-pulse"></span>bridged</span>
            </div>
          </div>
          <textarea className="prompt-input" rows="5"
            value={request} onChange={e=>setRequest(e.target.value)}/>
          <div className="prompt-foot">
            <div className="prompt-chips">
              <span className="prompt-chip">+ form</span>
              <span className="prompt-chip">+ enrichment</span>
              <span className="prompt-chip">+ AI scoring</span>
              <span className="prompt-chip">+ Slack notify</span>
              <span className="prompt-chip">+ HubSpot deal</span>
            </div>
            <button className="btn btn-primary" onClick={()=>setGenerated(true)}>
              <Icons.bolt size={13}/> Generate UI + Workflow
            </button>
          </div>
        </div>

        {/* Output split */}
        {generated && (
          <div className="orch-split">

            {/* Left — drag & drop preview */}
            <div className="builder-panel">
              <div className="builder-head">
                <div className="eyebrow eyebrow-cyan">React Drag-and-Drop · live preview</div>
                <div className="seg">
                  <button className="segbtn active"><Icons.eye size={12}/> Preview</button>
                  <button className="segbtn"><Icons.doc size={12}/> Inspector</button>
                </div>
              </div>

              {/* Component palette */}
              <div className="palette">
                <span className="palette-l eyebrow">Palette</span>
                {['Page','Card','Form','Input','Textarea','Button','Badge','Stepper','Table','Modal'].map(c => (
                  <span key={c} className="palette-item" draggable>
                    <span className="palette-grip">⋮⋮</span>{c}
                  </span>
                ))}
              </div>

              {/* Canvas with rendered UI */}
              <div className="builder-canvas">
                <div className="bc-grid"></div>

                <div className="rendered-ui">
                  <div className="ru-page">
                    <div className="ru-frame ru-frame-page" data-label="page_onboard">
                      <div className="ru-label mono">Page · page_onboard</div>

                      <div className="ru-header">
                        <h2 className="serif" style={{fontSize:22,margin:0}}>Welcome — let's get you onboarded</h2>
                        <p className="ru-sub">Takes about 90 seconds. We'll route you to the right team automatically.</p>
                      </div>

                      <div className="ru-frame ru-frame-card" data-label="card_form">
                        <div className="ru-label mono">Card · card_form</div>
                        <div className="ru-card-title">Tell us about you</div>

                        <div className="ru-frame ru-frame-form" data-label="form_lead">
                          <div className="ru-label mono">Form · form_lead → wf_lead_intake</div>
                          <div className="ru-form-grid">
                            <div className="ru-field"><label>Full name *</label><div className="ru-input">Ada Lovelace</div></div>
                            <div className="ru-field"><label>Work email *</label><div className="ru-input">ada@analytical.io</div></div>
                            <div className="ru-field"><label>Company *</label><div className="ru-input">Analytical Engines Co.</div></div>
                            <div className="ru-field span-2"><label>What are you trying to build?</label><div className="ru-input ru-input-tall">Internal RAG agent over our knowledge base, with Slack triage.</div></div>
                          </div>
                          <button className="ru-submit">Submit &amp; enrich <Icons.arrow size={12}/></button>
                        </div>
                      </div>

                      <div className="ru-frame ru-frame-card" data-label="card_status">
                        <div className="ru-label mono">Card · card_status · bound to $state.intake</div>
                        <div className="ru-card-title">Status</div>
                        <span className="pill pill-ok"><span className="dot"></span>priority · high</span>
                        <div className="ru-stepper">
                          {[
                            {l:'Validated',s:'done'},{l:'Enriched',s:'done'},{l:'Scored',s:'done'},{l:'Routed',s:'active'},{l:'Confirmation',s:'pending'}
                          ].map((s,i)=>(
                            <div key={i} className={`ru-step ru-step-${s.s}`}>
                              <span className="ru-step-dot">{s.s==='done' && <Icons.check size={9}/>}</span>
                              <span>{s.l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — code + workflow */}
            <div className="output-panel">
              <div className="output-tabs">
                <button className={`out-tab ${tab==='ui'?'active':''}`} onClick={()=>setTab('ui')}>
                  <Icons.doc size={12}/> UI Schema (React JSON)
                </button>
                <button className={`out-tab ${tab==='wf'?'active':''}`} onClick={()=>setTab('wf')}>
                  <Icons.flow size={12}/> Agent Workflow
                </button>
                <button className={`out-tab ${tab==='br'?'active':''}`} onClick={()=>setTab('br')}>
                  <Icons.network size={12}/> Bridge Layer
                </button>
              </div>

              {tab==='ui' && (
                <div className="code-block">
                  <div className="code-head">
                    <span className="mono">ui-schema.json</span>
                    <CopyBtn text={JSON.stringify(UI_SCHEMA,null,2)}/>
                  </div>
                  <pre className="code" dangerouslySetInnerHTML={{__html: syntaxHighlight(UI_SCHEMA)}}/>
                </div>
              )}

              {tab==='wf' && (
                <>
                  <div className="flow-canvas">
                    <div className="eyebrow" style={{padding:'12px 14px 0'}}>Workflow Graph · wf_lead_intake</div>
                    <div className="flow-rows">
                      <div className="flow-row">
                        <NodePill node={{type:'webhook', id:'trg_form_submit'}}/>
                        <span className="flow-arrow">→</span>
                        <NodePill node={{type:'schema_validate', id:'n_validate'}}/>
                        <span className="flow-arrow">→</span>
                        <NodePill node={{type:'http_request', id:'n_enrich'}}/>
                        <span className="flow-arrow">→</span>
                        <NodePill node={{type:'agent_call', id:'n_score'}}/>
                        <span className="flow-arrow">→</span>
                        <NodePill node={{type:'switch', id:'n_branch'}}/>
                      </div>
                      <div className="flow-branches">
                        <div className="branch">
                          <span className="branch-l">priority = high</span>
                          <NodePill node={{type:'slack_post', id:'n_slack_high'}}/>
                        </div>
                        <div className="branch">
                          <span className="branch-l">priority = med</span>
                          <NodePill node={{type:'hubspot_create_deal', id:'n_hubspot'}}/>
                        </div>
                        <div className="branch">
                          <span className="branch-l">priority = low</span>
                          <NodePill node={{type:'marketing_drip', id:'n_drip'}}/>
                        </div>
                      </div>
                      <div className="flow-row" style={{justifyContent:'flex-end'}}>
                        <span className="flow-arrow">↘</span>
                        <NodePill node={{type:'ui_callback', id:'n_callback'}}/>
                      </div>
                    </div>
                  </div>
                  <div className="code-block">
                    <div className="code-head">
                      <span className="mono">workflow.json</span>
                      <CopyBtn text={JSON.stringify(WORKFLOW,null,2)}/>
                    </div>
                    <pre className="code" dangerouslySetInnerHTML={{__html: syntaxHighlight(WORKFLOW)}}/>
                  </div>
                </>
              )}

              {tab==='br' && (
                <div className="bridge-panel">
                  <div className="bridge-diag">
                    <div className="bridge-side">
                      <div className="bridge-l eyebrow">Frontend (UI)</div>
                      <div className="bridge-box">
                        <Icons.doc size={16}/>
                        <span className="mono">form_lead.onSubmit</span>
                      </div>
                      <div className="bridge-box dim">
                        <Icons.network size={14}/>
                        <span className="mono">$state.intake</span>
                      </div>
                    </div>
                    <div className="bridge-arrows">
                      <div className="bridge-arrow"><span className="ba-l mono">POST · payload</span><span className="ba-line"></span><Icons.arrow size={14}/></div>
                      <div className="bridge-arrow rev"><Icons.arrow size={14}/><span className="ba-line"></span><span className="ba-l mono">callback · state diff</span></div>
                    </div>
                    <div className="bridge-side">
                      <div className="bridge-l eyebrow">Backend (Agent)</div>
                      <div className="bridge-box">
                        <Icons.bolt size={16}/>
                        <span className="mono">trg_form_submit</span>
                      </div>
                      <div className="bridge-box dim">
                        <Icons.flow size={14}/>
                        <span className="mono">n_callback</span>
                      </div>
                    </div>
                  </div>

                  <div className="bridge-table">
                    <div className="eyebrow" style={{marginBottom:8}}>Event ↔ Workflow Mapping</div>
                    <table className="data-table tight">
                      <thead>
                        <tr><th>UI Event</th><th>Workflow Trigger</th><th>Schema</th><th>Direction</th></tr>
                      </thead>
                      <tbody>
                        <tr><td className="mono small">form_lead.onSubmit</td><td className="mono small">trg_form_submit</td><td className="mono small">lead@1</td><td><span className="pill pill-info"><span className="dot"></span>UI → Agent</span></td></tr>
                        <tr><td className="mono small">$state.intake (write)</td><td className="mono small">n_callback</td><td className="mono small">intake_status@1</td><td><span className="pill pill-ok"><span className="dot"></span>Agent → UI</span></td></tr>
                        <tr><td className="mono small">btn_retry.onClick</td><td className="mono small">trg_retry</td><td className="mono small">retry@1</td><td><span className="pill pill-info"><span className="dot"></span>UI → Agent</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="dash-foot">
          <a href="dashboard.html" className="dash-foot-link"><Icons.chart size={14}/> Dashboard</a>
          <a href="roles.html" className="dash-foot-link"><Icons.user size={14}/> Roles</a>
          <a href="login.html" className="dash-foot-link"><Icons.lock size={14}/> Sign out</a>
        </div>
      </div>
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<OrchPage/>);
