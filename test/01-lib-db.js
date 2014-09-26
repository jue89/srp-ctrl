// Requirements
var mongo = require( 'mongodb' ).MongoClient;
var db = require( '../lib/db.js' );

// Configuration
var config = require( '../lib/config.js');

describe( 'lib/db.js', function() {
  // Remove all collections
  before( function( done ) {
    mongo.connect( config.db, function( err, db ){
      db.dropDatabase();
      done();
    } );
  } );

  it( 'should create a collection without indices', function(done) {
    db( 'test1', [], function( db ) { done(); } );
  } );

  it( 'should create a collection with one index', function(done) {
    db( 'test2', [ {'test':1} ], function( db ) { done(); } );
  } );

  it( 'should create a collection with multiple and combined indices', function(done) {
    db( 'test3', [ {'test':1,'test2':-1}, {'test3':1} ], function( db ) { done(); } );
  } );
} );
