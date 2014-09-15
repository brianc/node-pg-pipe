var Client = require('pg-native');
var pipe = require('../');
var ok = require('okay');
var assert = require('assert');

describe('pipe', function() {
  before(function() {
    this.from = new Client();
    this.to = new Client();
    this.from.connectSync();
    this.to.connectSync();
    var createTable = 'CREATE TEMP TABLE test_person(name text, age int)';
    this.from.querySync(createTable);
    this.to.querySync(createTable);
    this.to.querySync('CREATE TEMP TABLE numbors(num int)');

    //insert a few rows
    this.from.querySync("INSERT INTO test_person VALUES('Brian', 32)");
    this.from.querySync("INSERT INTO test_person VALUES('Aaron', 30)");
    this.from.querySync("INSERT INTO test_person VALUES('Shelley', 28)");
  });

  it('works', function(done) {
    this.from.querySync('COPY test_person TO stdout');
    this.to.querySync('COPY test_person FROM stdin');
    var self = this;
    pipe(this.from, this.to, function(err) {
      assert.ifError(err);
      var rows = self.to.querySync('SELECT * FROM test_person ORDER BY age DESC');
      assert.equal(rows.length, 3);
      assert.equal(rows[0].name, 'Brian');
      assert.equal(rows[1].name, 'Aaron');
      assert.equal(rows[2].name, 'Shelley');
      done();
    });
  });

  it('pipes a huge amount of data', function(done) {
    this.from.querySync('COPY (SELECT * FROM generate_series(0, 10000)) TO stdout');
    this.to.querySync('COPY numbors FROM stdin');
    var self = this;
    pipe(this.from, this.to, function(err) {
      assert.ifError(err);
      self.to.query('SELECT COUNT(*) FROM numbors', function(err, rows) {
        assert.ifError(err);
        assert.equal(rows.length, 1);
        assert.equal(parseInt(rows[0].count), 10001);
        done();
      });
    });
  });

  after(function() {
    this.from.end();
    this.to.end();
  })
});
