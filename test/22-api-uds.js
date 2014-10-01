// Requirements
var async = require( 'async' );
var should = require( 'should' );
var request = require( 'supertest' );
var users = require( '../model/users.js' );
var aps = require( '../model/aps.js' );
var api = require( '../api.js' );

// Configuration
var config = require( '../lib/config.js');


describe('API - APs', function() {
  var id;
  before( function( done ) {
    // Create some users
    async.series( [
      function( done ) { users.add( {
        id: 'frank',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { admin: false, operator: true, guest: false }
      }, done ); },
      function( done ) { users.add( {
        id: 'hillary',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { admin: false, operator: false, guest: true }
      }, done ); },
      function( done ) { users.add( {
        id: 'buddah',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { admin: true, operator: false, guest: false }
      }, done ); },
      function( done ) { aps.add( {
        user_id: 'frank',
        public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a358'
      }, function( err, res ) {
        if( err ) throw err;
        id = res.id;
        done();
      } ); }
    ], done );
  } );

  it('should deny creating uds for non-guests', function( done ) {
    request(config.base)
      .post('/uds')
      .type('application/vnd.api+json')
      .auth('buddah', 'password')
      .send( JSON.stringify( { uds: {
        mac: '00:22:33:44:55:66',
        user_id: 'frank',
        last_ap_id: id
        } } ) )
      .expect( 404, done );
  } );

  it('should deny creating uds for non-admin', function( done ) {
    request(config.base)
      .post('/uds')
      .type('application/vnd.api+json')
      .auth('hillary', 'password')
      .send( JSON.stringify( { uds: {
        mac: '00:22:33:44:55:66',
        user_id: 'hillary',
        last_ap_id: id
        } } ) )
      .expect( 401, done );
  } );

  var ud_id;
  it('should create ud', function( done ) {
    request(config.base)
      .post('/uds')
      .type('application/vnd.api+json')
      .auth('buddah', 'password')
      .send( JSON.stringify( { uds: {
        mac: '00:22:33:44:55:66',
        user_id: 'hillary',
        last_ap_id: id
        } } ) )
      .expect( 201 )
      .end( function( err, res ) {
        if( err ) throw err;
        if( ! res.body.aps ) res.body = JSON.parse( res.text );
        var u = res.body.uds;
        u.user_id.should.equal('hillary');
        ud_id = u.id;
        done();
      } );
  } );

  it('should update ud', function( done ) {
    request(config.base)
      .put('/uds/' + ud_id)
      .type('application/vnd.api+json')
      .auth('buddah', 'password')
      .send( JSON.stringify( { uds: {
        id: ud_id,
        last_ap_id: id
        } } ) )
      .expect( 200, done );
  } );

  it('should allow guests to get their own uds', function( done ) {
    request(config.base)
      .get('/uds')
      .auth('hillary', 'password')
      .expect( 200 )
      .end( function( err, res ) {
        if( err ) throw err;
        if( ! res.body.aps ) res.body = JSON.parse( res.text );
        var u = res.body.uds;
        u[0].user_id.should.equal( 'hillary' );
        done();
      } );
  } );

  it('should deny getting uds of others for non-admins', function( done ) {
    request(config.base)
      .get('/uds/' + ud_id)
      .auth('frank', 'password')
      .expect( 401, done );
  } );

  it('should allow user to delete their uds', function( done ) {
    request(config.base)
      .delete('/uds/' + ud_id)
      .auth('hillary', 'password')
      .expect( 204, done );
  } );

} );
