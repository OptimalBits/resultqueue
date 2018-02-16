const {
  Client,
  Server
} = require('../');

const redis = {
  host: 'localhost',
  port: '6379'
};

const server = new Server('test-queue', redis);
const client = new Client('test-queue', 'id', redis);

server.processJob(data => {
  console.log('Sever processing job', data);
  
  return {val: data.val + 1};
});

client.processResult(result => {
  console.log('Client got result', result);

  // free resources
  client.destroy();
  server.destroy();
});

const input = {val: 1};
console.log('Adding job', input);
client.addJob(input);
