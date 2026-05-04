'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setActiveWorkspaceId, unwrapError } from '@/lib/api/client';
import type { User, Workspace } from '@/lib/api/types';

interface AuthState {
  ready: boolean;
  user: User | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (input: { email: string; password: string; display_name?: string; workspace_name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  setWorkspace: (id: string) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: User; workspaces: Workspace[] }>('/api/v1/auth/me');
      setUser(data.user);
      setWorkspaces(data.workspaces ?? []);
      const fromStorage = typeof window !== 'undefined' ? window.localStorage.getItem('aaop:workspace_id') : null;
      const next = fromStorage && data.workspaces.find(w => w.id === fromStorage)
        ? fromStorage
        : data.user.default_workspace_id ?? data.workspaces[0]?.id ?? null;
      setCurrentWorkspaceId(next);
      setActiveWorkspaceId(next);
    } catch {
      setUser(null);
      setWorkspaces([]);
      setCurrentWorkspaceId(null);
      setActiveWorkspaceId(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const login = useCallback(async (email: string, password: string, remember = true) => {
    try {
      const { data } = await api.post<{ user: User; workspace: Workspace | null }>('/api/v1/auth/login', {
        email, password, remember,
      });
      setUser(data.user);
      if (data.workspace) {
        setWorkspaces(prev => prev.find(w => w.id === data.workspace!.id) ? prev : [...prev, data.workspace!]);
        setCurrentWorkspaceId(data.workspace.id);
        setActiveWorkspaceId(data.workspace.id);
      }
      await refresh();
    } catch (e) {
      throw new Error(unwrapError(e).message);
    }
  }, [refresh]);

  const register = useCallback(async (input: { email: string; password: string; display_name?: string; workspace_name?: string }) => {
    try {
      const payload = { ...input, password_confirmation: input.password };
      const { data } = await api.post<{ user: User; workspace: Workspace }>('/api/v1/auth/register', payload);
      setUser(data.user);
      setWorkspaces([data.workspace]);
      setCurrentWorkspaceId(data.workspace.id);
      setActiveWorkspaceId(data.workspace.id);
      await refresh();
    } catch (e) {
      throw new Error(unwrapError(e).message);
    }
  }, [refresh]);

  const logout = useCallback(async () => {
    try { await api.post('/api/v1/auth/logout'); } catch { /* swallow */ }
    setUser(null);
    setWorkspaces([]);
    setCurrentWorkspaceId(null);
    setActiveWorkspaceId(null);
  }, []);

  const setWorkspace = useCallback((id: string) => {
    setCurrentWorkspaceId(id);
    setActiveWorkspaceId(id);
  }, []);

  const value = useMemo<AuthState>(() => ({
    ready,
    user,
    workspaces,
    currentWorkspace: workspaces.find(w => w.id === currentWorkspaceId) ?? null,
    login, register, logout, setWorkspace, refresh,
  }), [ready, user, workspaces, currentWorkspaceId, login, register, logout, setWorkspace, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
