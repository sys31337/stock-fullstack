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
- **Client mode:** this app talks to a remote Host's backend through the relay —
  a local HTTP proxy forwards the renderer's requests to the Host.

Configuration (via env or the in-app **Connection** screen):

| Variable            | Default                    | Description                                   |
|---------------------|----------------------------|-----------------------------------------------|
| `RELAY_MODE`        | `host`                     | `host` or `client`.                           |
| `RELAY_URL`         | `http://127.0.0.1:4050`    | Relay service URL.                            |
| `RELAY_TOKEN`       | `change-me`                | Shared secret, must match the relay's.        |
| `RELAY_HOST_ID`     | ``                         | Stable id this host registers with.           |
| `RELAY_HOST_NAME`   | `SoluStock Host`           | Name shown to clients.                        |
| `RELAY_HOST_PASSWORD` | ``                       | Access password clients must enter to link to this host (empty = open). |
| `RELAY_TARGET_HOST` | ``                         | Client mode: Host id to connect to.           |
| `RELAY_CLIENT_PORT` | `4032`                     | Client mode: local HTTP proxy port.           |
| `RELAY_LOCAL_API`   | `http://127.0.0.1:3500`    | Host mode: local API the relay forwards to.   |

See `.env.example`. The renderer's Settings → **Connection** screen edits these
at runtime; a saved config persists to the Electron `userData` directory.
