// Requirements
var async = require( 'async' );
var should = require( 'should' );
var request = require( 'supertest' );
var users = require( '../model/users.js' );
var aps = require( '../model/aps.js' );
var uds = require( '../model/uds.js' );
var api = require( '../api.js' );

// Configuration
var config = require( '../lib/config.js');


describe('API - Sessions', function() {
  var ap1_id, ap2_id, ud_id;
  before( function( done ) {
    // Create some users
    async.series( [
      function( done ) { users.add( {
        id: 'albert',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: true, operator: false, guest: false }
      }, done ); },
      function( done ) { users.add( {
        id: 'oliver',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: false, operator: true, guest: false }
      }, done ); },
      function( done ) { aps.add( {
        user_id: 'oliver',
        public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a358'
      }, function( err, res ) {
        if( err ) throw err;
        ap1_id = res.id;
        done();
      } ); },
      function( done ) { users.add( {
        id: 'oscar',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: false, operator: true, guest: false }
      }, done ); },
      function( done ) { aps.add( {
        user_id: 'oscar',
        public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a358'
      }, function( err, res ) {
        if( err ) throw err;
        ap2_id = res.id;
        done();
      } ); },
      function( done ) { users.add( {
        id: 'george',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: false, operator: false, guest: true }
      }, done ); },
      function( done ) { uds.add( {
        user_id: 'george',
        mac: '00:22:33:44:55:66',
        last_ap_id: ap1_id
      }, function( err, res ) {
        if( err ) throw err;
        ud_id = res.id;
        done();
      } ); },
    ], done );
  } );

  it('should deny creating sessions from guests', function( done ) {
    request(config.base)
      .post('/sessions')
      .type('application/vnd.api+json')
      .auth('george', 'password')
      .send( JSON.stringify( { sessions: {
        id: '1234567890',
        ap_id: ap1_id,
        ud_id: ud_id
        } } ) )
      .expect( 401, done )
  } );

  it('should deny creating sessions from operators', function( done ) {
    request(config.base)
      .post('/sessions')
      .type('application/vnd.api+json')
      .auth('oliver', 'password')
      .send( JSON.stringify( { sessions: {
        id: '1234567890',
        ap_id: ap1_id,
        ud_id: ud_id
        } } ) )
      .expect( 401, done )
  } );

  it('should create session identify ud by id', function( done ) {
    request(config.base)
      .post('/sessions')
      .type('application/vnd.api+json')
      .auth('albert', 'password')
      .send( JSON.stringify( { sessions: {
        id: '1234567890',
        ap_id: ap1_id,
        ud_id: ud_id
        } } ) )
      .expect( 201, done )
  } );

  it('should create session identify ud by mac and ud user', function( done ) {
    request(config.base)
      .post('/sessions')
      .type('application/vnd.api+json')
      .auth('albert', 'password')
      .send( JSON.stringify( { sessions: {
        id: '1234567891',
        ap_id: ap1_id,
        ud_mac: '00:22:33:44:55:66',
        ud_user_id: 'george'
        } } ) )
      .expect( 201, done )
  } );

  it('should update session', function( done ) {
    request(config.base)
      .put('/sessions/1234567891')
      .type('application/vnd.api+json')
      .auth('albert', 'password')
      .send( JSON.stringify( { sessions: {
        id: '1234567891',
        ended: true,
        sent_bytes: 1234,
        received_bytes: 56789
        } } ) )
      .expect( 200, done )
  } );

  it('should deny non-involed operators to see others sessions', function( done ) {
    request(config.base)
      .get('/sessions/1234567891')
      .auth('oscar', 'password')
      .expect( 401, done );
  } );

  it('should show session to involved operator', function( done ) {
    request(config.base)
      .get('/sessions/1234567891')
      .auth('oliver', 'password')
      .expect( 200, done );
  } );

  it('should show session to involved guest', function( done ) {
    request(config.base)
      .get('/sessions/1234567891')
      .auth('george', 'password')
      .expect( 200, done );
  } );

} );
