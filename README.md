# Exception

Better errors for Node applications that run in production. It outputs useful
process information that will aid in debugging the crashes. The information can
be saved to disk, console and a remote dabase or just stored a JSON document.

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

## License

MIT
