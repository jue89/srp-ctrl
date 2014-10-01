// Requirements
var async = require( 'async' );
var should = require( 'should' );
var users = require( '../model/users.js' );
var aps = require( '../model/aps.js' );
var uds = require( '../model/uds.js' );
var sessions = require( '../model/sessions.js' );


describe( 'model/sessions.js', function() {
  var ud_id, ap_id;
  before( function( done ) {
    // Create some users and so on
    async.series( [
      function( done ) { users.add( {
        id: 'rolf',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { admin: false, operator: true, guest: false }
      }, done ); },
      function( done ) { aps.add( {
        user_id: 'rolf',
        public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
      }, function( err, res ) {
        ap_id = res.id;
        done();
      } ); },
      function( done ) { users.add( {
        id: 'barbara',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { admin: false, operator: false, guest: true }
      }, done ); },
      function( done ) { uds.add( {
        user_id: 'barbara',
        mac: '22:33:44:55:66:77',
        last_ap_id: ap_id
      }, function( err, res ) {
        ud_id = res.id;
        done();
      } ); }
    ], done );
  } );

  it( 'should create session', function(done) {
    sessions.add( {
      'id': 'abc',
      'ap_id': ap_id,
      'ud_id': ud_id
    }, done );
  } );

  it( 'should update session', function(done) {
    sessions.update( 'abc', {
      'sent_bytes': 1024,
      'received_bytes': 4096
    }, done );
  } );

  it( 'should end sessions', function(done) {
    sessions.update( 'abc', {
      'sent_bytes': 2024,
      'received_bytes': 8096,
      'ended': true
    }, done );
  } );

  it( 'should deny changes to ended sessions', function(done) {
    sessions.update( 'abc', {
      'sent_bytes': 2024,
      'received_bytes': 9096
    }, function( err, res ) {
      err.code.should.equal( 404 );
      done();
    } );
  } );

} );
