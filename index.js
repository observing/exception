'use strict';

var failing = require('failing-code')
  , heapdump = require('heapdump')
  , fuse = require('fusing')
  , path = require('path')
  , ini = require('ini')
  , os = require('os')
  , fs = require('fs');

//
// Make sure that we have an exceptions directory where we can write our disk
// based errors to.
//
var dir = path.resolve(process.cwd(), 'exceptions');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

//
// Bump the stackTraceLimit in development, 10 is way to low but setting it
// higher would make the process run slower.
//
if ('production' !== (process.env.NODE_ENV || '').toLowerCase()) {
  Error.stackTraceLimit = Error.stackTraceLimit !== 10
    ? Error.stackTraceLimit
    : 25;
}

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
 * @param {Object} options Configuration.
 * @api public
 */
function Exception(err, options) {
  if (!(this instanceof Exception)) return new Exception(err, options);
  if ('string' === typeof err) err = {
    stack: (new Error()).stack,
    message: err.message
  };

  options = options || {};

  this.id = id++;
  this.message = err.message;
  this.stack = err.stack;
  this.human = !!options.human;

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
Exception.readable('toJSON', function extract() {
  //
  // Prevent duplicate generation.
  //
  if (this.capture) return this.capture;

  var memory = process.memoryUsage()
    , readable = this.human
    , load = os.loadavg()
    , cpus = os.cpus();

  /**
   * Make the bytes human readable if needed.
   *
   * @param {Number} b Bytes
   * @returns {String|Number}
   * @api private
   */
  function bytes(b) {
    if (!readable) return b;

    var tb = ((1 << 30) * 1024)
      , gb = 1 << 30
      , mb = 1 << 20
      , kb = 1 << 10
      , abs = Math.abs(b);

    if (abs >= tb) return (Math.round(b / tb * 100) / 100) + 'tb';
    if (abs >= gb) return (Math.round(b / gb * 100) / 100) + 'gb';
    if (abs >= mb) return (Math.round(b / mb * 100) / 100) + 'mb';
    if (abs >= kb) return (Math.round(b / kb * 100) / 100) + 'kb';

    return b + 'b';
  }

  return {
    node: process.versions,
    version: require('./package.json').version.split('.').shift(),
    environment: {
      args: process.argv,
      node: process.execPath,
      cwd: process.cwd(),
      env: Object.keys(process.env).sort().reduce(function reassemble(memo, key) {
        memo[key] = process.env[key];
        return memo;
      }, {}),
      gid: process.getgid(),
      uid: process.getuid()
    },
    git: this.git(),
    system: {
      platform: process.platform,
      arch: process.arch,
      hostname: os.hostname(),
      freemem: bytes(os.freemem()),
      totalmem: bytes(os.totalmem()),
      cpu: {
        load: {
           1: load[0],
           5: load[1],
          15: load[2]
        },
        cores: cpus.length,
        speed: cpus.reduce(function sum(memo, cpu) {
          return memo + cpu.speed;
        }, 0) / cpus.length,
        model: cpus[0].model
      }
    },
    process: {
      uptime: os.uptime(),
      title: process.title,
      active: {
        requests: process._getActiveRequests.length,
        handles: process._getActiveHandles.length
      },
      memory: {
        rss: bytes(memory.rss),
        heap: {
          used: bytes(memory.heapUsed),
          allocated: bytes(memory.heapTotal)
        },
        native: bytes(memory.rss - memory.heapTotal)
      },
      pid: process.pid,
      features: process.features,
      modulesloaded: require('moduleloadlist')()
    },
    exception: {
      ocurred: new Date(),
      ms: Date.now(),
      message: this.message,
      stacktrace: this.stack.split('\n').map(function map(line) {
        return line.trim();
      }),
      line: (failing(this) || []).filter(function filter(stack) {
        return stack.failed;
      })
    }
  };
});

/**
 * Create a human readable exception output.
 *
 * @returns {String}
 * @api private
 */
Exception.readable('toString', function toString() {
  var str = JSON.stringify(this, null, 2)
    .replace(/\}/g, '')
    .replace(/\{/g, '');

  return str;
});

/**
 * Fetch the current branch and SHA1 from the .git folder.
 *
 * @returns {Object} git checkout
 * @api private
 */
Exception.writable('git', function git() {
  //
  // Approach:
  //
  // - Walk the directory tree in search of .git directory
  // - fetch the .git/HEAD file to find out the "current" branch
  // - fetch the ref/<>/<> for the SHA
  //
  var dir = process.cwd().split(path.sep)
    , read = fs.readFileSync
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
        , data
        , sha1;

      //
      // Read-out the git configuration for some additional information about
      // the users project.
      //
      try { data = ini.parse(read(path.join(dot, 'config'), 'utf-8')); }
      catch (e) { data = {}; }

      //
      // Fetch the 'ref: ref/heads/branch' content and clean it up so we have
      // a reference to the correct ref file with the SHA-1
      //
      try { checkout = read(fetch, 'utf-8').slice(5).trim(); }
      catch (e) {}

      fetch = path.resolve(dot, checkout);
      try { sha1 = read(fetch, 'utf-8').trim(); }
      catch (e) {}

      if (checkout) data.checkout = checkout;
      if (sha1) data.sha1 = sha1;

      return data;
    } else {
      dir.pop();
    }
  }

  return {};
});

