# Exception

[![Version npm][version]](http://browsenpm.org/package/exception)[![Build Status][build]](https://travis-ci.org/observing/exception)[![Dependencies][david]](https://david-dm.org/observing/exception)[![Coverage Status][cover]](https://coveralls.io/r/observing/exception?branch=master)

[version]: http://img.shields.io/npm/v/exception.svg?style=flat-square
[build]: http://img.shields.io/travis/observing/exception/master.svg?style=flat-square
[david]: https://img.shields.io/david/observing/exception.svg?style=flat-square
[cover]: http://img.shields.io/coveralls/observing/exception/master.svg?style=flat-square

Exception is nifty little module that will make your life a lot easier when your
applications start crashing. So what makes Exception exceptional:

- **git**: When it detects that your application runs from git repository it
  will automatically include the sha1, branch and even it's configuration in the
  output.

- **process**: Useful information like load average, uptime, free memory, heap
  size, process id and even the build information of your node process are
  included.

- **modules**: A dump of all loaded modules is included. This includes node's
  modules, native compiled modules and user modules.

- **heapdump**: We automatically generate a heap dump of your process. This
  allows you to inspect the state of the application during the crash.

And much much more. If you need more information do not hesitate to create an
issue on our Github issue tracker because that same information might also be
useful for others!

To store all this information in a redundant way we support different modes of
outputting this data:

- **disk**: We automatically create an `exception` folder your current working
  directory where all dumps will be added. With the disk mode we add a JSON
  document of all the information as well as the `.heapsnapshot` of the process.
- **console**: We output the information to **stderr**.
- **remote**: Alternatively you can store this information in a database.

See the [usage](#usage) section for detailed information.

## Installation

This module is released in npm and we advise you to only include this module
once in your application. This module is not meant as library dependency but as
application dependency. So to install this module as dependency of your
application run:

```
npm install --save exception
```

If you're stubborn and want it as library dependency run:

```
node -e "console.log('DO NOT INSTALL THIS A LIBRARY DEPENDENCY')"
```

## Usage

In all the examples we assume that you've required the library in your
**application** using:

```js
'use strict';

var Exception = require('exception');
```

To temporary disable exceptions being processed by this module set an
enviroment variable.

```
EXCEPTION=false npm run something
```

This requires the `Exception` class so you can generate new exceptions. One of
the places where you want to generate an exception is in the `uncaughtException`
handler. You can do this manually using:

```js
process.once('uncaughtException', function derp(err) {
  var exception = new Exception(err);

  exception.save();
});
```

Or use our convenience method:

### Exception.listen

The exposed `.listen` function will automatically assign a
`process.once(uncaughtException)` handler which will automatically save the
exception for you **and** a `process.on(SIGUSR1)` which will generate heap dumps
every single time it's called.

You can supply the `.listen` function with a callback which will be called once
the exception has been saved so you can exit the process your self. If you do
not exit the node process we will attempt to abort the node process so the
operation system will also generate a dump of the application.

```js
Exception.listen();

// or

Exception.listen(function fn() {
  additionalCleanup();
  process.exit(1);
});
```

### Extending exceptions

As you've might have read in the intro, we support different ways of storing
data. One of these ways was `remote` storage. In order to use this you need to
create a custom instance of Exception and extend it with a custom `remote`
method:

```js
var CustomException = Exception.extend({
  remote: function remote(fn) {
    putthisshitinmongodbmethod(this.JSON(), fn);
  }
});
```

We assume that the `putthisshitinmongodbmethod` does your fancy pancy database /
storage call and calls the `fn` when completed.

By default we just dump all the information in the `process.cwd()` of your node
process. This can be less then ideal in certain cases as you might want to store
the heapdumps and json dumps on a different disk. You can configure the location
of the dumps by changing the `directory` property:

```js
var CustomException = Exception.extend({
  // imagine that this comment is actually the remote code of the example above.

  directory: '/my/root/volume/shared/goat/waffles'
});
```

You can now use your custom exception in the exact same way as the regular
exception:

```js
process.once('uncaughtException', function (err) {
  var exception = new CustomException(err);

  exception.save();
});

//
// and even the .listen method would still work:
//

CustomException.listen();
```

In the example code above you might have noticed the `.toJSON` method. We got a
bunch of those available. Here's a list of all of the things that is available:

### Exception.toJSON

Generate the JSON dump and return it. As this method is called `toJSON` it will
also automatically be called when you run `JSON.stringify(exception)`.

```js
var exception = new Exception(err);

var data = exception.toJSON();
console.log(JSON.stringify(exception));
```

### Exception.toString

Generate a some what human readable output. (Just a prettified JSON output atm,
pull requests regarding this will be accepted in a heartbeat. Was intended for
development purposes).

```js
var exception = new Exception(err);

console.log(exception.toString());
```

### Exception.disk

Write the exception's JSON dump to disk **and** generate the heapdump. Please
note that this is a synchronous process and that your node process will stall
for a bit. But this is worth it in the end as you wouldn't be generating
exceptions if something is seriously fucked up.

```js
var exception = new Exception(err);
exception.disk();
```

### Exception.console

Write the JSON dump to the console. With an empty line before and after the
dump. It uses `console.error` which will write the output to **stderr** and
`console.*` is blocking write call to stderr.

```js
var exception = new Exception(err);
exception.console();
```

### Exception.remote

This function does nothing by default. It's just a `process.nextTick` which
calls the supplied callback. It does nothing because it's left for you to
implement it. See [extending exceptions](#extending-exceptions).

### Exception.save

This saves the exception using the console, disk and remote method. Redundancy
all the exception outputs. When no callback is supplied in this method we will
automatically attempt to destroy your node process using `process.abort()` so
the OS can save a core file of the app. This should be the recommended approach
for storing your exceptions.

```js
var exception = new Exception(err);

exception.save();
```

## Example output

Of course, actions speak louder than words, but I hope that it's same with
example output:

```
{
  "node": {
    "http_parser": "1.0",
    "node": "0.10.28",
    "v8": "3.14.5.9",
    "ares": "1.9.0-DEV",
    "uv": "0.10.27",
    "zlib": "1.2.3",
    "modules": "11",
    "openssl": "1.0.1g"
  },
  "version": "0",
  "environment": {
    "args": [
      "node",
      "/Foo/Bar/Directory/exception/example.js"
    ],
    "node": "/usr/bin/node",
    "cwd": "/Foo/Bar/Directory/exception",
    "env": {
      "Apple_PubSub_Socket_Render": "/tmp/launch-KN4Qeq/Render",
      "LANG": "en_US.UTF-8",
      "TERM": "xterm",
      "USER": "V1",
      "DISPLAY": "/tmp/launch-rebH0I/org.macosforge.xquartz:0",
      "TERM_PROGRAM": "iTerm.app",
      "ITERM_PROFILE": "Molokai",
      "__CHECKFIX1436934": "1",
      "SHELL": "/bin/zsh",
      "SHLVL": "1",
      "ZSH_THEME": "3rdEden",
      "HISTFILE": "~/.zsh_history",
      "HISTFILESIZE": "65536",
      "HISTSIZE": "10000",
      "SAVEHIST": "10000",
      "EDITOR": "vim",
      "GREP_COLOR": "1;32",
      "PAGER": "less",
      "LESS": "-R",
      "LC_CTYPE": "en_US.UTF-8"
    },
    "gid": 20,
    "uid": 501
  },
  "git": {
    "checkout": "refs/heads/master",
    "sha1": "d6c64e37370b4205000a6f67bc358a8d2dacd5af"
  },
  "system": {
    "platform": "darwin",
    "arch": "x64",
    "hostname": "Fortress-Maximus.local"
  },
  "process": {
    "load": [
      1.736328125,
      1.9658203125,
      2.03125
    ],
    "uptime": 2454790,
    "freemem": 2333417472,
    "totalmem": 8589934592,
    "heap": {
      "rss": 13701120,
      "heapTotal": 6163968,
      "heapUsed": 2073320
    },
    "pid": 10011,
    "features": {
      "debug": false,
      "uv": true,
      "ipv6": true,
      "tls_npn": true,
      "tls_sni": true,
      "tls": true
    },
    "modulesloaded": [
      "Binding evals",
      "Binding natives",
      "NativeModule events",
      "NativeModule buffer",
      "Binding buffer",
      "NativeModule assert",
      "NativeModule util",
      "NativeModule path",
      "NativeModule module",
      "NativeModule fs",
      "Binding fs",
      "Binding constants",
      "NativeModule stream",
      "NativeModule _stream_readable",
      "NativeModule _stream_writable",
      "NativeModule _stream_duplex",
      "NativeModule _stream_transform",
      "NativeModule _stream_passthrough",
      "NativeModule os",
      "Binding os",
      "UserModule .",
      "UserModule heapdump/build/Release/heapdump",
      "UserModule fusing",
      "UserModule predefine",
      "UserModule extendable",
      "UserModule ./package",
      "UserModule moduleloadlist"
    ]
  },
  "exception": {
    "ocurred": "2014-08-18T18:53:21.136Z",
    "ms": 1408388001136,
    "message": "fucked",
    "stacktrace": [
      "Error: fucked",
      "at Object.<anonymous> (/Foo/Bar/Directory/exception/example.js:11:7)",
      "at Module._compile (module.js:456:26)",
      "at Object.Module._extensions..js (module.js:474:10)",
      "at Module.load (module.js:356:32)",
      "at Function.Module._load (module.js:312:12)",
      "at Function.Module.runMain (module.js:497:10)",
      "at startup (node.js:119:16)",
      "at node.js:906:3"
    ]
  }
}
```

## License

MIT
