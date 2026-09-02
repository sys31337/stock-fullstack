import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Activity,
  ArrowLeftRight,
  Check,
  Copy,
  Lock,
  MonitorSmartphone,
  QrCode,
  RefreshCw,
  RotateCcw,
  Server,
  Settings,
  ShieldCheck,
  TriangleAlert,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { Button } from '@web/shared/components/ui/button';
import { Input } from '@web/shared/components/ui/input';
import { Label } from '@web/shared/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@web/shared/components/ui/dialog';
import { cn } from '@web/shared/utils/cn';
import type { RelayConfigDto, RelayHostInfo, RelayStateSnapshot, SyncStatusSnapshot, SyncConflictSnapshot, SyncHealthSnapshot } from '../../../../preload/relay';

const STATE_LABEL: Record<string, string> = {
  idle: 'Idle',
  connecting: 'Connecting…',
  connected: 'Connected',
  registered: 'Linked to host',
  'auth-error': 'Auth error (bad relay token)',
  error: 'Error',
  closed: 'Closed',
};

type SectionId = 'status' | 'health' | 'settings' | 'qr' | 'hosts' | 'mode';

interface ConnectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Slide-over drawer for the remote connection settings. Rendered at the app
 * chrome level so the home screen stays visible behind the backdrop.
 */
