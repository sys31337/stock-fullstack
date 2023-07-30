import http from 'http';
import { log, logError } from '../utils';
import app from '../App';

interface IError { syscall: string, code: string }

function normalizePort(val: string): number | string {
  const port = parseInt(val, 10);

  if (Number.isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return 3000;
}

const PORT: number | string = normalizePort(process.env.PORT || '3000');
app.set('port', PORT);

const server = http.createServer(app);

const onError = (error: IError) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind: string = typeof PORT === 'string'
    ? `Pipe ${PORT}`
    : `Port ${PORT}`;

  switch (error.code) {
    case 'EACCES':
      logError(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logError(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const onListening = (): void => {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? `Pipe ${addr}`
    : `Port ${PORT}`;
  log(`Listening on ${bind}`);
};

server.listen(PORT);
server.on('error', onError);
server.on('listening', onListening);
