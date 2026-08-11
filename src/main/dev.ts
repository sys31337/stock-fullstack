import { startMongoDB } from '@api/config/mongodb';
import { getRelayManager } from './relay/manager';

async function main(): Promise<void> {
  const relayManager = getRelayManager();
  relayManager.start();

  if (relayManager.isHost()) {
    const { default: server } = await import('@api/main');
    await startMongoDB();
    server.listen(4031, () => {
      console.log(`API server listening on port 4031`);
    });
  }
}

main();
