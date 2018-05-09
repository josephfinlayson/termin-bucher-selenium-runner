
const sandbox = require('./sandbox');


function validate(eventBody) {
  const {firstName, lastName, email} = eventBody

  return true

}

module.exports = function (event, context, callback) {
  $browser = sandbox.initBrowser(event, context);
  const errorMessage = '';
  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": 'application/text',
      "X-Error": errorMessage || null
    },
    body: '',
    isBase64Encoded: false
  };
  const body = event.body;

  const contentType = event.headers['Content-Type'] || event.headers['content-type'];
  const result = {};
  callback(result)
};
