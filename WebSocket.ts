import * as WS from 'ws';

export class WebSocket {
  protected socket: WS;
  protected tm: NodeJS.Timer;

  constructor(protected watchedPools: string[], protected log: Function) {
    this.log('Watching Pools: ' + watchedPools.join(', '));
    this.createWebSocket();
  }

  protected createWebSocket() {
    if (this.socket != null) {
      this.socket.close();
    }
    this.socket = new WS('wss://ws.blockchain.info/inv');
    this.socket.on('open', () => this.onOpen());
    this.socket.on('error', (e) => this.onError(e));
    this.socket.on('close', (thing) => this.onClose(thing));
    this.socket.on('message', (data) => this.onMessage(data));
    setInterval(() => this.heartbeat(), 30000);
  }

  protected sendOp(op: string) {
      this.socket.send(JSON.stringify({ op }));
  }

  protected heartbeat() {
    try {
      this.sendOp('ping');
      this.tm = setTimeout(() => {
        this.log('it has been 5 seconds of waiting for a heartbeat. probably disconnected.', false, 'error');
        this.createWebSocket();
      }, 5000);
    } catch (e) {
      this.log(e, false, 'error');
      if (e.message === 'not opened') {
        this.log('try reconnect!', false, 'error');
        this.createWebSocket();
      }
    }
  }

  /*
   * Listeners
   */

  protected onOpen() {
    this.log('WebSocket opened');
    this.sendOp('blocks_sub');
    //this.sendOp('ping_block');
  }

  protected onMessage(stringData) {
    const data = JSON.parse(stringData);
    switch (data['op']) {
      case 'pong':
        this.log('heartbeat', false, 'debug');
        clearTimeout(this.tm);
        break;
      case 'block':
        const foundBy = data.x.foundBy.description;
        const message = `New block found by ${foundBy}!`;
        this.log(stringData, false, 'debug');
        this.log(message, this.watchedPools.indexOf(foundBy) > -1);
        break;
      default:
        this.log('Unhandled op: ' + data['op'], false, 'red');
        break;
    }
  }

  protected onError(e) {
    this.log(e, false, 'error');
  }

  protected onClose(thing) {
    this.log('on close', false, 'error');
    this.log(thing, false, 'error');
  }
}
