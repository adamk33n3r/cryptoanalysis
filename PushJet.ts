import * as request from 'request-promise-native';

import { Notification } from './Notification';

const config = require('configamajig')();

export class PushJet extends Notification {
  private secret: string;
  private pubkey: string;
  private config: {
    enabled: boolean;
    api: string;
    secret: string;
    level: number;
  };

  constructor() {
    super();
    this.config = config.notifications.pushjet;
    if (this.config.secret == null) {
      throw new Error('You must specify JetPush secret in config');
    }
  }

  public sendMessage(message: string, title?: string) {
    return request.post(`${this.config.api}/message`, {
      json: true,
      form: {
        secret: this.config.secret,
        message: message,
        title: title,
        level: this.config.level,
        link: 'https://blockchain.info/blocks',
      },
    }).then((response) => {
      return response.status === 'ok';
    }).catch((e) => {
      throw e;
    });
  }
}

