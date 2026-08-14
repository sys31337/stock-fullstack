# solustock-20-desktop

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ yarn
```

### Development

```bash
$ yarn dev
```

### Build

```bash
# For windows
$ yarn build:win

# For macOS
$ yarn build:mac

# For Linux
$ yarn build:linux
```

## Remote / relay mode

The desktop app can connect to a **remote Host** through the
[Solustock Relay](../solustock-relay/README.md) service (socket.io signaling only;
it holds no data). A host running the backend + MongoDB serves clients.

- **Host mode (default):** this machine runs the backend/DB and serves relayed
  requests from mobile/desktop clients.
- **Client mode:** this app starts its own local backend/DB and works offline.
  When linked to a remote Host through the relay, it pulls remote data and
  pushes local changes, syncing both ways.

Configuration (via env or the in-app **Connection** screen):

| Variable            | Default                    | Description                                   |
|---------------------|----------------------------|-----------------------------------------------|
| `RELAY_MODE`        | `host`                     | `host` or `client`.                           |
| `RELAY_URL`         | `http://127.0.0.1:4050`    | Relay service URL.                            |
| `RELAY_TOKEN`       | `change-me`                | Shared secret, must match the relay's.        |
| `RELAY_HOST_ID`     | ``                         | Stable id this host registers with.           |
| `RELAY_HOST_NAME`   | `SoluStock Host`           | Name shown to clients.                        |
| `RELAY_HOST_PASSWORD` | ``                       | Access password clients must enter to link to this host (empty = open). |
| `RELAY_TARGET_HOST` | ``                         | Client mode: pre-selected host id (optional; can be picked in the UI). |
| `RELAY_CLIENT_PORT` | `4032`                     | Legacy setting (no longer used).              |
| `RELAY_LOCAL_API`   | `http://127.0.0.1:3500`    | Host mode: local API the relay forwards to.   |

See `.env.example`. The renderer's Settings → **Connection** screen edits these
at runtime; a saved config persists to the Electron `userData` directory.

### Client mode flow

1. Enter the **Relay URL** and **Relay token**, then click **Connect & list hosts**.
2. The app registers with the relay as an unlinked client so it can see the
   list of online hosts.
3. Choose a host from **Online hosts**:
   - password-protected hosts open a password modal;
   - unprotected hosts can be linked without a password.
4. Once linked, the app syncs data with the host in the background. The
   renderer always talks to the local API (port 3500), so operations keep
   working when the relay is offline and are queued for the next sync.

### Offline sync

In client mode the local MongoDB is started together with a full local Express
backend. Mutating requests are recorded as pending sync operations and replayed
to the linked host through the relay when the connection is available. The host
pulls its data back to the client, including user credentials so login continues
to work offline. Sync traffic is authorized by the relay link itself, so no
extra sync token is needed. Conflicts (the same record changed on both sides)
are flagged for manual review in Settings → Connection.
