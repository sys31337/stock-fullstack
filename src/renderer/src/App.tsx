import React, { useEffect, useState } from 'react';
import { Socket, connect } from 'socket.io-client';
import config from './config';
import showAlert from './Components/showAlert';
import swalNotify from './functions/swalNotify';
import './styles/react-select.css';
import './styles/form.css';

const socketUrl = config.socket;

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    if (!socket) {
      const sc = connect(socketUrl);
      setSocket(sc);
    }

    if (socket) socket.emit('join-room');

    socket?.on('data', (data) => {
      console.log(JSON.stringify(data));
    });
  }, [socket]);

  return (
    <div>App</div>
  )
}

export default App