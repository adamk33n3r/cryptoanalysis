import * as fs from 'fs';
import * as winston from 'winston';
import * as WebSocket from 'ws';
import * as notifier from 'node-notifier';

//import { WinstonNotifier } from './WinstonNotifier';

const logDir = 'log';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const tsFormat = () => new Date().toLocaleTimeString();
const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({ colorize: true, timestamp: tsFormat, level: 'info' }),
    new winston.transports.File({ filename: `${logDir}/debug.log`, timestamp: tsFormat, name: 'file#debug' }),
    new winston.transports.File({ filename: `${logDir}/info.log`, timestamp: tsFormat, level: 'info', name: 'file#info' }),
    //new WinstonNotifier({ level: 'info' }),
  ],
});

logger.level = 'debug';

const ws = new WebSocket('wss://ws.blockchain.info/inv');

ws.on('open', () => {
  log('WebSocket opened');
  sendOp('blocks_sub');
});

ws.on('message', (data) => {
  data = JSON.parse(data);
  switch (data['op']) {
    case 'pong':
      log('heartbeat', false, 'debug');
      break;
    case 'block':
      const foundBy = data.x.foundBy.description;
      const message = `New block found by ${foundBy}!`;
      log(message, foundBy === 'SlushPool');
      break;
    default:
      log('Unhandled op: ' + data['op'], false, 'red');
      break;
  }
});

function sendOp(op: string) {
    ws.send(JSON.stringify({ op }));
}

function heartbeat(ws) {
  sendOp('ping');
}

function log(message: string = '', notify: boolean = false, level: string = 'info') {
  logger[level](message);
  if (notify) {
    notifier.notify(message);
  }
}

setInterval(heartbeat, 30000);
