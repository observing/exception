# Exception

Better errors for Node applications that run in production. It outputs useful
process information that will aid in debugging the crashes. The information can
be saved to disk, console and a remote database or just stored a JSON document.

## Installation

```
npm install --save exception
```

## Usage

In all examples we assume that you've loaded the library in this way:

```js
'use strict';

var Exception = require('exception');
```

To create a new exception you first need to have an error:

```js
var exception = new Exception(err);
```

## Example output

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
