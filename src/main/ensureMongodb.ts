import { app } from 'electron';
import { execFile } from 'child_process';
import { createHash } from 'crypto';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { URL } from 'url';
import { promisify } from 'util';
import { getMongoBinariesDir } from './api/config/mongodb';

const execFileAsync = promisify(execFile);

// Where the heavy binaries live during packaging. They are intentionally NOT
// shipped inside the installer; they are downloaded on first launch instead.
// The current binaries are the same files kept in src/mongodb at build time.
const DOWNLOAD_BASE_URL = process.env.MONGO_DOWNLOAD_BASE_URL || 'https://updates.solustock.net/assets';
const MONGOD_FILE = 'mongod.exe';
const VCREDIST_FILE = 'vc_redist.x64.exe';

// Sizes of the exact binaries this package expects. Override via env when the
// bundled MongoDB build changes.
const MONGOD_EXPECTED_SIZE = Number(process.env.MONGO_MONGOD_SIZE || 57516544);
const VCREDIST_EXPECTED_SIZE = Number(process.env.MONGO_VCREDIST_SIZE || 25635768);
const MONGOD_SHA256 = (process.env.MONGO_MONGOD_SHA256 || '').toLowerCase();

function log(message: string): void {
  console.error(`[mongodb-bootstrap] ${message}`);
}

/**
 * Where mongod.exe must live for the packaged app. Stored under %APPDATA%%
 * instead of the install dir because the installer replaces that directory on
 * every update — this folder survives updates (and so avoids re-downloading
 * the ~55 MB binary on every release).
 */
function targetMongodPath(): string {
  return path.join(getMongoBinariesDir(), 'mongod.exe');
}

function removeQuietly(filePath: string): void {
  try { fs.unlinkSync(filePath); } catch { /* ignore */ }
}

function downloadFile(url: string, destPath: string, redirects = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'SoluStock/2.0' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirects >= 5) {
          res.resume();
          reject(new Error(`Too many redirects for ${url}`));
          return;
        }
        res.resume();
        downloadFile(new URL(res.headers.location, url).toString(), destPath, redirects + 1).then(resolve, reject);
        return;
      }

      if (!res.statusCode || res.statusCode !== 200) {
        res.resume();
        reject(new Error(`Download failed (HTTP ${res.statusCode ?? 'unknown'}) for ${url}`));
        return;
      }

      const out = fs.createWriteStream(destPath);
      out.on('error', (err) => {
        removeQuietly(destPath);
        reject(err);
      });
      res.on('error', (err) => {
        out.destroy();
        removeQuietly(destPath);
        reject(err);
      });
      out.on('finish', () => {
        out.close(() => resolve());
      });
      res.pipe(out);
    });
    req.setTimeout(120000, () => req.destroy(new Error(`Download timed out: ${url}`)));
    req.on('error', reject);
  });
}

function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (d: Buffer) => hash.update(d));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function ensureMongodPresent(): Promise<void> {
  const target = targetMongodPath();
  if (fs.existsSync(target)) {
    log(`mongod.exe already present at ${target}`);
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  const url = `${DOWNLOAD_BASE_URL}/${MONGOD_FILE}`;
  const tmp = `${target}.downloading`;
  log(`Downloading mongod.exe (first launch only): ${url}`);
  await downloadFile(url, tmp);

  const size = fs.statSync(tmp).size;
  if (MONGOD_EXPECTED_SIZE > 0 && size !== MONGOD_EXPECTED_SIZE) {
    removeQuietly(tmp);
    throw new Error(`mongod.exe size mismatch: expected ${MONGOD_EXPECTED_SIZE} bytes, got ${size}`);
  }
  if (MONGOD_SHA256) {
    const hash = await sha256File(tmp);
    if (hash !== MONGOD_SHA256) {
      removeQuietly(tmp);
      throw new Error('mongod.exe checksum mismatch');
    }
  }

  fs.renameSync(tmp, target);
  log(`mongod.exe ready at ${target}`);
}

const VC_RUNTIME_REGISTRY_KEYS = [
  'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64',
  'HKLM\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64',
  'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x86',
  'HKLM\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x86',
];

async function isVcRedistInstalled(): Promise<boolean> {
  for (const key of VC_RUNTIME_REGISTRY_KEYS) {
    try {
      const { stdout } = await execFileAsync('reg', ['query', key, '/v', 'Installed'], { windowsHide: true });
      if (/\bInstalled\s+REG_DWORD\s+0x1\b/i.test(stdout)) return true;
    } catch {
      // key missing = not installed
    }
  }
  return false;
}

async function ensureVcRedistInstalled(): Promise<void> {
  if (await isVcRedistInstalled()) {
    log('VC++ redistributable already installed — skipping');
    return;
  }

  const tmp = path.join(app.getPath('temp'), VCREDIST_FILE);
  const url = `${DOWNLOAD_BASE_URL}/${VCREDIST_FILE}`;
  log(`Downloading VC++ redistributable: ${url}`);
  await downloadFile(url, tmp);

  const size = fs.statSync(tmp).size;
  if (VCREDIST_EXPECTED_SIZE > 0 && size !== VCREDIST_EXPECTED_SIZE) {
    removeQuietly(tmp);
    throw new Error(`vc_redist.x64.exe size mismatch: expected ${VCREDIST_EXPECTED_SIZE} bytes, got ${size}`);
  }

  log('Installing VC++ redistributable silently...');
  try {
    await execFileAsync(tmp, ['/install', '/quiet', '/norestart'], { windowsHide: true });
  } catch (err) {
    // 3010 = installed, reboot recommended — still a success
    if ((err as any)?.code !== 3010) {
      removeQuietly(tmp);
      throw err;
    }
  }

  // The supply chain risk lives only on disk for as long as the installer does.
  removeQuietly(tmp);
  log('VC++ redistributable installed');
}

/**
 * Ensures mongod.exe (and, when absent, the VC++ runtime it needs) are present
 * on first launch. Called from the main entry point before MongoDB starts.
 */
export async function ensureMongodbBinaries(): Promise<void> {
  await ensureMongodPresent();
  await ensureVcRedistInstalled();
}