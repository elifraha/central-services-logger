'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Winston = require('winston')
const Proxyquire = require('proxyquire')
const Logger = require('../../src/index')

const removeFromCache = (pathFragments) => {
  pathFragments.forEach(pathFragment => {
    Object.keys(require.cache)
      .filter(k => k.indexOf(pathFragment) > -1)
      .forEach(k => delete require.cache[k])
  })
}

Test('logger', function (loggerTest) {
  let sandbox
  let addMethod
  let logMethod

  loggerTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
    sandbox.stub(Winston, 'createLogger')
    addMethod = Sinon.stub()
    logMethod = Sinon.stub()
    addMethod.returns({ log: logMethod })
    Winston.createLogger.returns({ add: addMethod })
    t.end()
  })

  loggerTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  loggerTest.test('configure Winston', function (assert) {
    assert.ok(Winston.transports.Console, Sinon.match({ timestamp: true, colorize: true }))
    assert.end()
  })

  loggerTest.test('log debug level', function (assert) {
    Logger.debug('test %s', 'me')
    assert.ok(Sinon.match('debug', 'test me'))
    assert.end()
  })

  loggerTest.test('log error level, when filtered out', function (assert) {
    // Arrange
    process.env.LOG_FILTER = 'info, debug'
    // Note: Remove lib/config.js from the require cache to the LOG_FILTER env variable gets reapplied
    removeFromCache(['lib/config.js'])
    const LoggerProxy = Proxyquire('../../src/index', {})

    // Act
    LoggerProxy.error('test %s', 'me')

    // Assert
    assert.ok(Sinon.match('error', 'test me'))

    delete process.env.LOG_FILTER
    removeFromCache(['lib/config.js'])
    assert.end()
  })

  loggerTest.test('log info level', function (assert) {
    const infoMessage = 'things are happening'
    Logger.info(infoMessage)
    assert.ok(Sinon.match('info', infoMessage))
    assert.end()
  })

  loggerTest.test('log warn level', function (assert) {
    const warnMessage = 'something bad is happening'
    Logger.warn(warnMessage)
    assert.ok(Sinon.match('warn', warnMessage))
    assert.end()
  })

  loggerTest.test('log error level', function (assert) {
    const errorMessage = 'there was an exception'
    const ex = new Error()
    Logger.error(errorMessage, ex)
    assert.ok(Sinon.match('error', errorMessage))
    assert.end()
  })

  // Tests TODO:
  // Fails to init when LOG_TRANSPORT=file, but filename isn't set
  // logs to console when LOG_TRANSPORT=console
  // logs to file when LOG_TRANSPORT=file

  loggerTest.end()
})
