# pg-pipe

[![Build Status](https://travis-ci.org/brianc/node-pg-pipe.svg?branch=master)](https://travis-ci.org/brianc/node-pg-pipe)

Given two connected [pg-native](https://github.com/brianc/node-pg-native) clients, use a very efficient row by row copy with libpq to move data between them.

### install

```bash
$ npm install pg-pipe
```

### use

I'm using _sync_ calls of `connect` and `query` below to make the example more readable, but the actual _piping_ is completely non-blocking.  You can use completely non-blocking queries and connection as well, I just think the example is more readable with less callbacks in it.

```js
var pipe = require('pg-pipe');
var Client = require('pg-native');
var from = new Client();
var to = new Client();

from.connectSync();
to.connectSync();

//prepare the source client to start
//sending rows over the copy protocol
from.querySync('COPY some_table TO stdout');

//prepare the destination client to start
//recieving rows over the copy protocol
to.querySync('COPY some_table FROM stdin');

//now use libpq's built-in efficient row-by-row copy mode
//to move data at the speed of magic!
pipe(from, to, function(err) {
  //callback will be called once the operation is done
});
```

### API

##### `pipe(from:Client, to:Client, callback:function(err:error))`

Pipes data from one client to another.  Both clients need to be connected and already in their respective `COPY` modes which are started by issuing the corresponding `COPY FROM / COPY TO` queries.


### license

The MIT License (MIT)

Copyright (c) 2014 Brian M. Carlson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