const ConnectionDrawer: React.FC<ConnectionDrawerProps> = ({ isOpen, onClose }) => {
  const [state, setState] = useState<RelayStateSnapshot | null>(null);
  const [hosts, setHosts] = useState<RelayHostInfo[]>([]);
  const [config, setConfig] = useState<RelayConfigDto | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusSnapshot | null>(null);
  const [conflicts, setConflicts] = useState<SyncConflictSnapshot[]>([]);
  const [health, setHealth] = useState<SyncHealthSnapshot | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [resolvingConflict, setResolvingConflict] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [section, setSection] = useState<SectionId>('status');

  const [dialogHost, setDialogHost] = useState<RelayHostInfo | null>(null);
  const [dialogPassword, setDialogPassword] = useState('');
  const [dialogBusy, setDialogBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSection('status');
    let mounted = true;
    const api = window.api.relay;
    api.getState().then((s) => mounted && setState(s));
    api.getConfig().then((c) => mounted && setConfig(c));
    api.getHosts().then((h) => mounted && setHosts(h)).catch(() => {});
    api.getSyncStatus().then((s) => mounted && setSyncStatus(s)).catch(() => {});
    refreshConflicts();
    refreshHealth();
    const offState = api.onStateChange((s) => mounted && setState(s));
    const offHosts = api.onHosts((h) => mounted && setHosts(h));
    const offSync = api.onSyncStatusChange((s) => {
      if (!mounted) return;
      setSyncStatus(s);
      refreshConflicts();
      refreshHealth();
    });
    return () => {
      mounted = false;
      offState();
      offHosts();
      offSync();
    };
  }, [isOpen]);

  const form = useMemo(
    () => ({
      url: config?.url ?? '',
      token: config?.token ?? '',
      targetHostId: config?.targetHostId ?? '',
      hostName: config?.hostName ?? '',
      hostPassword: config?.hostPassword ?? '',
    }),
    [config],
  );

  const [url, setUrl] = useState(form.url);
  const [token, setToken] = useState(form.token);
  const [hostName, setHostName] = useState(form.hostName);
  const [hostPassword, setHostPassword] = useState(form.hostPassword);

  useEffect(() => {
    setUrl(form.url);
    setToken(form.token);
    setHostName(form.hostName);
    setHostPassword(form.hostPassword);
  }, [form]);

  const targetHostId = state?.targetHostId ?? form.targetHostId;

  const qrPayload = useMemo(() => {
    if (state?.mode !== 'host') return null;
    const params = new URLSearchParams();
    params.set('url', url);
    params.set('token', token);
    params.set('hostId', state.hostId);
    if (hostName) params.set('hostName', hostName);
    if (hostPassword) params.set('password', hostPassword);
    return `solustock://connect?${params.toString()}`;
  }, [state, url, token, hostName, hostPassword]);

  const refreshHosts = async () => {
    setHosts(await window.api.relay.getHosts());
  };

  const triggerManualSync = async () => {
    setSyncing(true);
    setMessage(null);
    const result = await window.api.relay.triggerSync();
    setSyncing(false);
    setMessage(result.ok
      ? { ok: true, text: 'Sync triggered. Check the status below for progress.' }
      : { ok: false, text: result.error || 'Failed to trigger sync' });
  };

  const refreshConflicts = async () => {
    try {
      setConflicts(await window.api.relay.getSyncConflicts());
    } catch {
      setConflicts([]);
    }
  };

  const refreshHealth = async () => {
    try {
      setLoadingHealth(true);
      const h = await window.api.relay.getSyncHealth();
      setHealth(h);
    } catch {
      setHealth(null);
    } finally {
      setLoadingHealth(false);
    }
  };

  const resolveConflict = async (conflictId: string, resolution: 'local' | 'remote') => {
    setResolvingConflict(conflictId);
    const result = await window.api.relay.resolveSyncConflict(conflictId, resolution);
    setResolvingConflict(null);
    if (result.ok) {
      await refreshConflicts();
      setMessage({ ok: true, text: `Conflict resolved with ${resolution} version.` });
    } else {
      setMessage({ ok: false, text: result.error || 'Failed to resolve conflict' });
    }
  };

  const applyAndReconnect = async () => {
    setSaving(true);
    setMessage(null);
    const payload = isHost
      ? { url, token, hostName, hostPassword }
      : { url, token };
    const result = await window.api.relay.reconnect(payload);
    setSaving(false);
    setMessage(result.ok
      ? { ok: true, text: 'Reconnecting with the new settings…' }
      : { ok: false, text: result.error || 'Failed to reconnect' });
  };

  const waitForSocket = async (timeoutMs = 10000): Promise<void> => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const s = await window.api.relay.getState();
      if (s.state === 'connected' || s.state === 'registered') return;
      if (s.state === 'auth-error') throw new Error('Auth error (bad relay token)');
      await new Promise<void>((resolve) => setTimeout(resolve, 150));
    }
    throw new Error('Could not reach the relay — check the URL and network');
  };

  const connectAndListHosts = async () => {
    setSaving(true);
    setMessage(null);
    const result = await window.api.relay.reconnect({ url, token, targetHostId: '', hostPassword: '' });
    if (!result.ok) {
      setSaving(false);
      setMessage({ ok: false, text: result.error || 'Failed to connect' });
      return;
    }
    try {
      await waitForSocket();
      const list = await window.api.relay.getHosts();
      setHosts(list);
      setSection('hosts');
      setMessage({ ok: true, text: list.length > 0 ? 'Connected. Pick a host below.' : 'Connected, but no hosts are online.' });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Could not list hosts' });
    } finally {
      setSaving(false);
    }
  };

  const openHostDialog = (h: RelayHostInfo) => {
    setDialogHost(h);
    setDialogPassword(targetHostId === h.clientId ? hostPassword : '');
    setDialogError('');
  };

  const closeHostDialog = () => {
    setDialogHost(null);
    setDialogPassword('');
    setDialogError('');
  };

  const confirmHost = async () => {
    if (!dialogHost) return;
    setDialogBusy(true);
    setDialogError('');
    const result = await window.api.relay.connectHost(dialogHost.clientId, dialogPassword);
    setDialogBusy(false);
    if (result.ok) {
      closeHostDialog();
      setMessage({ ok: true, text: `Linked to ${dialogHost.name || dialogHost.clientId}. Restarting to switch to that host's local database...` });
      setTimeout(() => window.api.relay.restart(), 800);
    } else {
      setDialogError(
        result.error === 'INVALID_HOST_PASSWORD'
          ? 'Wrong host access password'
          : result.error || 'Failed to link to host',
      );
    }
  };

  const saveAndRestart = async (mode: 'host' | 'client') => {
    setSaving(true);
    setMessage(null);
    const result = await window.api.relay.saveConfig({ mode });
    setSaving(false);
    if (!result.ok) {
      setMessage({ ok: false, text: result.error || 'Failed to save' });
      return;
    }
    setMessage({ ok: true, text: 'Mode saved. Restarting the application…' });
    setTimeout(() => window.api.relay.restart(), 600);
  };

  const copyQrPayload = async () => {
    if (!qrPayload) return;
    try {
      await navigator.clipboard.writeText(qrPayload);
      setCopied(true);
      setMessage({ ok: true, text: 'Connection link copied to clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage({ ok: false, text: 'Could not copy the link.' });
    }
  };

  const isHost = state?.mode === 'host';
  const connected = state?.state === 'connected' || state?.state === 'registered';
  const loading = !state || !config;
  const activeSection = section === 'qr' && !isHost ? 'status' : section;

  const navItems: {
    id: SectionId;
    label: string;
    icon: typeof Server;
    hostOnly?: boolean;
    badge?: number;
  }[] = [
    { id: 'status', label: 'Status', icon: Server },
    { id: 'health', label: 'Sync health', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'qr', label: 'Mobile QR', icon: QrCode, hostOnly: true },
    { id: 'hosts', label: 'Online hosts', icon: MonitorSmartphone, badge: hosts.length },
    { id: 'mode', label: 'Mode', icon: ArrowLeftRight },
  ];

  const visibleNav = navItems.filter((item) => !item.hostOnly || isHost);

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-[200] bg-black/40" onClick={onClose} />}
      <div
        className={cn(
          'fixed top-0 right-0 z-[201] h-full w-[720px] max-w-full bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-bold leading-tight">Remote connection</div>
              <div className="text-xs text-muted-foreground">
                {loading ? '…' : isHost ? 'Host mode' : 'Client mode'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                connected
                  ? 'bg-emerald-500/15 text-emerald-600'
                  : 'bg-amber-500/15 text-amber-600'
              }`}
            >
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connected ? 'Connected' : loading ? '…' : STATE_LABEL[state.state] || state.state}
            </span>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Sidebar */}
          <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-card">
            <nav className="flex-1 space-y-1 overflow-y-auto p-2">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {typeof item.badge === 'number' && item.badge > 0 ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2.5 rounded-lg bg-background px-3 py-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  {connected ? (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  ) : null}
                  <span
                    className={cn(
                      'relative inline-flex h-2.5 w-2.5 rounded-full',
                      connected ? 'bg-emerald-500' : 'bg-amber-500'
                    )}
                  />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold">
                    {loading ? 'Loading…' : connected ? 'Connected' : STATE_LABEL[state.state] || state.state}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {loading ? '' : state.url}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                  Loading connection info…
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-2xl p-6">
                {message && (
                  <div
                    className={cn(
                      'mb-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm',
                      message.ok
                        ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600'
                        : 'border-destructive/50 bg-destructive/5 text-destructive'
                    )}
                  >
                    {message.ok ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                {activeSection === 'status' && (
                  <div className="space-y-6">
                    <SectionHeading
                      icon={<Server className="h-4 w-4" />}
                      title="Status"
                      description="Current relay registration and identity."
                    />
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 text-sm sm:grid-cols-2">
                      <Field label="Mode" value={isHost ? 'Host (serves its own data)' : 'Client (connects to a remote Host)'} />
                      <Field label="Relay URL" value={state.url} mono />
                      <Field label="Registered as" value={state.registeredClientId || '—'} mono />
                      <Field label="Host ID" value={state.hostId} mono />
                      {isHost && <Field label="Host name" value={config.hostName || '—'} />}
                      <Field label="Local API" value="http://127.0.0.1:3500" mono />
                    </dl>

                    {!isHost && syncStatus && (
                      <>
                        <SectionHeading
                          icon={<RefreshCw className="h-4 w-4" />}
                          title="Offline sync"
                          description="Local database changes are replayed to the host when linked."
                        />
                        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-muted-foreground">Sync state</div>
                              <div className="mt-0.5 flex items-center gap-2 font-medium">
                                {syncStatus.isOnline ? (
                                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                                )}
                                {syncStatus.isOnline ? 'Online' : 'Offline'}
                                {syncStatus.status !== 'idle' && ` • ${syncStatus.status}`}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Pending changes</div>
                              <div className="mt-0.5 font-medium">{syncStatus.pendingCount}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Last pull</div>
                              <div className="mt-0.5 font-medium">
                                {syncStatus.lastPullAt ? new Date(syncStatus.lastPullAt).toLocaleString() : 'Never'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Last push</div>
                              <div className="mt-0.5 font-medium">
                                {syncStatus.lastPushAt ? new Date(syncStatus.lastPushAt).toLocaleString() : 'Never'}
                              </div>
                            </div>
                          </div>

                          {syncStatus.conflictCount > 0 && (
                            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
                              <TriangleAlert className="h-4 w-4" />
                              {syncStatus.conflictCount} conflict{syncStatus.conflictCount === 1 ? '' : 's'} need review
                            </div>
                          )}

                          {syncStatus.lastError && (
                            <div className="text-xs text-destructive">Last error: {syncStatus.lastError}</div>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <Button onClick={triggerManualSync} disabled={syncing || !syncStatus.isOnline}>
                              {syncing ? (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  Syncing…
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Sync now
                                </>
                              )}
                            </Button>
                          </div>

                          {conflicts.length > 0 && (
                            <div className="space-y-2 pt-2">
                              <div className="text-xs font-semibold text-muted-foreground">Conflicts</div>
                              <ul className="space-y-2">
                                {conflicts.map((c) => (
                                  <li key={c._id} className="rounded-lg border border-border bg-background p-3 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-medium capitalize">{c.collection}</span>
                                      <span className="font-mono text-xs text-muted-foreground">{c.documentId}</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={resolvingConflict === c._id}
                                        onClick={() => resolveConflict(c._id, 'local')}
                                      >
                                        Use local
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={resolvingConflict === c._id}
                                        onClick={() => resolveConflict(c._id, 'remote')}
                                      >
                                        Use remote
                                      </Button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeSection === 'health' && (
                  <div className="space-y-6">
                    <SectionHeading
                      icon={<Activity className="h-4 w-4" />}
                      title="Sync health"
                      description="Per-collection alignment between this device and the host."
                    />
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={refreshHealth} disabled={loadingHealth} size="sm">
                          {loadingHealth ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Refresh
                        </Button>
                      </div>
                      {health ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-border text-xs text-muted-foreground">
                                <th className="py-2 pr-3">Collection</th>
                                <th className="py-2 pr-3 text-right">Host</th>
                                <th className="py-2 pr-3 text-right">Local</th>
                                <th className="py-2 pr-3 text-right">Cursor</th>
                                <th className="py-2 pr-3 text-right">Host seq</th>
                                <th className="py-2 pr-3 text-right">Pending</th>
                                <th className="py-2 pr-3 text-right">Conflicts</th>
                                <th className="py-2 pl-3">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {health.collections.map((c) => (
                                <tr key={c.collection} className="border-b border-border last:border-0">
                                  <td className="py-2 pr-3 font-medium capitalize">{c.collection}</td>
                                  <td className="py-2 pr-3 text-right">{c.hostCount}</td>
                                  <td className="py-2 pr-3 text-right">{c.localCount}</td>
                                  <td className="py-2 pr-3 text-right font-mono text-xs">{c.localCursor}</td>
                                  <td className="py-2 pr-3 text-right font-mono text-xs">{c.hostMaxSequence}</td>
                                  <td className="py-2 pr-3 text-right">{c.pendingCount}</td>
                                  <td className="py-2 pr-3 text-right">{c.conflictCount}</td>
                                  <td className="py-2 pl-3">
                                    {c.stale ? (
                                      <span className="inline-flex items-center gap-1 text-amber-600">
                                        <WifiOff className="h-3 w-3" /> Stale
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-emerald-600">
                                        <Check className="h-3 w-3" /> Synced
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Health data unavailable.</div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === 'settings' && (
                  <div className="space-y-6">
                    <SectionHeading
                      icon={<Settings className="h-4 w-4" />}
                      title="Settings"
                      description="Relay credentials — applied immediately."
                    />
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="relay-url">Relay URL</Label>
                          <Input id="relay-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://127.0.0.1:4050" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="relay-token">Relay token</Label>
                          <Input id="relay-token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="shared relay secret" />
                        </div>
                        {isHost ? (
                          <>
                            <div className="space-y-1.5">
                              <Label htmlFor="host-name">Host name</Label>
                              <Input id="host-name" value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="Name shown to clients" />
                              <p className="text-xs text-muted-foreground">
                                The name mobile/desktop clients see when they connect to this host.
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="host-password">Host access password</Label>
                              <Input id="host-password" type="password" value={hostPassword} onChange={(e) => setHostPassword(e.target.value)} placeholder="optional" />
                              <p className="text-xs text-muted-foreground">
                                Leave empty for open access. Clients must enter this password to link to this host.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <Button onClick={applyAndReconnect} disabled={saving}>
                                {saving ? 'Applying…' : 'Apply & reconnect'}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-1.5">
                              <Label>Linked host</Label>
                              <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                                {targetHostId ? (
                                  <span className="font-mono">{targetHostId}</span>
                                ) : (
                                  <span className="text-muted-foreground">No host selected yet</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Pick a host from the "Online hosts" section and enter its access password.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <Button onClick={connectAndListHosts} disabled={saving || !url || !token}>
                                {saving ? 'Connecting…' : 'Connect & list hosts'}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'qr' && isHost && qrPayload && (
                  <div className="space-y-6">
                    <SectionHeading
                      icon={<QrCode className="h-4 w-4" />}
                      title="Mobile connection QR"
                      description="Scan with the SoluStock mobile app to auto-fill the relay settings and link to this host. The link reflects the values typed in Settings."
                    />
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                      <div className="flex flex-col items-center gap-4">
                        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                          <QRCodeSVG value={qrPayload} size={220} level="M" />
                        </div>
                        <code className="max-w-full break-all rounded-lg bg-muted px-3 py-2 text-xs">
                          {qrPayload}
                        </code>
                        <Button variant="outline" onClick={copyQrPayload}>
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-500" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy link
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'hosts' && (
                  <div className="space-y-6">
                    <SectionHeading
                      icon={<MonitorSmartphone className="h-4 w-4" />}
                      title="Online hosts"
                      description={isHost
                        ? 'Other hosts registered on this relay. You are in host mode, so these are listed for reference only.'
                        : 'Select a host to connect to. Password-protected hosts require the matching access password.'}
                    />
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={refreshHosts}>
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </Button>
                    </div>
                    {hosts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        No hosts online — make sure a SoluStock Host app is running and connected to
                        this relay.
                      </div>
                    ) : (
                      <ul className="space-y-1.5">
                        {hosts.map((h) => {
                          const selected = !isHost && targetHostId === h.clientId;
                          return (
                            <li key={h.clientId}>
                              <button
                                type="button"
                                disabled={isHost}
                                onClick={() => !isHost && openHostDialog(h)}
                                className={cn(
                                  'flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors',
                                  selected
                                    ? 'border-primary/50 bg-primary/5'
                                    : 'border-border bg-card hover:bg-accent',
                                  isHost ? 'cursor-default' : 'cursor-pointer'
                                )}
                              >
                                <span className="flex min-w-0 items-center gap-2.5">
                                  {h.locked ? (
                                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  ) : (
                                    <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  )}
                                  <span className="truncate">
                                    <span className="font-medium">{h.name || h.clientId}</span>
                                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                                      {h.clientId}
                                    </span>
                                  </span>
                                </span>
                                <span className="flex shrink-0 items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {h.clients.length} client(s)
                                    {h.locked ? ' • password protected' : ''}
                                  </span>
                                  {selected && <Check className="h-4 w-4 text-primary" />}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}

                {activeSection === 'mode' && (
                  <div className="space-y-6">
                    <SectionHeading
                      icon={<ArrowLeftRight className="h-4 w-4" />}
                      title="Mode"
                      description="Switching modes restarts the application. In client mode a local database is started and synced with the linked host."
                    />
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={isHost ? 'default' : 'outline'}
                          onClick={() => !isHost && saveAndRestart('host')}
                          disabled={saving}
                        >
                          Host mode
                        </Button>
                        <Button
                          variant={!isHost ? 'default' : 'outline'}
                          onClick={() => isHost && saveAndRestart('client')}
                          disabled={saving}
                        >
                          Client mode
                        </Button>
                      </div>
                      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {isHost
                          ? 'This computer currently acts as a host and serves its own data.'
                          : 'This computer currently acts as a client and proxies a remote host.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* <Dialog open={!!dialogHost} onOpenChange={(open) => !open && closeHostDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogHost?.name || dialogHost?.clientId}</DialogTitle>
            <DialogDescription>
              {dialogHost?.locked
                ? 'This host is password protected. Enter its access password to link this device.'
                : 'Enter the host access password (leave empty if none was set).'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="host-access-password">Host access password</Label>
              <Input
                id="host-access-password"
                type="password"
                value={dialogPassword}
                onChange={(e) => setDialogPassword(e.target.value)}
                placeholder={dialogHost?.locked ? 'required' : 'optional'}
                disabled={dialogBusy}
              />
            </div>
            {dialogError && (
              <div className="text-sm text-destructive">{dialogError}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeHostDialog} disabled={dialogBusy}>
              Cancel
            </Button>
            <Button onClick={confirmHost} disabled={dialogBusy || (dialogHost?.locked && !dialogPassword)}>
              {dialogBusy ? 'Linking…' : 'Link to host'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </>
  );
};

const SectionHeading: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      {icon}
    </div>
    <div>
      <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const Field: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className={`mt-0.5 break-all font-medium ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
  </div>
);

export default ConnectionDrawer;
