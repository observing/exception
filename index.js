'use strict';

var fuse = require('fusing')
  , path = require('path')
  , os = require('os')
  , fs = require('fs');

//
// Make sure that we have an exceptions directory where we can write our disk
// based errors to.
//
var dir = path.resolve(process.cwd(), 'exceptions');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

/**
 * A "unique" id to prevent clashing and overriding of the disk cached
 * exceptions.
 *
 * @type {Number}
 * @private
 */
var id = fs.readdirSync(dir).length;

/**
 * Generates a new Exception.
 *
 * @constructor
 * @param {Error} err The error that caused the exception.
 * @api public
 */
function Exception(err) {
  if (!(this instanceof Exception)) return new Exception(err);
  if ('string' === typeof err) err = {
    message: err.message,
    stack: (new Error()).stack
  };

  this.id = id++;
  this.message = err.message;
  this.stack = err.stack;

  this.filename = new Date().toDateString().split(' ').concat([
    process.pid,    // The current process id
    this.id         // Unique id for this exception.
  ]).join('-');

  this.capture = this.toJSON();
}

fuse(Exception, Error);

/**
 * Generates a extra and useful meta data about the exception. And by using the
 * `toJSON` method it can automatically be used as `JSON.stringify(except)`.
 *
 * @return {Object} JSON structure with the error and it's meta data.
 * @api private
 */
Exception.prototype.toJSON = function extract() {
  //
  // Prevent duplicate generation.
  //
  if (this.capture) return this.capture;

  return {
    node: process.versions,
    version: require('./package.json').version.split('.').shift(),
    environment: {
      args: process.argv,
      node: process.execPath,
      cwd: process.cwd(),
      env: process.env,
      gid: process.getgid(),
      uid: process.getuid()
    },
    git: this.git(),
    system: {
      platform: process.platform,
      arch: process.arch,
      hostname: os.hostname(),
    },
    process: {
      load: os.loadavg(),
      uptime: os.uptime(),
      freemem: os.freemem(),
      totalmem: os.totalmem(),
      heap: process.memoryUsage(),
      pid: process.pid
    },
    exception: {
      ocurred: new Date(),
      ms: Date.now(),
      message: this.message,
      stacktrace: this.stack.split('\n').map(function map(line) {
        return line.trim();
      })
    }
  };
};

/**
 * Create a human readable exception output.
 *
 * @returns {String}
 * @api private
 */
Exception.prototype.toString = function toString() {
  var str = JSON.stringify(this, null, 2)
    .replace(/\}/g, '')
    .replace(/\{/g, '');

  return str;
};

/**
 * Fetch the current branch and SHA1 from the .git folder.
 *
 * @returns {Object} git checkout
 * @api private
 */
Exception.prototype.git = function git() {
  //
  // Approach:
  //
  // - Walk the directory tree in search of .git directory
  // - fetch the .git/HEAD file to find out the "current" branch
  // - fetch the ref/<>/<> for the SHA
  //
  var dir = process.cwd().split(path.sep)
    , isDirectory
    , dot;

  while (dir.length) {
    dot = dir.concat('.git').join(path.sep);

    //
    // Don't crash if this folder doesn't exist, it could be that we're not
    // installed through git.
    //
    try { isDirectory = fs.lstatSync(dot).isDirectory(); }
    catch (e) { continue; }

    if (isDirectory) {
      var fetch = path.resolve(dot, 'HEAD')
        , checkout
        , sha1;

      //
      // Fetch the 'ref: ref/heads/branch' content and clean it up so we have
      // a reference to the correct ref file with the SHA-1
      //
      try { checkout = fs.readFileSync(fetch, 'utf-8').slice(5).trim(); }
      catch (e) {}

      fetch = path.resolve(dot, checkout);
      try { sha1 = fs.readFileSync(fetch, 'utf-8').trim(); }
      catch (e) {}

      return {
        checkout: checkout,
        sha1: sha1
      };
    } else {
      dir.pop();
    }
  }

  return {};
};

/**
 * Write the exception to disk.
 *
 * @api private
 */
Exception.prototype.disk = function disk() {
  var location = path.resolve(process.cwd(), 'exceptions', this.filename +'.json');

  try { fs.writeFileSync(location, JSON.stringify(this)); }
  catch (e) { console.error('Failed to write exception to disk', e); }

  return this;
};

/**
 * Write the exception to STDOUT;
 *
 * @api private
 */
Exception.prototype.console = function log() {
  console.error('');
  console.error('Exception ('+ this.filename +') :');
  console.error(JSON.stringify(this.toJSON(), null, 2));
  console.error('');

  return this;
};

/**
 * Write the connection to a remove server.
 *
 * @param {Function} callback
 * @api private
 */
Exception.prototype.remote = function remote(fn) {
  process.nextTick(fn);
  return this;
};

/**
 * Saves the exception. It saves this to disk automatically. When no callback is
 * supplied it will just completely demolish your node process so it will exit.
 *
 * @param {Function} fn Callback for when everything is saved;
 * @api public
 */
Exception.prototype.save = function save(fn) {
  return this.console().disk().remote(fn || function abort() {
    //
    // Exit the program using `process.abort()` which is abort(3C) on some
    // systems this causes the OS to save a core file that can be used to
    // read the JavaScript level state. Which could be helpful for debugging
    // purposes. When `process.abort()` is not available SIGABRT is used
    // instead.
    //
    if (process.abort) process.abort();
    for (;;) process.kill(process.pid, 'SIGABRT');
  });
};

//
// Expose the module.
//
module.exports = Exception;
