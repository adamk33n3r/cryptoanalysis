import * as fs from 'fs';
import * as winston from 'winston';
import * as notifier from 'node-notifier';

import { WebSocket } from './WebSocket';
import { PushJet } from './PushJet';
const pushjet = new PushJet();

//import { WinstonNotifier } from './WinstonNotifier';

const logDir = 'log';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const tsFormat = () => new Date().toUTCString();
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

function log(message: string = '', notify: boolean = false, level: string = 'info') {
  logger[level](message);
  if (notify) {
    notifier.notify(message);
    pushjet.sendMessage(message)
    .catch((e) => {
      logger.error(e);
      logger.error('Trying to send once more.');
      pushjet.sendMessage(message)
      .catch((e) => {
        logger.error(e);
        logger.error('Second time failed. Giving up.');
      });
    });
  }
}

const ws = new WebSocket(watchedPools, log);

