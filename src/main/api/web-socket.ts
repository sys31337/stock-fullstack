import net from 'net';
import { Socket } from 'socket.io';

export const client = new net.Socket();

const socketHelper = (socket: Socket): void => {
  socket.on('join-room', async (data) => data);
  socket.on('leave-room', async () => socket.disconnect());
};

export default socketHelper;
