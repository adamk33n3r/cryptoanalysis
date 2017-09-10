import * as fs from 'fs';
import * as winston from 'winston';
import * as notifier from 'node-notifier';

import { PushJet } from './PushJet';

const config = require('configamajig')();

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

export class Logger {
  protected pushjet = new PushJet();

  public log(message: string = '', notify: boolean = false, level: string = 'info') {
    logger[level](message);
    if (notify) {
      if (config.notifications.notifier.enabled) {
        notifier.notify(message);
      }
      if (config.notifications.pushjet.enabled) {
        this.pushjet.sendMessage(message)
        .catch((e) => {
          logger.error(e);
          logger.error('Trying to send once more.');
          this.pushjet.sendMessage(message)
          .catch((e) => {
            logger.error(e);
            logger.error('Second time failed. Giving up.');
          });
        });
      }
    }
  }
}

