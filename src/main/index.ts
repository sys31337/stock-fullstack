import {
  app, shell, BrowserWindow, dialog, ipcMain, screen,
} from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import config from './api/config';
import { startMongoDB, stopMongoDB } from './api/config/mongodb';
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
      additionalArguments: [`--relay-api=${relayManager.isHost() ? 'http://127.0.0.1:4031' : `http://127.0.0.1:${relayManager.getClientPort()}`}`],
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

  if (relayManager.isHost()) {
    const { default: server } = await import('./api/main');

    server.listen(4031, () => {
      console.error('[server] API server listening on port 4031');
    });

    server.on('error', (e) => console.error('[server] Error:', e));

    startMongoDB().then(() => {
      createWindow();
    }).catch((err) => {
      console.error('Failed to start MongoDB:', err);
      dialog.showErrorBox('Database Error', `Failed to start MongoDB.\n\n${err.message}`);
      app.quit();
    });
  } else {
    createWindow();
  }

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
