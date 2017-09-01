import * as fs from 'fs';
import * as winston from 'winston';
import * as WebSocket from 'ws';
import * as notifier from 'node-notifier';

import { PushJet } from './PushJet';
const pushjet = new PushJet();

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
    // new WinstonNotifier({ level: 'info' }),
  ],
});

logger.level = 'debug';

const watchedPools = process.argv.slice(2);
logger.info('Watching Pools:', watchedPools.join(', '));

let ws: WebSocket;

function createWebSocket() {
  ws = new WebSocket('wss://ws.blockchain.info/inv');
}
createWebSocket();

ws.on('open', () => {
  log('WebSocket opened');
  sendOp('blocks_sub');
  // sendOp('ping_block');
});

let tm: NodeJS.Timer;

ws.on('message', (data) => {
  data = JSON.parse(data);
  switch (data['op']) {
    case 'pong':
      log('heartbeat', false, 'debug');
      clearTimeout(tm);
      break;
    case 'block':
      const foundBy = data.x.foundBy.description;
      const message = `New block found by ${foundBy}!`;
      logger.debug(data);
      log(message, watchedPools.indexOf(foundBy) > -1);
      break;
    default:
      log('Unhandled op: ' + data['op'], false, 'red');
      break;
  }
});

ws.on('error', (e) => {
  log(e, false, 'error');
});

ws.on('close', (thing) => {
  log('on close', false, 'error');
  log(thing, false, 'error');
});

function sendOp(op: string) {
    ws.send(JSON.stringify({ op }));
}

function heartbeat(ws) {
  try {
    sendOp('ping');
    tm = setTimeout(() => {
      log('it has been 5 seconds of waiting for a heartbeat. probably disconnected.', false, 'error');
    }, 5000);
  } catch (e) {
    log(e, false, 'error');
    if (e.message === 'not opened') {
      log('try reconnect!', false, 'error');
      createWebSocket();
    }
  }
}

function log(message: string = '', notify: boolean = false, level: string = 'info') {
  logger[level](message);
  if (notify) {
    notifier.notify(message);
    pushjet.sendMessage(message)
    .catch((e) => {
      logger.error(e);
    });
  }
}

setInterval(heartbeat, 30000);
