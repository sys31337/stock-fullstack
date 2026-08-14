import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import net from 'net';
import { log, logError } from '../utils';

let mongodProcess: ChildProcess | null = null;
let currentUri: string | null = null;
let startingPromise: Promise<string> | null = null;

function getMongodPath(): string {
  const resourcesPath = (process as any).resourcesPath as string | undefined;
  if (resourcesPath) {
    const p = path.join(resourcesPath, 'mongodb', 'mongod.exe');
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), 'src', 'mongodb', 'mongod.exe');
}

function getAppDataPath(): string {
  const base = process.env.APPDATA
    || (process.platform === 'win32'
      ? path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'AppData', 'Roaming')
      : path.join(process.env.HOME || '/tmp', '.local', 'share'));
  return path.join(base, 'solustock');
}

function getDataDir(): string {
  return path.join(getAppDataPath(), 'data');
}

function getLogPath(): string {
  return path.join(getAppDataPath(), 'mongod.log');
}

function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, '127.0.0.1');
  });
}

function waitForPortReady(port: number, timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = (): void => {
      const sock = new net.Socket();
      sock.once('connect', () => {
        sock.destroy();
        resolve();
      });
      sock.once('error', () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`MongoDB did not become ready on port ${port} within ${timeoutMs}ms`));
        } else {
          setTimeout(check, 300);
        }
      });
      sock.connect(port, '127.0.0.1');
    };
    check();
  });
}

async function ensureAdminUser(port: number): Promise<void> {
  const username = process.env.MONGODB_ROOT_USER || 'stock_admin';
  const password = process.env.MONGODB_ROOT_PASS || 'admin';
  let conn: mongoose.Connection | null = null;
  try {
    conn = await mongoose.createConnection(
      `mongodb://${username}:${encodeURIComponent(password)}@127.0.0.1:${port}/admin?authSource=admin`
    ).asPromise();
    log(`MongoDB user '${username}' exists`);
    return;
  } catch {
    try { conn?.close(); } catch { }
    conn = await mongoose.createConnection(`mongodb://127.0.0.1:${port}/admin`).asPromise();
    const db = conn.db;
    if (!db) throw new Error('Failed to get admin database');
    await db.command({
      createUser: username,
      pwd: password,
      roles: [{ role: 'root', db: 'admin' }]
    });
    log(`MongoDB user '${username}' created`);
  } finally {
    if (conn) await conn.close();
  }
}

function spawnMongod(port: number, extraArgs: string[] = []): ChildProcess {
  const mongodPath = getMongodPath();
  const dataDir = getDataDir();
  const logPath = getLogPath();

  if (!fs.existsSync(mongodPath)) {
    throw new Error(
      `mongod.exe not found at "${mongodPath}".\n` +
      'If VC++ Redistributable is missing, run vc_redist.x64.exe from the app resources.'
    );
  }

  if (!fs.existsSync(dataDir)) { fs.mkdirSync(dataDir, { recursive: true }); }

  const args = [
    `--port=${port}`,
    `--dbpath=${dataDir}`,
    `--logpath=${logPath}`,
    '--bind_ip=127.0.0.1',
    ...extraArgs,
  ];

  log(`Starting mongod on port ${port}...`);
  console.error(`[mongod] Starting: "${mongodPath}" --port ${port}`);
  const proc = spawn(mongodPath, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  proc.stderr?.on('data', (d: Buffer) => { log(`[mongod] ${d}`); });

  proc.on('error', (err) => {
    console.error('[mongod] Process error:', err);
    logError('Failed to start mongod', err);
  });

  proc.on('exit', (code) => {
    console.error(`[mongod] Exited with code ${code}`);
    log(`mongod exited with code ${code}`);
    mongodProcess = null;
  });

  return proc;
}

export async function startMongoDB(dbNameOverride?: string): Promise<string> {
  if (currentUri) return currentUri;
  if (startingPromise) return startingPromise;

  startingPromise = initMongoDB(dbNameOverride);
  return startingPromise;
}

async function initMongoDB(dbNameOverride?: string): Promise<string> {
  const port = parseInt(process.env.MONGODB_PORT || '27018', 10);
  const username = process.env.MONGODB_ROOT_USER || 'stock_admin';
  const password = process.env.MONGODB_ROOT_PASS || 'admin';
  const dbName = dbNameOverride || process.env.MONGODB_DB_NAME || 'stock';

  const alreadyRunning = await isPortInUse(port);
  if (!alreadyRunning) {
    mongodProcess = spawnMongod(port, ['--auth']);
    await waitForPortReady(port);
  } else {
    log(`Port ${port} already in use — assuming mongod is already running`);
  }

  await ensureAdminUser(port);

  currentUri = `mongodb://${username}:${encodeURIComponent(password)}@127.0.0.1:${port}/${dbName}?authSource=admin`;
  startingPromise = null;
  log(`MongoDB ready at mongodb://${username}:****@127.0.0.1:${port}/${dbName}`);
  return currentUri;
}

export function stopMongoDB(): void {
  if (mongodProcess) {
    log('Stopping mongod...');
    mongodProcess.kill('SIGTERM');
    mongodProcess = null;
  }
}

export function getUri(): string | null {
  return currentUri;
}
