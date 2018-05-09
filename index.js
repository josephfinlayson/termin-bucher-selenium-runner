const chromium = require("./lib/chromium");
const sandbox = require("./lib/sandbox");
const log = require("lambda-log");
const apiHandler = require("./lib/api-handler");

if (process.env.DEBUG_ENV || process.env.SAM_LOCAL) {
  log.config.debug = true;
  log.config.dev = true;
}

log.info("Loading function");

// Create new reusable session (spawns chromium and webdriver)
if (!process.env.CLEAN_SESSIONS) {
  $browser = chromium.createSession();
}

// Handler for POST events from API gateway
// curl -v -F "script=@examples/visitgoogle.js" <<API Gateway URL>>
exports.postApiGatewayHandler = apiHandler;

// Default function event handler
// Accepts events:
// * {"firstName": "", lastName: "", bookAppointent, }

exports.handler = (event, context, callback) => {
  $browser = sandbox.initBrowser(event, context);

  var opts = sandbox.buildOptions(event, $browser);
  const result = sandbox.executeScript(opts);


  result.then((result) => {
    if (process.env.LOG_DEBUG) {
      log.debug(child.execSync("ps aux").toString());
      log.debug(child.execSync("cat /tmp/chromedriver.log").toString());
    }


    callback(null, {
      successfullyBookedAppointment: true,
      message: "Finished executing script"
    });
  }).catch((err) => {
      if (process.env.LOG_DEBUG) {
        log.debug(child.execSync("ps aux").toString());
        log.debug(child.execSync("cat /tmp/chromedriver.log").toString());
      }

      log.error(err);
      return callback(err, null);
    }
  );
};
