// This is the default lambdium webdriver script: it just visits a page url.

// variables in context =


$browser.get("HTTP://GOOGLE.COM").then(function () {
  console.log('attempting to book appointment for', firstName, lastName, email);

  return "result pulled from page"
}).catch(function () {

  return "error spulled from page"

});
