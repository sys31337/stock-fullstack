import { useEffect, useMemo, useState } from 'react';
import { Button } from '@web/shared/components/ui/button';
import { Input } from '@web/shared/components/ui/input';
import { Label } from '@web/shared/components/ui/label';
import type { RelayConfigDto, RelayHostInfo, RelayStateSnapshot } from '../../../../preload/relay';

const STATE_LABEL: Record<string, string> = {
  idle: 'Idle',
  connecting: 'Connecting…',
  connected: 'Connected',
  registered: 'Registered',
  'auth-error': 'Auth error (bad relay token)',
  error: 'Error',
  closed: 'Closed',
};

const Connection: React.FC = () => {
  const [state, setState] = useState<RelayStateSnapshot | null>(null);
  const [hosts, setHosts] = useState<RelayHostInfo[]>([]);
  const [config, setConfig] = useState<RelayConfigDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    const api = window.api.relay;
    api.getState().then((s) => mounted && setState(s));
    api.getConfig().then((c) => mounted && setConfig(c));
    api.getHosts().then((h) => mounted && setHosts(h));
    const offState = api.onStateChange((s) => mounted && setState(s));
    const offHosts = api.onHosts((h) => mounted && setHosts(h));
    return () => {
      mounted = false;
      offState();
      offHosts();
    };
  }, []);

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
  const [targetHostId, setTargetHostId] = useState(form.targetHostId);
  const [hostName, setHostName] = useState(form.hostName);
  const [hostPassword, setHostPassword] = useState(form.hostPassword);

  useEffect(() => {
    setUrl(form.url);
    setToken(form.token);
    setTargetHostId(form.targetHostId);
    setHostName(form.hostName);
    setHostPassword(form.hostPassword);
  }, [form]);

  if (!state || !config) {
    return <div className="p-8 text-sm text-muted-foreground">Loading connection info…</div>;
  }

  const refreshHosts = async () => {
    setHosts(await window.api.relay.getHosts());
  };

  const applyAndReconnect = async () => {
    setSaving(true);
    setMessage(null);
    const result = await window.api.relay.reconnect({ url, token, targetHostId, hostName, hostPassword });
    setSaving(false);
    setMessage(result.ok
      ? { ok: true, text: 'Reconnecting with the new settings…' }
      : { ok: false, text: result.error || 'Failed to reconnect' });
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

  const badge = state.connected ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600">
      <span className="w-2 h-2 rounded-full bg-emerald-500" />
      Connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600">
      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      {STATE_LABEL[state.state] || state.state}
    </span>
  );

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Remote connection</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connects this computer to SoluStock devices through the relay service.
          </p>
        </div>

        {message && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${message.ok ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600' : 'border-destructive/50 bg-destructive/5 text-destructive'}`}>
            {message.text}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Status</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Mode: <span className="font-medium">{state.mode === 'host' ? 'Host (serves its own data)' : 'Client (connects to a remote Host)'}</span>
              </div>
            </div>
            {badge}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Relay URL</div>
              <div className="font-medium">{state.url}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Registered as</div>
              <div className="font-medium">{state.registeredClientId || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Host ID</div>
              <div className="font-medium">{state.hostId}</div>
            </div>
            {state.mode === 'host' && (
              <div>
                <div className="text-xs text-muted-foreground">Host name</div>
                <div className="font-medium">{config.hostName || '—'}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">Client mode HTTP proxy</div>
              <div className="font-medium">http://127.0.0.1:{state.clientPort}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Relay settings</div>
              <div className="text-xs text-muted-foreground mt-0.5">These apply immediately.</div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="relay-url">Relay URL</Label>
              <Input id="relay-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://127.0.0.1:4050" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="relay-token">Relay token</Label>
              <Input id="relay-token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="shared relay secret" />
            </div>
            {state.mode === 'host' && (
              <div className="space-y-1.5">
                <Label htmlFor="host-name">Host name</Label>
                <Input id="host-name" value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="Name shown to clients" />
                <p className="text-xs text-muted-foreground">
                  The name mobile/desktop clients see when they connect to this host.
                </p>
              </div>
            )}
            {state.mode === 'host' && (
              <div className="space-y-1.5">
                <Label htmlFor="host-password">Host access password</Label>
                <Input id="host-password" type="password" value={hostPassword} onChange={(e) => setHostPassword(e.target.value)} placeholder="optional" />
                <p className="text-xs text-muted-foreground">
                  Leave empty for open access. Clients must enter this password to link to this host.
                </p>
              </div>
            )}
            {state.mode === 'client' && (
              <div className="space-y-1.5">
                <Label htmlFor="target-host">Target Host ID</Label>
                <Input id="target-host" value={targetHostId} onChange={(e) => setTargetHostId(e.target.value)} placeholder="host id" list="relay-hosts" />
                <datalist id="relay-hosts">
                  {hosts.map((h) => (
                    <option key={h.clientId} value={h.clientId}>
                      {h.name || h.clientId}
                    </option>
                  ))}
                </datalist>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button onClick={applyAndReconnect} disabled={saving}>
                {saving ? 'Applying…' : 'Apply & reconnect'}
              </Button>
              <Button variant="outline" onClick={refreshHosts}>Refresh hosts</Button>
            </div>
          </div>
        </div>

        {hosts.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <div className="text-sm font-semibold">Online hosts ({hosts.length})</div>
            {hosts.map((h) => (
              <div key={h.clientId} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{h.name || h.clientId}</span>
                  <span className="text-muted-foreground ml-2">({h.clientId})</span>
                </div>
                <span className="text-xs text-muted-foreground">{h.clients.length} client(s)</span>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <div className="text-sm font-semibold">Mode</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Switching modes restarts the application. In client mode the local backend & database are not started.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={state.mode === 'host' ? 'default' : 'outline'}
              onClick={() => state.mode !== 'host' && saveAndRestart('host')}
              disabled={saving}
            >
              Host mode
            </Button>
            <Button
              variant={state.mode === 'client' ? 'default' : 'outline'}
              onClick={() => state.mode !== 'client' && saveAndRestart('client')}
              disabled={saving}
            >
              Client mode
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Connection;
