const test = require('ava');
const sb = require('sinon').createSandbox();
const proxyquire = require('proxyquire');
const bullMethods = {
  add: sb.stub(),
  process: sb.stub(),
  close: sb.stub()
};
const bull = sb.stub().returns(bullMethods);
const Server = proxyquire('./server', {
  bull
});
const redis = {
  host: 'redis',
  port: 12345,
  password: '12345'
};

let server;

test.beforeEach(t => {
  server = new Server('name', redis);
});

test.afterEach(t => {
  sb.restore();
  bullMethods.add.resetHistory();
  bullMethods.process.resetHistory();
  bullMethods.close.resetHistory();
});

test.serial('constructor', t => {
  t.true(bull.calledWith('name', {redis}));
});

test('constructor: required params', t => {
  t.throws(() => new Server());
  t.throws(() => new Server('name'));
});


test.serial('processJob success', async t => {
  const input = {
    returnQueue: 'return-queue'
  };
  const result = {};
  const cb = sb.stub().returns(Promise.resolve(result));

  bullMethods.process.yields({data: input});

  server.processJob(cb);

  t.true(bullMethods.process.calledOnce);
  t.true(bull.calledWith('return-queue', {redis}));
  t.true(cb.calledWith(input));
  await bullMethods.process.args[0][0];
  t.true(bullMethods.add.calledWith(result));
});

test.serial('processJob fail', async t => {
  const input = {
    returnQueue: 'return-queue'
  };
  const err = new Error('failed')
  const cb = sb.stub().returns(Promise.reject(err));


  // mock `process`. We can't use sinon here since we have to catch an error in
  // the yielded function
  // bullMethods.process.yields({data: input}); // no try-catch here
  const oldProcess = bullMethods.process;
  bullMethods.process = sb.spy(fn => {
    Promise.resolve(fn({data: input})).catch(err => {
      // swallow rejection
    });
  });

  server.processJob(cb);

  t.true(bullMethods.process.calledOnce);
  t.true(bull.calledWith('return-queue', {redis}));
  t.true(cb.calledWith(input));
  await bullMethods.process.args[0][0];
  t.true(bullMethods.add.notCalled);

  bullMethods.process = oldProcess;
});

test.serial('processJob missing returnQueue', async t => {
  const input = {};

  // mock `process`. We can't use sinon here since we have to catch an error in
  // the yielded function
  // bullMethods.process.yields({data: input}); // no try-catch here
  const oldProcess = bullMethods.process;
  bullMethods.process = sb.spy(fn => {
    Promise.resolve(fn({data: input})).catch(err => {
      // swallow rejection
    });
  });

  server.processJob(() => {});

  t.true(bullMethods.process.calledOnce);
  await bullMethods.process.args[0][0];
  t.true(bullMethods.add.notCalled);

  bullMethods.process = oldProcess;
});

test.serial('destroy', async t => {
  const input = {
    returnQueue: 'return-queue'
  };
  const result = {};
  const cb = sb.stub().returns(Promise.resolve(result));;

  bullMethods.process.yields({data: input});

  server.processJob(cb);

  t.true(bullMethods.process.calledOnce);
  t.true(bull.calledWith('return-queue', {redis}));
  t.true(cb.calledWith(input));
  await bullMethods.process.args[0][0];
  server.destroy()

  t.true(bullMethods.close.calledTwice);
});
