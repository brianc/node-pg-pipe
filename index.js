var readBuffer = function(pq, cb) {
  var result = pq.getCopyData(true);
  if(result === -1) {
    return cb(null, null);
  }
  if(result === 0) {
    pq.once('readable', function() {
      pq.stopReader();
      pq.consumeInput();
      return readBuffer(pq, cb);
    });
    return pq.startReader();
  }
  //we have a result buffer
  return cb(null, result);
};

var writeBuffer = function(pq, buffer, cb) {
  var result = pq.putCopyData(buffer);

  //sent successfully
  if(result === 1) return cb();

  //error
  if(result === -1) return cb(new Error(pq.errorMessage()));

  //command would block. wait for writable and call again.
  return pq.writable(function() {
    writeBuffer(pq, buffer, cb);
  });
};

var consumeResults = function(pq, cb) {

  var cleanup = function() {
    pq.removeListener('readable', onReadable);
    pq.stopReader();
  }

  var readError = function(message) {
    cleanup();
    return cb(new Error(message || pq.errorMessage()));
  };


  var onReadable = function() {

    //read waiting data from the socket
    //e.g. clear the pending 'select'
    if(!pq.consumeInput()) {
      return readError();
    }

    //check if there is still outstanding data
    //if so, wait for it all to come in
    if(pq.isBusy()) {
      return;
    }

    //load our result object
    while(pq.getResult()) {
      if(pq.resultStatus() == 'PGRES_FATAL_ERROR') {
        return readError();
      }
    }

    cleanup();
    return cb(null);
  };
  pq.on('readable', onReadable);
  pq.startReader();
};

var end = function(pq, cb) {
  var result = pq.putCopyEnd();

  //success
  if(result === 1) return consumeResults(pq, cb);

  //error
  if(result === -1) return cb(new Error(pq.errorMessage()));

  //wait for writable
  return pq.writable(function() {
    end(pq, cb);
  });
}

//call with two clients already in copy modes
var pipe = module.exports = function(from, to, cb) {
  to.pq.setNonBlocking(true);
  var loop = function() {
    readBuffer(from.pq, function(err, buff) {
      if(err) return cb(err);
      if(!buff) return end(to.pq, cb);
      writeBuffer(to.pq, buff, function(err) {
        if(err) return cb(err);
        loop();
      });
    });
  };
  loop();
};
