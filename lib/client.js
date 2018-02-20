const Queue = require('bull');

class Client {
  constructor(name, clientId, redis) {
    if(!redis) throw Error('no redis conf passed in');

    this.queue = Queue(name, {redis});
    this.returnQueueName = `${name}-${clientId}`;
    this.returnQueue  = Queue(this.returnQueueName, {redis});
  }

  addJob(data) {
    this.queue.add(Object.assign(
      {},
      data,
      {
        returnQueue: this.returnQueueName
      }
    ));
  }

  processResult(fn) {
    this.returnQueue.process(({data}) => fn(data));
  }

  destroy() {
    this.queue.close();
    this.returnQueue.close();
  }
}

module.exports = Client;
