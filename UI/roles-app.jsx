// Roles & Users page — tables + forms + menus
const { useState: useStR, useEffect: useEffR } = React;

// Sample roles data
const ROLES = [
  { code: 'ATLAS_ORCH_ADMIN', name: 'Orchestration Admin', desc: 'Full read/write across all orchestrations, can deploy and recall agents, manage MCP servers, mint signing keys.', users: 14, scope: 'Global', updated: '2026-04-29', status: 'active', risk: 'high', inherits: 4 },
  { code: 'ATLAS_AGENT_OPER', name: 'Agent Operator', desc: 'Operates a defined fleet of agents, can pause/resume runs, replay failures, view audit logs.', users: 38, scope: 'Tenant', updated: '2026-04-22', status: 'active', risk: 'medium', inherits: 2 },
  { code: 'ATLAS_MCP_VIEW', name: 'MCP Viewer', desc: 'Read-only access to MCP server registry, tool definitions and recent invocations.', users: 142, scope: 'Region', updated: '2026-04-18', status: 'active', risk: 'low', inherits: 0 },
  { code: 'ATLAS_POLICY_AUTH', name: 'Policy Author', desc: 'Authors and reviews orchestration policies, guardrails and budget caps. Cannot publish to production.', users: 6, scope: 'Tenant', updated: '2026-04-30', status: 'active', risk: 'medium', inherits: 1 },
  { code: 'ATLAS_AUDITOR', name: 'Compliance Auditor', desc: 'Read-only access to all audit logs, run traces and policy decisions across the tenant.', users: 9, scope: 'Global', updated: '2026-03-12', status: 'active', risk: 'low', inherits: 0 },
  { code: 'ATLAS_DEV_SAND', name: 'Sandbox Developer', desc: 'Build and test agents in isolated sandbox tenants. No production deploy permission.', users: 86, scope: 'Sandbox', updated: '2026-04-26', status: 'active', risk: 'low', inherits: 1 },
  { code: 'ATLAS_INC_RESP', name: 'Incident Responder', desc: 'Time-bound emergency access to halt agents, rotate keys and trigger global circuit-breakers.', users: 4, scope: 'Global', updated: '2026-04-30', status: 'JIT', risk: 'high', inherits: 3 },
  { code: 'ATLAS_BILL_MGR', name: 'Billing Manager', desc: 'Manages spend caps, model quotas, and per-team token budgets across the tenant.', users: 5, scope: 'Tenant', updated: '2026-04-15', status: 'active', risk: 'medium', inherits: 0 },
];

const PERMS_FOR_SELECTED = [
  { perm: 'orchestrations.run.start', label: 'Start Orchestration Run', inheritedFrom: '—', inherited: 'Direct', code: 'ATLAS_ORCH_RUN' },
  { perm: 'orchestrations.run.cancel', label: 'Cancel Run', inheritedFrom: 'Agent Operator', inherited: 'Inherited', code: 'ATLAS_ORCH_RUN' },
  { perm: 'orchestrations.run.replay', label: 'Replay Failed Run', inheritedFrom: 'Agent Operator', inherited: 'Inherited', code: 'ATLAS_ORCH_RUN' },
  { perm: 'agents.deploy', label: 'Deploy Agent to Production', inheritedFrom: '—', inherited: 'Direct', code: 'ATLAS_AGENT_DEPLOY' },
  { perm: 'agents.recall', label: 'Recall / Halt Agent', inheritedFrom: 'Incident Responder', inherited: 'Inherited', code: 'ATLAS_AGENT_DEPLOY' },
  { perm: 'mcp.servers.register', label: 'Register MCP Server', inheritedFrom: '—', inherited: 'Direct', code: 'ATLAS_MCP_MANAGE' },
  { perm: 'mcp.tools.attach', label: 'Attach Tool to Agent', inheritedFrom: 'MCP Manager', inherited: 'Inherited', code: 'ATLAS_MCP_MANAGE' },
  { perm: 'policies.publish', label: 'Publish Policy', inheritedFrom: '—', inherited: 'Direct', code: 'ATLAS_POL_PUB' },
  { perm: 'secrets.mint', label: 'Mint Signing Key', inheritedFrom: '—', inherited: 'Direct', code: 'ATLAS_SEC_MINT' },
  { perm: 'audit.export', label: 'Export Audit Log', inheritedFrom: 'Auditor', inherited: 'Inherited', code: 'ATLAS_AUDIT' },
];

