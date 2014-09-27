// Requirements
var mongo = require( 'mongodb' ).MongoClient;
var users; // Required later, when database is clean

// Configuration
var config = require( '../lib/config.js');

describe( 'model/users.js', function() {
  // Remove all collections
  before( function( done ) {
    mongo.connect( config.db, function( err, db ){
      db.dropDatabase();
      done();
    } );
  } );

  it( 'should return 500 error when database is not connected', function(done) {
    users = require( '../model/users.js' );

    users.get( 'notfound', {}, function( err, res ) {
      if( err && err.code == 500 ) {
        users.on( 'ready', done );
      } else {
        throw new Error();
      }
    } );
  } );

  it( 'should return 404 error when getting a non-existent user', function(done) {
    users.get( 'notfound', {}, function( err, res ) {
      if( err && err.code == 404 ) {
        done();
      } else {
        throw new Error();
      }
    } );
  } );

  it( 'should return 409 error when stating wrong schema', function(done) {
    users.add( {}, function( err, res ) {
      if( err && err.code == 409 ) {
        done();
      } else {
        throw new Error();
      }
    } );
  } );

  it( 'should create a new user \'bob\'', function(done) {
    users.add( {
      id: 'bob',
      password: 'password',
      email: 'bob@ikt.uni-hannover.de',
      roles: { guest: true, operator: true, admin: true }
    }, done );
  } );


  it( 'should fail creating a second user \'bob\'', function(done) {
    users.add( {
      id: 'bob',
      password: 'password',
      email: 'bob@ikt.uni-hannover.de',
      roles: { guest: true, operator: true, admin: true }
    }, function( err, res ){
      if( err && err.code == 409 ) return done();
      throw new Error();
    } );
  } );

  it( 'should create a new user \'alice\'', function(done) {
    users.add( {
      id: 'alice',
      password: 'password',
      email: 'alice@ikt.uni-hannover.de',
      roles: { guest: true, operator: true, admin: true }
    }, done );
  } );

  it( 'should return \'alice\'', function(done) {
    users.get( 'alice', {}, function( err, res ) {
      if( err ) throw err;

      if( res.id == "alice" ) return done();
      throw new Error();
    } );
  } );

  it( 'should return two users, \'alice\' first', function(done) {
    users.find( { sort: [ 'id' ] }, function( err, res ) {
      if( err ) throw err;

      if( res.data.length == 2 && res.data[0].id == "alice" ) return done();
      throw new Error();
    } );
  } );

  it( 'should return two users, \'bob\' first', function(done) {
    users.find( { sort: [ '-id' ] }, function( err, res ) {
      if( err ) throw err;

      if( res.data.length == 2 && res.data[0].id == "bob" ) return done();
      throw new Error();
    } );
  } );

  it( 'should fail editing \'notfound\' and return 404', function(done) {
    users.update( 'notfound', { enabled: true }, function( err, res ) {
      if( err && err.code == 404 ) {
        done();
      } else {
        throw new Error();
      }
    } );
  } );

  it( 'should edit \'bob\' and set confirmed to true', function(done) {
    users.update( 'bob', { confirmed: true }, done );
  } );

  it( 'should fail removing \'notfound\' and return 404', function(done) {
    users.remove( 'notfound', function( err, res ) {
      if( err && err.code == 404 ) {
        done();
      } else {
        throw new Error();
      }
    } );
  } );

  it( 'should remove \'alice\'', function(done) {
    users.remove( 'alice', done );
  } );
} );
