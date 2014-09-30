var mongo = require( 'mongodb' ).MongoClient;
var should = require( 'should' );
var request = require( 'supertest' );
var users= require( '../model/users.js' );
var api = require( '../api.js' );

// Configuration
var config = require( '../lib/config.js');


describe('API - Users', function() {
  before( function( done ) {
    users.add( {
      id: 'admin',
      password: 'password',
      email: 'test@example.com',
      enabled: true,
      confirmed: true,
      roles: { admin: true, operator: false, guest: false }
    }, done );
  } );

  it('should create new user account and ignore protected fields', function( done ) {
    request(config.base)
      .post('/users')
      .type('application/vnd.api+json')
      .send( JSON.stringify( { users: {
        id: 'alice',
        password: 'password',
        email: 'test@example.com',
        enabled: false,
        confirmed: true,
        roles: { admin: true, operator: true, guest: true} } } ) )
      .expect( 201 )
      .expect( 'Location', config.base + '/users/alice' )
      .expect( 'Content-Type', 'application/vnd.api+json' )
      .end( function( err, res ) {
        if( err ) throw err;
        if( ! res.body.users ) res.body = JSON.parse( res.text );
        var u = res.body.users;
        u.id.should.equal('alice');
        u.enabled.should.equal(true);
        u.confirmed.should.equal(false);
        u.roles.admin.should.equal(false);
        u.roles.operator.should.equal(true);
        u.roles.guest.should.equal(true);
        done();
      } );
  } );

  it('should fail creating account with existent id', function( done ) {
    request(config.base)
      .post('/users')
      .type('application/vnd.api+json')
      .send( JSON.stringify( { users: {
        id: 'alice',
        password: 'password',
        email: 'test@example.com',
        enabled: false,
        confirmed: true,
        roles: { admin: true, operator: true, guest: true} } } ) )
      .expect( 409, done );
  } );

  it('should create new user account and allow protected fields for admins', function( done ) {
    request(config.base)
      .post('/users')
      .type('application/vnd.api+json')
      .auth('admin', 'password')
      .send( JSON.stringify( { users: {
        id: 'charlie',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { admin: true, operator: true, guest: true} } } ) )
      .expect( 201 )
      .expect( 'Location', config.base + '/users/charlie' )
      .expect( 'Content-Type', 'application/vnd.api+json' )
      .end( function( err, res ) {
        if( err ) throw err;
        if( ! res.body.users ) res.body = JSON.parse( res.text );
        var u = res.body.users;
        u.id.should.equal('charlie');
        u.enabled.should.equal(true);
        u.confirmed.should.equal(true);
        u.roles.admin.should.equal(true);
        u.roles.operator.should.equal(true);
        u.roles.guest.should.equal(true);
        done();
      } );
  } );

  it('should not return confirmation_key for non-admin account', function( done ) {
    request(config.base)
      .get('/users/alice?fields=confirmation_key')
      .auth('alice', 'password')
      .expect( 401, done )
  } );

  it('should not return any data for non-users', function( done ) {
    request(config.base)
      .get('/users/alice')
      .expect( 401, done )
  } );

  var key;
  it('should return confirmation_key when admin asks for', function( done ) {
    request(config.base)
      .get('/users/alice?fields=confirmation_key')
      .auth('admin', 'password')
      .type('application/vnd.api+json')
      .expect( 200 )
      .expect( 'Content-Type', 'application/vnd.api+json' )
      .end( function( err, res ) {
        if( err ) throw err;
        if( ! res.body.users ) res.body = JSON.parse( res.text );
        var u = res.body.users;
        u.should.have.property('confirmation_key');
        key = u.confirmation_key;
        done();
      } );
  } );

  it('should fail confirmation when no confirmation_key is given', function( done ) {
    request(config.base)
      .put('/users/alice')
      .auth('alice', 'password')
      .expect( 400, done );
  } );

  it('should confirm when key is given', function( done ) {
    request(config.base)
      .put('/users/alice?confirmation_key=' + key)
      .auth('alice', 'password')
      .type('application/vnd.api+json')
      .send( JSON.stringify( { users: {
        id: 'alice',
        confirmed: true  } } ) )
      .expect( 200 )
      .expect( 'Content-Type', 'application/vnd.api+json' )
      .end( function( err, res ) {
        if( err ) throw err;
        if( ! res.body.users ) res.body = JSON.parse( res.text )
        var u = res.body.users;
        u.confirmed.should.equal( true );
        done();
      } );
  } );

  it('should fail confirmation when no confirmation_key is given', function( done ) {
    request(config.base)
      .put('/users/alice')
      .auth('alice', 'password')
      .expect( 400, done );
  } );

  it('should allow changing own password', function( done ) {
    request(config.base)
      .put('/users/alice')
      .auth('alice', 'password')
      .type('application/vnd.api+json')
      .send( JSON.stringify( { users: {
        id: 'alice',
        password: '12345678'  } } ) )
      .expect( 200 )
      .expect( 'Content-Type', 'application/vnd.api+json' )
      .end( function( err, res ) {
        if( err ) throw err;
        done();
      } );
  } );

  it('should prohibit changing other passwords', function( done ) {
    request(config.base)
      .put('/users/bob')
      .auth('alice', 'password')
      .type('application/vnd.api+json')
      .send( JSON.stringify( { users: {
        id: 'alice',
        password: '12345678'  } } ) )
      .expect( 401, done );
  } );

  it('should allow changing other passwords for admins', function( done ) {
    request(config.base)
      .put('/users/alice')
      .auth('admin', 'password')
      .type('application/vnd.api+json')
      .send( JSON.stringify( { users: {
        id: 'bob',
        password: '12345678'  } } ) )
      .expect( 200 )
      .expect( 'Content-Type', 'application/vnd.api+json' )
      .end( function( err, res ) {
        if( err ) throw err;
        done();
      } );
  } );

  it('should prohibit changing enabled flag for non-admins', function( done ) {
    request(config.base)
      .put('/users/alice')
      .auth('alice', '12345678')
      .type('application/vnd.api+json')
      .send( JSON.stringify( { users: {
        id: 'alice',
        enabled: false  } } ) )
      .expect( 200 )
      .expect( 'Content-Type', 'application/vnd.api+json' )
      .end( function( err, res ) {
        if( err ) throw err;
        if( ! res.body.users ) res.body = JSON.parse( res.text )
        var u = res.body.users;
        u.enabled.should.equal( true );
        done();
      } );
  } );

  it('should allow admins to disable accounts', function( done ) {
    request(config.base)
      .put('/users/alice')
      .auth('admin', 'password')
      .type('application/vnd.api+json')
      .send( JSON.stringify( { users: {
        id: 'alice',
        enabled: false  } } ) )
      .expect( 200 )
      .expect( 'Content-Type', 'application/vnd.api+json' )
      .end( function( err, res ) {
        if( err ) throw err;
        if( ! res.body.users ) res.body = JSON.parse( res.text )
        var u = res.body.users;
        u.enabled.should.equal( false );
        done();
      } );
  } );

  it('should prohibit changing account settings for disabled users', function( done ) {
    request(config.base)
      .put('/users/alice')
      .auth('alice', '12345678')
      .type('application/vnd.api+json')
      .send( JSON.stringify( { users: {
        id: 'alice',
        email: 'changed@example.com'  } } ) )
      .expect( 401, done );
  } );

  it('should allow getting account details for disabled users', function( done ) {
    request(config.base)
      .get('/users/alice')
      .auth('alice', '12345678')
      .expect( 200, done );
  } );

  it('should allow deleting accounts', function( done ) {
    request(config.base)
      .delete('/users/charlie')
      .auth('charlie', 'password')
      .expect( 204, done );
  } );

} );
