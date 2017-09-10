import * as WS from 'ws';
import { Logger } from './Logger';

export class WebSocket {
  protected socket: WS;
  protected heartbeatCheckTimer: NodeJS.Timer;
  protected heartbeatIntervalTimer: NodeJS.Timer;
  protected started: number = 0;

  constructor(protected watchedPools: string[], protected logger: Logger) {
  }

  public start() {
    this.logger.log('Watching Pools: ' + this.watchedPools.join(', '));
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
    this.started++;
    this.logger.log(`WebSocket has been started ${this.started} times.`);
    clearInterval(this.heartbeatIntervalTimer);
    this.heartbeatIntervalTimer = setInterval(() => this.heartbeat(), 30000);
  }

  protected sendOp(op: string) {
    this.socket.send(JSON.stringify({ op }));
    this.logger.log(`sendOp: ${op} WS: ${this.started}`, false, 'debug');
  }

  protected heartbeat() {
    try {
      this.sendOp('ping');
      this.heartbeatCheckTimer = setTimeout(() => {
        this.logger.log('it has been 5 seconds of waiting for a heartbeat. probably disconnected.', false, 'error');
        this.createWebSocket();
      }, 5000);
    } catch (e) {
      this.logger.log(e, false, 'error');
      if (e.message === 'not opened') {
        this.logger.log('try reconnect!', false, 'error');
        this.createWebSocket();
      }
    }
  }

  /*
   * Listeners
   */

  protected onOpen() {
    this.logger.log('WebSocket opened');
    this.sendOp('blocks_sub');
    //this.sendOp('ping_block');
  }

  protected onMessage(stringData) {
    const data = JSON.parse(stringData);
    switch (data['op']) {
      case 'pong':
        this.logger.log('heartbeat', false, 'debug');
        clearTimeout(this.heartbeatCheckTimer);
        break;
      case 'block':
        const foundBy = data.x.foundBy.description;
        const message = `New block found by ${foundBy}!`;
        this.logger.log(stringData, false, 'debug');
        this.logger.log(message, this.watchedPools.indexOf(foundBy) > -1);
        break;
      default:
        this.logger.log('Unhandled op: ' + data['op'], false, 'red');
        break;
    }
  }

  protected onError(e) {
    this.logger.log(e, false, 'error');
  }

  protected onClose(thing) {
    this.logger.log('on close', false, 'error');
    this.logger.log(thing, false, 'error');
  }
}

