import { WebSocket } from './WebSocket';
import { Logger } from './Logger';

const watchedPools = process.argv.slice(2);

const ws = new WebSocket(watchedPools, new Logger());
ws.start();

