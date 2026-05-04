'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Button, Chip, MenuItem, Select, Stack, TextField, Typography, Alert, IconButton, Tooltip,
} from '@mui/material';
import {
  ReactFlow, ReactFlowProvider, addEdge, applyEdgeChanges, applyNodeChanges,
  Background, BackgroundVariant, Controls, MiniMap, MarkerType,
  type Connection, type Edge, type Node, type NodeChange, type EdgeChange, type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { AppShell } from '@/components/shared/AppShell';
import { FusionCard } from '@/components/shared/Card';
import { StatusPill } from '@/components/shared/StatusPill';
import {
  IconBolt, IconRefresh, IconWorkflow, IconSparkles, IconShield, IconChip,
} from '@/components/shared/Icons';
import { api, unwrapError } from '@/lib/api/client';
import type { WorkflowSummary } from '@/lib/api/types';

type AaopNodeKind =
  | 'trigger.webhook' | 'trigger.cron'
  | 'action.http' | 'action.slack' | 'action.agent_call'
  | 'logic.switch' | 'logic.loop'
  | 'cua.click' | 'cua.type' | 'cua.screenshot'
  | 'mcp.invoke'
  | 'hitl.approval'
  | 'memory.read' | 'memory.write';

const PALETTE: { kind: AaopNodeKind; label: string; tone: 'cyan'|'amber'|'violet'|'mint'|'rose' }[] = [
  { kind: 'trigger.webhook',  label: 'Webhook trigger',  tone: 'cyan'   },
  { kind: 'trigger.cron',     label: 'Schedule (cron)',  tone: 'cyan'   },
  { kind: 'action.http',      label: 'HTTP request',     tone: 'amber'  },
  { kind: 'action.agent_call',label: 'Agent call',       tone: 'violet' },
  { kind: 'action.slack',     label: 'Slack post',       tone: 'amber'  },
  { kind: 'logic.switch',     label: 'Switch / branch',  tone: 'rose'   },
  { kind: 'logic.loop',       label: 'Bounded loop',     tone: 'rose'   },
  { kind: 'cua.click',        label: 'CUA · click',      tone: 'mint'   },
  { kind: 'cua.type',         label: 'CUA · type',       tone: 'mint'   },
  { kind: 'cua.screenshot',   label: 'CUA · screenshot', tone: 'mint'   },
  { kind: 'mcp.invoke',       label: 'MCP · invoke',     tone: 'violet' },
  { kind: 'hitl.approval',    label: 'HITL approval',    tone: 'rose'   },
  { kind: 'memory.read',      label: 'Memory · read',    tone: 'cyan'   },
  { kind: 'memory.write',     label: 'Memory · write',   tone: 'cyan'   },
];

type AaopNodeData = {
  kind: AaopNodeKind;
  label: string;
  config?: Record<string, unknown>;
};
type AaopNode = Node;

function nodeData(n: AaopNode): AaopNodeData {
  return n.data as unknown as AaopNodeData;
}

const DEFAULT_NODES: AaopNode[] = [
  { id: 'trg', type: 'default', position: { x: 60, y: 80 },  data: { kind: 'trigger.webhook', label: 'Webhook trigger' } },
  { id: 'act', type: 'default', position: { x: 320, y: 80 }, data: { kind: 'action.http',     label: 'HTTP request'    } },
];
const DEFAULT_EDGES: Edge[] = [
  { id: 'e1', source: 'trg', target: 'act', markerEnd: { type: MarkerType.ArrowClosed } },
];

export default function DesignerPage() {
  return (
    <ReactFlowProvider>
      <DesignerInner />
    </ReactFlowProvider>
  );
}

function DesignerInner() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [nodes, setNodes] = useState<AaopNode[]>(DEFAULT_NODES);
  const [edges, setEdges] = useState<Edge[]>(DEFAULT_EDGES);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ version: number; hash: string } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const flowRef = useRef<ReactFlowInstance | null>(null);

  const onNodesChange = useCallback((changes: NodeChange[]) =>
    setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) =>
    setEdges((es) => applyEdgeChanges(changes, es)), []);
  const onConnect = useCallback((c: Connection) => setEdges((es) =>
    addEdge({ ...c, markerEnd: { type: MarkerType.ArrowClosed } }, es)), []);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, kind: AaopNodeKind, label: string) => {
    e.dataTransfer.setData('application/aaop-node', JSON.stringify({ kind, label }));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/aaop-node');
    if (!raw || !flowRef.current) return;
    const item = JSON.parse(raw) as { kind: AaopNodeKind; label: string };
    const pos = flowRef.current.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const id = `${item.kind.replace(/\./g, '_')}_${Date.now().toString(36)}`;
    setNodes((nds) => [...nds, {
      id, type: 'default', position: pos,
      data: { kind: item.kind, label: item.label },
    }]);
  };

  const fetchWorkflows = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: WorkflowSummary[] }>('/api/v1/workflows');
      setWorkflows(data.data ?? []);
      if (!selectedId && data.data?.[0]) {
        setSelectedId(data.data[0].id);
        setName(data.data[0].name);
      }
    } catch (e) {
      setError(unwrapError(e).message);
    }
  }, [selectedId]);

  useEffect(() => { void fetchWorkflows(); }, [fetchWorkflows]);

  // Pull latest version graph when a workflow is selected
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ id: string; name: string; current_version?: { graph?: unknown } | null }>(`/api/v1/workflows/${selectedId}`);
        if (cancelled) return;
        setName(data.name);
        const g = (data.current_version?.graph ?? null) as { nodes?: unknown; edges?: unknown } | null;
        if (g && Array.isArray(g.nodes) && Array.isArray(g.edges)) {
          const ns: AaopNode[] = (g.nodes as Array<{ id: string; kind?: AaopNodeKind; type?: string; label?: string; position?: {x:number;y:number}; config?: Record<string,unknown> }>).map((n, i) => ({
            id: n.id,
            type: 'default',
            position: n.position ?? { x: 60 + i * 220, y: 80 + (i % 2) * 80 },
            data: { kind: (n.kind ?? n.type ?? 'action.http') as AaopNodeKind, label: n.label ?? n.id, config: n.config },
          }));
          const es: Edge[] = (g.edges as Array<{ id?: string; from?: string; to?: string; source?: string; target?: string }>).map((e, i) => ({
            id: e.id ?? `e${i}`,
            source: e.source ?? e.from ?? '',
            target: e.target ?? e.to ?? '',
            markerEnd: { type: MarkerType.ArrowClosed },
          })).filter((e) => e.source && e.target);
          setNodes(ns.length ? ns : DEFAULT_NODES);
          setEdges(es);
        } else {
          setNodes(DEFAULT_NODES);
          setEdges(DEFAULT_EDGES);
        }
      } catch (e) {
        setError(unwrapError(e).message);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId]);

  const saveVersion = async () => {
    if (!selectedId) {
      setError('Select a workflow first.');
      return;
    }
    setBusy(true); setError(null); setSaved(null);
    try {
      const graph = {
        schema_version: 'aaop/workflow-v2',
        name,
        nodes: nodes.map((n) => {
          const d = nodeData(n);
          return {
            id: n.id,
            kind: d.kind,
            label: d.label,
            position: n.position,
            config: d.config ?? {},
          };
        }),
        edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
      };
      const { data } = await api.post<{ version: number; hash: string }>(`/api/v1/workflows/${selectedId}/versions`, { graph });
      setSaved({ version: data.version, hash: data.hash });
    } catch (e) {
      setError(unwrapError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const createNewWorkflow = async () => {
    setBusy(true); setError(null);
    try {
      const wfName = name?.trim() || `New designer workflow ${new Date().toLocaleString()}`;
      const { data } = await api.post<WorkflowSummary>('/api/v1/workflows', { name: wfName });
      setWorkflows((wf) => [data, ...wf]);
      setSelectedId(data.id);
      setName(data.name);
    } catch (e) {
      setError(unwrapError(e).message);
    } finally {
      setBusy(false);
    }
  };

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const inspectorUpdate = (patch: Partial<AaopNodeData>) => {
    if (!selectedNode) return;
    setNodes((nds) => nds.map((n) =>
      n.id === selectedNode.id ? { ...n, data: { ...(n.data as Record<string, unknown>), ...patch } } : n,
    ));
  };
  const selectedData = selectedNode ? nodeData(selectedNode) : null;

  return (
    <AppShell
      breadcrumb={['Compose', 'Designer', 'Visual Builder']}
      title={
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Box>
            <Box className="eyebrow eyebrow-cyan" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
              <Box className="dot dot-pulse" sx={{ color: 'var(--accent-cyan)' }} /> xyflow · canvas-v2 · live
            </Box>
            <Typography sx={{ fontFamily: 'var(--ff-serif)', fontSize: 36, lineHeight: 1.1, color: 'var(--ink)', mt: 1 }}>
              Visual <em>Workflow Designer</em>
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'var(--ink-soft)', mt: 1, maxWidth: 720 }}>
              Drag &amp; drop nodes, connect them with typed edges, then save a versioned graph straight to the AAOP API.
            </Typography>
          </Box>
          <Stack direction="row" gap={1}>
            <Button variant="outlined" size="small" startIcon={<IconRefresh size={13} />} onClick={fetchWorkflows}>Refresh</Button>
            <Button variant="contained" size="small" color="primary" startIcon={<IconBolt size={13} />} onClick={createNewWorkflow} disabled={busy}>
              New Workflow
            </Button>
          </Stack>
        </Box>
      }
    >
      <Stack gap={2}>
        {error && <Alert severity="error" sx={{ fontSize: 12 }}>{error}</Alert>}
        {saved && (
          <Alert severity="success" sx={{ fontSize: 12 }}>
            Saved version v{saved.version} · <span className="mono">{saved.hash.slice(0, 12)}…</span>
          </Alert>
        )}

        <FusionCard
          eyebrow="Open workflow"
          title="Workflow context"
          icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconWorkflow size={14} /></Box>}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.25} alignItems={{ md: 'center' }}>
            <Select
              size="small" displayEmpty value={selectedId}
              onChange={(e) => setSelectedId(String(e.target.value))}
              sx={{ minWidth: 280 }}
            >
              <MenuItem value=""><em>— select a workflow —</em></MenuItem>
              {workflows.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </Select>
            <TextField
              size="small" label="Workflow name" value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ flex: 1, minWidth: 240 }}
            />
            <Button variant="contained" color="primary" size="small" startIcon={<IconSparkles size={13} />}
                    onClick={saveVersion} disabled={busy || !selectedId}>
              Save as new version
            </Button>
          </Stack>
        </FusionCard>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '220px 1fr 280px' }, gap: 1.5, minHeight: 560 }}>
          {/* Palette */}
          <FusionCard
            eyebrow="Palette"
            title="Drag nodes onto canvas"
            icon={<Box sx={{ color: 'var(--accent-cyan)' }}><IconBolt size={14} /></Box>}
          >
            <Stack gap={0.75}>
              {PALETTE.map((p) => (
                <Box
                  key={p.kind}
                  draggable
                  onDragStart={(e) => onDragStart(e, p.kind, p.label)}
                  className="aaop-palette-tile"
                  style={{ ['--tone' as string]: `var(--accent-${p.tone})` }}
                >
                  <Box className="aaop-palette-kind">{p.kind.split('.')[0]}</Box>
                  <Box sx={{ flex: 1 }}>{p.label}</Box>
                </Box>
              ))}
            </Stack>
          </FusionCard>

          {/* Canvas */}
          <Box
            ref={wrapperRef}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="aaop-flow"
            sx={{
              position: 'relative', minHeight: 560, height: '100%',
              borderRadius: 1, border: '1px solid oklch(50% 0.04 195 / 0.3)',
              background: 'oklch(20% 0.025 195 / 0.85)', overflow: 'hidden',
            }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onInit={(inst) => { flowRef.current = inst; }}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={({ nodes: sel }) => setSelectedNodeId(sel[0]?.id ?? null)}
              fitView
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{
                markerEnd: { type: MarkerType.ArrowClosed, color: 'oklch(70% 0.05 200 / 0.95)' },
                style: { stroke: 'oklch(70% 0.05 200 / 0.85)', strokeWidth: 1.6 },
              }}
              style={{ background: 'transparent', color: 'var(--ink)' }}
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="oklch(60% 0.05 200 / 0.45)" />
              <MiniMap pannable zoomable
                       nodeColor={() => 'oklch(60% 0.10 200)'}
                       nodeStrokeColor="oklch(78% 0.14 200 / 0.6)"
                       maskColor="oklch(15% 0.02 195 / 0.55)" />
              <Controls showInteractive={false} />
            </ReactFlow>
          </Box>

          {/* Inspector */}
          <FusionCard
            eyebrow="Inspector"
            title={selectedData ? selectedData.label : 'Select a node'}
            icon={<Box sx={{ color: 'var(--accent-amber)' }}><IconChip size={14} /></Box>}
          >
            {selectedData && selectedNode ? (
              <Stack gap={1}>
                <TextField size="small" label="Label" value={selectedData.label}
                           onChange={(e) => inspectorUpdate({ label: e.target.value })} />
                <Select size="small" value={selectedData.kind}
                        onChange={(e) => inspectorUpdate({ kind: e.target.value as AaopNodeKind })}>
                  {PALETTE.map((p) => <MenuItem key={p.kind} value={p.kind}>{p.label}</MenuItem>)}
                </Select>
                <TextField size="small" label="config (JSON)" multiline rows={6}
                           value={JSON.stringify(selectedData.config ?? {}, null, 2)}
                           onChange={(e) => {
                             try {
                               inspectorUpdate({ config: JSON.parse(e.target.value || '{}') });
                             } catch { /* ignore until valid JSON */ }
                           }}
                           InputProps={{ sx: { fontFamily: 'var(--ff-mono)', fontSize: 11 } }}
                />
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                  <Chip size="small" label={selectedNode.id} sx={{ height: 20, fontSize: 10 }} />
                  <Tooltip title="Delete node">
                    <IconButton size="small" onClick={() => {
                      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                      setEdges((es) => es.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
                      setSelectedNodeId(null);
                    }} sx={{ color: 'var(--accent-rose)' }}>
                      <IconBolt size={14} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Stack>
            ) : (
              <Typography sx={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                Click a node on the canvas to edit its label, kind and config.
              </Typography>
            )}
            <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <StatusPill tone="info" dense>nodes · {nodes.length}</StatusPill>
              <StatusPill tone="ok" dense>edges · {edges.length}</StatusPill>
              <StatusPill tone="warn" dense><IconShield size={11} /> draft</StatusPill>
            </Box>
          </FusionCard>
        </Box>
      </Stack>
    </AppShell>
  );
}
