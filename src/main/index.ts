import {
  app, shell, BrowserWindow, dialog, ipcMain, screen,
} from 'electron';
import electronReloader from 'electron-reloader';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
// import server from './api/main';
// import { log } from './api/utils';
import config from './api/config';

const { ELECTRON_RENDERER_URL } = config
const dg = dialog;

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    icon: join(__dirname, './assets/logo.ico'),
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

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron');

  // server.listen(4031, () => {
    createWindow();
  // });

  // server.on('error', (e) => log(e));

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  dg.showErrorBox = (title, content) => ({ title, content });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

electronReloader(module, {
  watchRenderer: false // Disable reloader for renderer process, as Vite handles it
});
