// Requirements
var mongo = require( 'mongodb' ).MongoClient;
var api = require( '../api.js' );

// Set test eviroment
process.env.CONFIG = 'test';

// Configuration
var config = require( '../lib/config.js');

// Clear database
before( function( done ) {
  mongo.connect( config.db, function( err, db ){
    db.dropDatabase( );
    api.listen( config.port, '127.0.0.1' );
    done();
  } );
} );
