import * as winston from 'winston';
import * as notifier from 'node-notifier';

export class WinstonNotifier extends winston.Transport {
  public name: string = 'notifier';
  
  public log(level, message, meta, callback) {
    notifier.notify(message);
    callback(null, true);
  }
}

