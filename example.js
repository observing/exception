'use strict';

var Exception = require('./');

process.on('uncaughtException', function shit(err) {
  var exception = new Exception(err);

  exception.save();
});

throw new Error('fucked');
