const test = require('ava');
const sb = require('sinon').createSandbox();
const proxyquire = require('proxyquire');
const bullMethods = {
  add: sb.stub(),
  process: sb.stub(),
  close: sb.stub()
};
const bull = sb.stub().returns(bullMethods);
const Client = proxyquire('./client', {
  bull
});

const redis = {
  host: 'redis',
  port: 12345,
  password: '12345'
};

let client;

test.beforeEach(t => {
  client = new Client('name', 'id', redis);
});

test.afterEach(t => {
  sb.restore();
});

test.serial('constructor', t => {
  t.true(bull.calledWith('name', {redis}));
  t.true(bull.calledWith('name-id', {redis}));
});

test.serial('constructor: required params', t => {
  t.throws(() => new Client());
  t.throws(() => new Client('name'));
  t.throws(() => new Client('name', 'name-id'));
});

test.serial('addJob', t => {
  client.addJob({key: 'val'})

  t.true(bullMethods.add.calledWithMatch({key: 'val', returnQueue: 'name-id'}));
});

test.serial('processResult', t => {
  const cb = sb.stub();
  const result = {};
  bullMethods.process.yields({data: result})
  client.processResult(cb)

  t.true(bullMethods.process.calledOnce);
  t.true(cb.calledWith(result));
});

test.serial('destroy', t => {
  client.destroy()

  t.true(bullMethods.close.calledTwice);
});
