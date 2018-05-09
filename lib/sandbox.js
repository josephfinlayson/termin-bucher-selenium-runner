const vm = require('vm');
const log = require('lambda-log');
const chromium = require('./chromium');
const webdriver = require('selenium-webdriver');

exports.initBrowser = function (event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  // Creates a new session on each event (instead of reusing for performance benefits)
  if (process.env.CLEAN_SESSIONS) {
    log.info('attempting to clear /tmp directory')
    log.info(child.execSync('rm -rf /tmp/core*').toString());
    $browser = chromium.createSession();

  }

  // only on debug
  // log.info(`Received event: ${JSON.stringify(event, null, 2)}`);


  return $browser;
};

exports.buildOptions = (event, browser) => {
  const {firstName, lastName, email} = event.body
  return {
    browser: $browser,
    driver: webdriver,
    firstName,
    lastName,
    email
  };


};
const bookBurgeramtTermin = require('fs').readFileSync(require('path').join(__dirname, 'visit-page.js'), 'utf8').toString();

exports.executeScript = function (opts = {}) {
  const {browser, driver, firstName, lastName, email} = opts;
  var output = '';

  log.info(`Executing script "${bookBurgeramtTermin}"`);

  if (typeof bookBurgeramtTermin !== 'string') {
    return callback('Error: no url or script found to execute.');
  }

  var consoleWrapper = {
    log: function () {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[lambdium-selenium]');
      output = `${output}\n${args.join(' ')}`;
      console.log.apply(console, args);
    }
  };

  // Create Sandbox VM
  const sandbox = {
    '$browser': browser,
    '$driver': driver,
    'console': consoleWrapper,
    firstName,
    lastName,
    email
  };

  // vm is basically eval
  const script = new vm.Script(bookBurgeramtTermin);
  // TODO: Set timeout options for VM context

  const scriptContext = new vm.createContext(sandbox);
  try {

    // need to pull in variables from this and pass to result
   return script.runInContext(scriptContext)

  } catch (e) {
    log.error(`[script error] ${e}`);
    return Promise.reject(e);
  }

  // https://github.com/GoogleChrome/puppeteer/issues/1825#issuecomment-372241101
  // Reuse existing session, likely some edge cases around this...
  if (process.env.CLEAN_SESSIONS) {
    browser.quit().then(function () {
      return Promise.resolve(output);
    });
  } else {
    browser.manage().deleteAllCookies().then(function () {
      return browser.get('about:blank').then(function () {
        return Promise.resolve(output);

      });
    }).catch(function (err) {
      return Promise.reject(err);
    });
  }
}
