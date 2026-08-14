import {
  app, shell, BrowserWindow, dialog, ipcMain, screen,
} from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import config from './api/config';
import { startMongoDB, stopMongoDB } from './api/config/mongodb';
import { setSkipDefaultSeeding } from './api/config/mongoose';
import { createApiServer } from './api/main';
import { getRelayManager } from './relay/manager';
import { registerRelayIpc } from './relay/ipc';

if (is.dev) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('electron-reloader')(module, { watchRenderer: false });
  } catch { }
}

const { ELECTRON_RENDERER_URL } = config
const relayManager = getRelayManager();

function clientDbName(targetHostId: string): string {
  if (!targetHostId) return 'stock-unlinked';
  const sanitized = targetHostId
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 50);
  return sanitized ? `stock-${sanitized}` : 'stock-unlinked';
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    icon: join(app.getAppPath(), 'resources', 'icon.png'),
    webPreferences: {
      allowRunningInsecureContent: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      enableBlinkFeatures: 'WebContentsForceDark',
      experimentalFeatures: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true,
      webSecurity: false,
      contextIsolation: false,
      // The renderer always talks to the local Express API. In client mode the
      // local API records mutations and the sync engine replicates them to the
      // remote host, so the app keeps working when offline.
      additionalArguments: ['--relay-api=http://127.0.0.1:3500'],
    },
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  ipcMain.on('close', () => app.quit());
  ipcMain.on('minimize', () => mainWindow.minimize());
  ipcMain.on('maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.handle('isMaximized', () => mainWindow.isMaximized());

  let dragOffset: { x: number; y: number } | null = null;
  ipcMain.on('drag-start', () => {
    const [winX, winY] = mainWindow.getPosition();
    const mouse = screen.getCursorScreenPoint();
    dragOffset = { x: mouse.x - winX, y: mouse.y - winY };
  });
  ipcMain.on('drag-move', () => {
    if (!dragOffset) return;
    const mouse = screen.getCursorScreenPoint();
    mainWindow.setPosition(mouse.x - dragOffset.x, mouse.y - dragOffset.y);
  });
  ipcMain.on('drag-end', () => {
    dragOffset = null;
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('maximize-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('maximize-change', false);
  });

  mainWindow.maximize();
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron');

  registerRelayIpc();
  relayManager.start();

  const clientMode = !relayManager.isHost();
  if (clientMode) {
    setSkipDefaultSeeding(true);
    // In client mode isolate each linked host's data in its own local database.
    // The database name is derived from the persisted target host id; changing
    // the linked host restarts the app so the new database is used.
    process.env.MONGODB_DB_NAME = clientDbName(relayManager.getConfig().targetHostId);
  }

  const server = createApiServer({ clientMode });

  server.listen(3500, () => {
    console.error(`[server] API server listening on port 3500 (mode=${clientMode ? 'client' : 'host'})`);
  });

  server.on('error', (e) => console.error('[server] Error:', e));

  startMongoDB().then(() => {
    createWindow();
  }).catch((err) => {
    console.error('Failed to start MongoDB:', err);
    dialog.showErrorBox('Database Error', `Failed to start MongoDB.\n\n${err.message}`);
    app.quit();
  });

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  stopMongoDB();
  relayManager.shutdown();
});
