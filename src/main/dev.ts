import { startMongoDB } from '@api/config/mongodb';
import { getRelayManager } from './relay/manager';

async function main(): Promise<void> {
  const relayManager = getRelayManager();
  relayManager.start();

  if (relayManager.isHost()) {
    const { default: server } = await import('@api/main');
    await startMongoDB();
    server.listen(3500, () => {
      console.log(`API server listening on port 3500`);
    });
    server.on('error', (err: any) => {
      if (err?.code === 'EADDRINUSE') {
        console.log('[dev] Port 3500 is already in use (the Electron app probably owns it). Skipping duplicate API server.');
      } else {
        console.error('[dev] API server error:', err);
      }
    });
  }
}

main();
