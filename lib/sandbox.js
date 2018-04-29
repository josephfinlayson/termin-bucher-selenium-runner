const vm = require('vm');
const log = require('lambda-log');
const chromium = require('./chromium');
const webdriver = require('selenium-webdriver');

exports.initBrowser = function(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;
  
  if (process.env.CLEAN_SESSIONS) {
    log.info('attempting to clear /tmp directory')
    log.info(child.execSync('rm -rf /tmp/core*').toString());
  }

  log.info(`Received event: ${JSON.stringify(event, null, 2)}`);
  
  // Creates a new session on each event (instead of reusing for performance benefits)
  if (process.env.CLEAN_SESSIONS) {
    $browser = chromium.createSession();
  }
  return $browser;
};

exports.buildOptions = (event, browser) => {
  var opts = opts = {
    browser: $browser,
    driver: webdriver
  };

  const inputParam = event.Base64Script || process.env.BASE64_SCRIPT;
  if (inputParam) {
    var inputBuffer = Buffer.from(inputParam, 'base64').toString('utf8');
    opts.scriptText = inputBuffer;

  } else {
    opts.scriptText = undefined
  }

  return opts;
};

exports.executeScript = function (opts = {}, callback) {
  const browser = opts.browser;
  const driver = opts.driver;
  var output = '';
  var scriptText = opts.scriptText;

  // Just visit a web page if a script isn't specified
  if (scriptText === undefined) {
    scriptText = require('fs').readFileSync(require('path').join(__dirname, 'visit-page.js'), 'utf8').toString();
  }
  log.info(`Executing script "${scriptText}"`);

  if (typeof scriptText !== 'string') {
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
    '$pageUrl': opts.pageUrl,
    'console': consoleWrapper
  };

  // vm is basically eval
  const script = new vm.Script(scriptText);
  // TODO: Set timeout options for VM context

  const scriptContext = new vm.createContext(sandbox);
  try {

    // need to pull in variables from this and pass to result
    const result = script.runInContext(scriptContext).then(result => console.log(result));

    console.log("result", result)
  } catch (e) {
    log.error(`[script error] ${e}`);
    return callback(e, null);
  }

  // https://github.com/GoogleChrome/puppeteer/issues/1825#issuecomment-372241101
  // Reuse existing session, likely some edge cases around this...
  if (process.env.CLEAN_SESSIONS) {
    browser.quit().then(function () {
      callback(null, output);
    });
  } else {
    browser.manage().deleteAllCookies().then(function () {
      return browser.get('about:blank').then(function () {
        callback(null, output);
      });
    }).catch(function (err) {
      callback(err, output);
    });
  }
}
