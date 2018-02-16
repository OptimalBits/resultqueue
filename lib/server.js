const Queue = require('bull');

class Server {
  constructor(name, redis) {
    if(!redis) throw Error('no redis conf passed in');

    this.redis = redis;
    this.queue = Queue(name, {redis});
    this.returnQueues = new Map();
  }

  getReturnQueue(name) {
    if(!this.returnQueues.has(name)){
      this.returnQueues.set(name, Queue(name, {redis: this.redis}));
    }

    return this.returnQueues.get(name);
  }

  processJob(fn) {
    this.queue.process(({data}) => {
      if(!data.returnQueue){
        return Promise.reject(Error('returnQueue missing on job', data));
      }

      const returnQueue = this.getReturnQueue(data.returnQueue);

      return Promise.resolve(fn(data)).then(result => {
        returnQueue.add(result);
      });
    });
  }

  destroy() {
    this.queue.close();
    this.returnQueues.forEach(returnQueue => returnQueue.close());
    this.returnQueues.clear();
  }
}

module.exports = Server;

