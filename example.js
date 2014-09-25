'use strict';

var Exception = require('./')
  , path = require('path');

//
// Create a custom instance with a different path to store the dumps.
//
var Example = Exception.extend({
  directory: path.join(__dirname, 'custom-path')
});

//
// Add the default uncaught Exception listeners.
//
Example.listen();

//
// BOOM. DED.
//
throw new Error('fucked');