function CreateAgentModal({ onClose }) {
  const [step, setStep] = useStR(1);
  const [agentName, setAgentName] = useStR('atlas-research-v5');
  const [model, setModel] = useStR('claude-4-sonnet');
  const [tools, setTools] = useStR(['web-search', 'vector-rag']);
  const [policy, setPolicy] = useStR('strict-pii');
  const [budget, setBudget] = useStR(50);

  return (
    <div className="modal-shade">
      <div className="modal modal-lg">
        <div className="modal-head">
          <div>
            <div className="eyebrow eyebrow-cyan">Compose · Agent Definition</div>
            <h2 className="modal-title serif">Deploy a new <em>agent</em></h2>
          </div>
          <button className="modal-close" onClick={onClose}><Icons.x size={18}/></button>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {['Identity','Model & Tools','Policies','Review'].map((s,i) => (
            <div key={s} className={`step ${i+1===step?'active':''} ${i+1<step?'done':''}`}>
              <div className="step-num">{i+1<step ? <Icons.check size={11}/> : i+1}</div>
              <div className="step-l">{s}</div>
            </div>
          ))}
        </div>

        <div className="modal-body">
          {step===1 && (
            <div className="form-grid">
              <div className="form-row">
                <label>Agent name <span className="req">*</span></label>
                <div className="input-wrap dark">
                  <Icons.agent size={14} className="input-icon"/>
                  <input value={agentName} onChange={e=>setAgentName(e.target.value)}/>
                </div>
                <span className="hint">Lowercase, hyphenated. Becomes the principal name.</span>
              </div>
              <div className="form-row">
                <label>Tenant scope <span className="req">*</span></label>
                <select className="select dark">
                  <option>atlas-prod (current)</option>
                  <option>atlas-staging</option>
                  <option>atlas-sandbox</option>
                </select>
              </div>
              <div className="form-row">
                <label>Description</label>
                <textarea className="textarea dark" rows="3" defaultValue="Research-oriented agent that synthesizes briefings from CRM, web and internal docs."/>
              </div>
              <div className="form-row span-2">
                <label>Tags</label>
                <div className="tag-input">
                  {['research','briefings','external','tier-1'].map(t => (
                    <span key={t} className="tag">{t}<Icons.x size={10}/></span>
                  ))}
                  <input placeholder="Add tag…" className="tag-add"/>
                </div>
              </div>
              <div className="form-row span-2">
                <label className="checkrow">
                  <span className="check on"><Icons.check size={10}/></span>
                  Enable observability tracing (OpenTelemetry)
                </label>
                <label className="checkrow">
                  <span className="check on"><Icons.check size={10}/></span>
                  Allow human-in-the-loop interventions
                </label>
                <label className="checkrow">
                  <span className="check"></span>
                  Require dual-approval for production deploys
                </label>
              </div>
            </div>
          )}

          {step===2 && (
            <div className="form-grid">
              <div className="form-row">
                <label>Primary model <span className="req">*</span></label>
                <div className="model-grid">
                  {[
                    {n:'claude-4-sonnet',v:'$3 / 1M in', best:true},
                    {n:'gpt-4o',v:'$5 / 1M in'},
                    {n:'gemini-2-pro',v:'$1.2 / 1M in'},
                    {n:'llama-3.1-405b',v:'self-hosted'},
                  ].map(m => (
                    <button key={m.n} className={`model-card ${model===m.n?'sel':''}`} onClick={()=>setModel(m.n)}>
                      <div className="model-card-head">
                        <span className="mono">{m.n}</span>
                        {m.best && <span className="model-best">recommended</span>}
                      </div>
                      <span className="model-cost mono">{m.v}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <label>Fallback model</label>
                <select className="select dark"><option>gpt-4o-mini (auto-route on 5xx)</option></select>
              </div>
              <div className="form-row">
                <label>Temperature</label>
                <div className="slider-row">
                  <input type="range" min="0" max="100" defaultValue="20"/>
                  <span className="mono">0.20</span>
                </div>
              </div>
              <div className="form-row span-2">
                <label>MCP tools attached <span className="req">*</span></label>
                <div className="tools-grid">
                  {[
                    {k:'web-search',l:'Web Search',d:'mcp/web-search · public'},
                    {k:'vector-rag',l:'Vector RAG',d:'mcp/vector-rag · internal docs'},
                    {k:'crm-read',l:'CRM Read',d:'mcp/salesforce · scoped'},
                    {k:'code-exec',l:'Code Sandbox',d:'mcp/code-exec · ephemeral'},
                    {k:'file-write',l:'File Write',d:'mcp/files · drafts only'},
                    {k:'email-send',l:'Email Send',d:'mcp/notify · approval req'},
                  ].map(t => {
                    const on = tools.includes(t.k);
                    return (
                      <button key={t.k} type="button"
                              className={`tool-card ${on?'sel':''}`}
                              onClick={()=>setTools(s => s.includes(t.k) ? s.filter(x=>x!==t.k) : [...s, t.k])}>
                        <div className="tool-head">
                          <span className={`check ${on?'on':''}`}>{on && <Icons.check size={10}/>}</span>
                          <span className="tool-l">{t.l}</span>
                        </div>
                        <span className="tool-d mono">{t.d}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step===3 && (
            <div className="form-grid">
              <div className="form-row span-2">
                <label>Guardrail policy <span className="req">*</span></label>
                <div className="radio-stack">
                  {[
                    {k:'strict-pii',l:'Strict — PII + Toxicity + Off-topic',d:'Default for customer-facing agents. Blocks anything outside policy.'},
                    {k:'std',l:'Standard — PII redaction + Toxicity',d:'Recommended for most internal use cases.'},
                    {k:'permissive',l:'Permissive — log only',d:'For research and red-team agents. All decisions logged.'},
                  ].map(p => (
                    <label key={p.k} className={`radio-row ${policy===p.k?'sel':''}`}>
                      <input type="radio" name="policy" checked={policy===p.k} onChange={()=>setPolicy(p.k)}/>
                      <span className="radio-dot"></span>
                      <div>
                        <div className="radio-l">{p.l}</div>
                        <div className="radio-d">{p.d}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <label>Daily token budget</label>
                <div className="slider-row">
                  <input type="range" min="0" max="200" value={budget} onChange={e=>setBudget(+e.target.value)}/>
                  <span className="mono">${budget}.00</span>
                </div>
                <span className="hint">Hard cap. Auto-pauses agent when reached.</span>
              </div>
              <div className="form-row">
                <label>Rate limit</label>
                <div className="dual-input">
                  <input className="input dark" defaultValue="120"/>
                  <span className="ink-soft">requests / minute</span>
                </div>
              </div>
            </div>
          )}

          {step===4 && (
            <div className="review">
              <div className="review-row"><span className="eyebrow">Name</span><span className="mono">{agentName}</span></div>
              <div className="review-row"><span className="eyebrow">Model</span><span className="mono">{model}</span></div>
              <div className="review-row"><span className="eyebrow">Tools</span><span className="mono">{tools.join(', ')}</span></div>
              <div className="review-row"><span className="eyebrow">Policy</span><span className="mono">{policy}</span></div>
              <div className="review-row"><span className="eyebrow">Budget</span><span className="mono">${budget}/day</span></div>
              <div className="review-warn">
                <Icons.alert size={14}/>
                <span>Deploy will roll out as canary (5%) for 4 hours, then promote automatically if quality holds.</span>
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <div className="modal-foot-l">
            <span className="eyebrow">Step {step} / 4</span>
          </div>
          <div className="modal-foot-r">
            <button className="btn" onClick={onClose}>Cancel</button>
            {step>1 && <button className="btn" onClick={()=>setStep(s=>s-1)}><Icons.chevL size={12}/> Back</button>}
            {step<4 && <button className="btn btn-primary" onClick={()=>setStep(s=>s+1)}>Next <Icons.chevR size={12}/></button>}
            {step===4 && <button className="btn btn-primary"><Icons.bolt size={12}/> Deploy as canary</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function RolesPage() {
  const [selected, setSelected] = useStR(0);
  const [showCreate, setShowCreate] = useStR(false);
  const [search, setSearch] = useStR('');
  const [scope, setScope] = useStR('All');
  const [showCols, setShowCols] = useStR(false);
  const [view, setView] = useStR('table'); // table | form

  const filtered = ROLES.filter(r =>
    (search === '' || r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase())) &&
    (scope === 'All' || r.scope === scope)
  );

  return (
    <AppShell active="roles" breadcrumb={['Govern', 'Roles & Users', 'Roles']}
      title={
        <div className="page-title-row">
          <div>
            <h1 className="page-title serif">Roles &amp; access <em>policies</em></h1>
            <p className="page-sub">Define who can do what across orchestrations, agents, MCP servers and policies. Inherits map to OCI Fusion-style hierarchical permissions.</p>
          </div>
          <div className="page-controls">
            <button className="btn"><Icons.download size={13}/> Export</button>
            <button className="btn"><Icons.copy size={13}/> Compare</button>
            <button className="btn btn-primary" onClick={()=>setShowCreate(true)}><Icons.plus size={13}/> Create role</button>
          </div>
        </div>
      }
    >
      <div className="roles-content">

        {/* Sub-nav tabs */}
        <div className="dash-tabs">
          {['Roles','Users','Service Principals','Groups','Sessions','Sign-on Policies','Audit'].map((t,i) => (
            <button key={t} className={`dash-tab ${i===0?'active':''}`}>{t}</button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="tt-left">
            <div className="search-input">
              <Icons.search size={13}/>
              <input placeholder="Search by role name or code…" value={search} onChange={e=>setSearch(e.target.value)}/>
              {search && <button onClick={()=>setSearch('')} className="search-clear"><Icons.x size={11}/></button>}
            </div>
            <div className="filter-chip">
              Scope <Icons.chevD size={11}/>
              <select value={scope} onChange={e=>setScope(e.target.value)}>
                <option>All</option><option>Global</option><option>Tenant</option><option>Region</option><option>Sandbox</option>
              </select>
            </div>
            <div className="filter-chip">Status: Active <Icons.chevD size={11}/></div>
            <div className="filter-chip">Risk: Any <Icons.chevD size={11}/></div>
            <button className="filter-add"><Icons.plus size={11}/> Add filter</button>
          </div>
          <div className="tt-right">
            <span className="results-count">{filtered.length} of {ROLES.length} roles</span>
            <button className="ic-btn" onClick={()=>setShowCols(s=>!s)} style={{position:'relative'}}>
              <Icons.sliders size={13}/>
              {showCols && (
                <div className="col-menu">
                  <div className="col-menu-head">Visible columns</div>
                  {['Code','Name','Description','Users','Scope','Risk','Inherits','Updated','Status'].map((c,i) => (
                    <label key={c} className="col-row"><span className={`check ${i!==2?'on':''}`}>{i!==2 && <Icons.check size={9}/>}</span>{c}</label>
                  ))}
                </div>
              )}
            </button>
            <div className="seg">
              <SegBtn active={view==='table'} onClick={()=>setView('table')}><Icons.table size={12}/></SegBtn>
              <SegBtn active={view==='form'} onClick={()=>setView('form')}><Icons.doc size={12}/></SegBtn>
            </div>
          </div>
        </div>

        {/* Table + Detail split */}
        <div className="roles-split">
          <div className="roles-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{width:32}}><span className="check"></span></th>
                  <th className="sortable">Code <Icons.chevU size={10}/></th>
                  <th className="sortable">Role name</th>
                  <th>Description</th>
                  <th className="num">Users</th>
                  <th>Scope</th>
                  <th>Risk</th>
                  <th className="num">Inherits</th>
                  <th>Updated</th>
                  <th>Status</th>
                  <th style={{width:32}}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.code} className={selected===i?'sel':''} onClick={()=>setSelected(i)}>
                    <td><span className={`check ${selected===i?'on':''}`}>{selected===i && <Icons.check size={9}/>}</span></td>
                    <td className="mono code">{r.code}</td>
                    <td><strong>{r.name}</strong></td>
                    <td className="td-desc">{r.desc}</td>
                    <td className="num mono">{r.users}</td>
                    <td><span className={`scope-pill scope-${r.scope.toLowerCase()}`}>{r.scope}</span></td>
                    <td><span className={`risk risk-${r.risk}`}>● {r.risk}</span></td>
                    <td className="num mono">{r.inherits}</td>
                    <td className="mono small">{r.updated}</td>
                    <td>
                      {r.status === 'JIT' ?
                        <span className="pill pill-warn"><span className="dot"></span>JIT</span> :
                        <span className="pill pill-ok"><span className="dot"></span>active</span>}
                    </td>
                    <td><button className="ic-btn"><Icons.more size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <span className="ink-soft">Showing 1–{filtered.length} of {ROLES.length}</span>
              <div className="page-controls-row">
                <button className="ic-btn"><Icons.chevL size={13}/></button>
                <button className="page-btn active">1</button>
                <button className="page-btn">2</button>
                <button className="page-btn">3</button>
                <span className="ink-soft">…</span>
                <button className="page-btn">12</button>
                <button className="ic-btn"><Icons.chevR size={13}/></button>
                <span className="ink-soft" style={{marginLeft:8}}>Rows:</span>
                <select className="select-mini">
                  <option>20</option><option>50</option><option>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Detail panel */}
          <div className="role-detail">
            <div className="rd-head">
              <div>
                <div className="eyebrow eyebrow-cyan">Selected role</div>
                <h2 className="rd-title serif">{ROLES[selected].name}</h2>
                <code className="rd-code mono">{ROLES[selected].code}</code>
              </div>
              <div className="rd-actions">
                <button className="ic-btn"><Icons.pencil size={13}/></button>
                <button className="ic-btn"><Icons.copy size={13}/></button>
                <button className="ic-btn"><Icons.trash size={13}/></button>
              </div>
            </div>

            <p className="rd-desc">{ROLES[selected].desc}</p>

            <div className="rd-meta">
              <div><span className="eyebrow">Scope</span><span>{ROLES[selected].scope}</span></div>
              <div><span className="eyebrow">Users</span><span className="mono">{ROLES[selected].users}</span></div>
              <div><span className="eyebrow">Risk</span><span className={`risk risk-${ROLES[selected].risk}`}>● {ROLES[selected].risk}</span></div>
              <div><span className="eyebrow">Updated</span><span className="mono">{ROLES[selected].updated}</span></div>
            </div>

            {/* Tabs in detail */}
            <div className="rd-tabs">
              {['Permissions','Users','Inheritance','Conditions','Audit'].map((t,i) => (
                <button key={t} className={`rd-tab ${i===0?'active':''}`}>{t}</button>
              ))}
            </div>

            <div className="rd-section">
              <div className="rd-section-head">
                <span>Permissions ({PERMS_FOR_SELECTED.length})</span>
                <div className="seg-mini">
                  <button className="active">All</button><button>Direct</button><button>Inherited</button>
                </div>
              </div>
              <table className="data-table tight">
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th>Role Code</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMS_FOR_SELECTED.map(p => (
                    <tr key={p.perm}>
                      <td><div className="perm-cell"><div className="perm-l">{p.label}</div><div className="perm-k mono">{p.perm}</div></div></td>
                      <td className="mono small">{p.code}</td>
                      <td>
                        <span className={`pill ${p.inherited==='Direct'?'pill-info':'pill-ok'}`}>
                          <span className="dot"></span>{p.inherited}
                          {p.inheritedFrom !== '—' && <span className="ink-soft" style={{marginLeft:6}}>· {p.inheritedFrom}</span>}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sign-on policy form */}
        <div className="form-card">
          <div className="form-card-head">
            <div>
              <div className="eyebrow eyebrow-cyan">Form · Sign-on policy</div>
              <h2 className="serif" style={{margin:'8px 0 2px',fontSize:22}}>Configure access conditions</h2>
              <p className="ink-soft" style={{fontSize:12,margin:0}}>Apply to <strong style={{color:'var(--ink)'}}>{ROLES[selected].name}</strong>. Changes are previewed against the last 7 days of audit data.</p>
            </div>
            <div className="form-card-status">
              <span className="pill pill-warn"><span className="dot dot-pulse"></span>preview · unpublished</span>
            </div>
          </div>

          <div className="form-card-body">
            <div className="form-section">
              <div className="form-section-head">
                <span className="form-step-num">01</span>
                <h3 className="form-section-title">Authentication factors</h3>
                <span className="ink-soft small">required</span>
              </div>
              <div className="form-grid">
                <div className="form-row">
                  <label>Primary factor</label>
                  <select className="select dark"><option>Federated SSO (Microsoft Entra)</option><option>Password + MFA</option><option>Passkey only</option></select>
                </div>
                <div className="form-row">
                  <label>Step-up factor</label>
                  <select className="select dark"><option>Hardware passkey</option><option>TOTP (Google Authenticator)</option><option>Push approval</option></select>
                </div>
                <div className="form-row">
                  <label>Step-up trigger</label>
                  <div className="checkrow-stack">
                    <label className="checkrow"><span className="check on"><Icons.check size={10}/></span>Risky network (TOR / unknown ASN)</label>
                    <label className="checkrow"><span className="check on"><Icons.check size={10}/></span>Action: agents.deploy or secrets.mint</label>
                    <label className="checkrow"><span className="check"></span>Time: outside 09:00–18:00 local</label>
                  </div>
                </div>
                <div className="form-row">
                  <label>Session lifetime</label>
                  <div className="dual-input">
                    <input className="input dark" defaultValue="8"/>
                    <select className="select dark inline"><option>hours</option><option>days</option></select>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-head">
                <span className="form-step-num">02</span>
                <h3 className="form-section-title">Network &amp; device posture</h3>
              </div>
              <div className="form-grid">
                <div className="form-row span-2">
                  <label>Allowed networks</label>
                  <div className="cidr-list">
                    {['10.0.0.0/8','172.16.0.0/12','203.0.113.0/24'].map(c => (
                      <span key={c} className="cidr-chip"><span className="mono">{c}</span><Icons.x size={10}/></span>
                    ))}
                    <input className="cidr-add" placeholder="Add CIDR…"/>
                  </div>
                </div>
                <div className="form-row">
                  <label>Device trust</label>
                  <select className="select dark"><option>Managed devices only (MDM-enrolled)</option></select>
                </div>
                <div className="form-row">
                  <label>Geo restriction</label>
                  <select className="select dark"><option>Allow: US, EU, UK, JP, AU</option></select>
                </div>
                <div className="form-row span-2">
                  <label className="toggle-row">
                    <span>Block impossible travel</span>
                    <span className="toggle on"><span className="toggle-knob"></span></span>
                  </label>
                  <label className="toggle-row">
                    <span>Require attestation for production tenants</span>
                    <span className="toggle on"><span className="toggle-knob"></span></span>
                  </label>
                  <label className="toggle-row">
                    <span>Allow service-principal grants</span>
                    <span className="toggle"><span className="toggle-knob"></span></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-head">
                <span className="form-step-num">03</span>
                <h3 className="form-section-title">Approvals &amp; just-in-time</h3>
              </div>
              <div className="form-grid">
                <div className="form-row">
                  <label>Activation type</label>
                  <div className="radio-stack horizontal">
                    {[
                      {k:'always',l:'Always assigned'},
                      {k:'jit',l:'Just-in-time (recommended)', sel:true},
                      {k:'break',l:'Break-glass only'},
                    ].map(o => (
                      <label key={o.k} className={`radio-row ${o.sel?'sel':''}`}>
                        <input type="radio" name="act"/>
                        <span className="radio-dot"></span>
                        <span>{o.l}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-row">
                  <label>Max activation duration</label>
                  <div className="dual-input">
                    <input className="input dark" defaultValue="4"/>
                    <span className="ink-soft">hours</span>
                  </div>
                </div>
                <div className="form-row">
                  <label>Approver chain</label>
                  <div className="approver-chain">
                    <div className="approver"><div className="ap-num">1</div><div className="ap-l">Direct manager</div></div>
                    <div className="ap-arrow"><Icons.chevR size={11}/></div>
                    <div className="approver"><div className="ap-num">2</div><div className="ap-l">Security oncall</div></div>
                    <div className="ap-arrow"><Icons.chevR size={11}/></div>
                    <button className="ap-add"><Icons.plus size={11}/> Add</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-card-foot">
            <div className="form-foot-l">
              <Icons.info size={13}/>
              <span className="ink-soft small">When published, this policy will affect <strong style={{color:'var(--ink)'}}>{ROLES[selected].users} users</strong> and <strong style={{color:'var(--accent-amber)'}}>14 service principals</strong>.</span>
            </div>
            <div className="form-foot-r">
              <button className="btn">Discard changes</button>
              <button className="btn">Save draft</button>
              <button className="btn btn-primary">Publish policy</button>
            </div>
          </div>
        </div>

        {/* Footer link */}
        <div className="dash-foot">
          <a href="dashboard.html" className="dash-foot-link"><Icons.chart size={14}/> Back to dashboard</a>
          <a href="login.html" className="dash-foot-link"><Icons.lock size={14}/> Sign out</a>
        </div>
      </div>

      {showCreate && <CreateAgentModal onClose={()=>setShowCreate(false)}/>}
    </AppShell>
  );
}

function SegBtn({ children, active, onClick }) {
  return <button className={`segbtn ${active?'active':''}`} onClick={onClick}>{children}</button>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<RolesPage/>);
