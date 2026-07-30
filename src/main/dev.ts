import { startMongoDB } from '@api/config/mongodb';
import server from "@api/main";

startMongoDB().then(() => {
  server.listen(4031, () => {
    console.log(`API server listening on port 4031`);
  });
});