/**
 * Write the exception to disk.
 *
 * @api public
 */
Exception.writable('disk', function disk() {
  var location = path.resolve(process.cwd(), 'exceptions', this.filename);

  //
  // First write our own dump of gathered information.
  //
  try { fs.writeFileSync(location +'.json', JSON.stringify(this)); }
  catch (e) { console.error('Failed to write exception to disk', e); }

  //
  // Now try to write out the heap dump.
  //
  heapdump.writeSnapshot(location +'.heapsnapshot');

  return this;
});

/**
 * Write the exception to STDOUT;
 *
 * @api public
 */
Exception.writable('console', function log() {
  console.error('');
  console.error('Exception ('+ this.filename +') :');
  console.error(JSON.stringify(this.toJSON(), null, 2));
  console.error('');

  return this;
});

/**
 * Write the connection to a remove server.
 *
 * @param {Function} callback
 * @api public
 */
Exception.writable('remote', function remote(fn) {
  process.nextTick(fn);
  return this;
});

/**
 * Saves the exception. It saves this to disk automatically. When no callback is
 * supplied it will just completely demolish your node process so it will exit.
 *
 * @param {Function} fn Callback for when everything is saved;
 * @api public
 */
Exception.readable('save', function save(fn) {
  return this.console().disk().remote(fn || function abort() {
    //
    // Exit the program using `process.abort()` which is abort(3C) on some
    // systems this causes the OS to save a core file that can be used to
    // read the JavaScript level state. Which could be helpful for debugging
    // purposes. When `process.abort()` is not available SIGABRT is used
    // instead.
    //
    // @TODO make this optional.
    //
    if (process.abort) process.abort();
    for (;;) process.kill(process.pid, 'SIGABRT');
  });
});

/**
 * Tired of writing uncaughtException? Simply include:
 *
 * ```js
 * require('exception').listen();
 * ```
 *
 * In your scripts and you're ready for debugging heaven.
 *
 * @param {Function} fn Optional callback function when our exception has written.
 * @returns {Exception}
 * @api public
 */
Exception.listen = function listen(fn) {
  var Failure = this;

  //
  // Listen for exception once as we do not want to generate an exception for
  // our exception when our exception leads to an exception as you would get
  // exception inception.
  //
  process.once('uncaughtException', function uncaught(err) {
    (new Failure(err)).save(fn);
  });

  //
  // Also listen to SIGURD to write a heap dump so we can do heap inspections
  // of running applications.
  //
  process.on('SIGUSR1', function signal() {
    var name = new Date().toDateString().split(' ').concat([
      process.pid,     // The current process id
      id++              // Unique id for this exception.
    ]).join('-') +'.heapsnapshot';

    heapdump.writeSnapshot(path.resolve(process.cwd(), 'exceptions', name));
  });

  return this;
};

//
// Expose the module.
//
module.exports = Exception;
