import { PushJet } from './PushJet';

const pushjet = new PushJet();

const message = process.argv.slice(2).join(' ');

pushjet
  .sendMessage(message)
  .then(console.log);
