// Requirements
var async = require( 'async' );
var should = require( 'should' );
var request = require( 'supertest' );
var users = require( '../model/users.js' );
var aps = require( '../model/aps.js' );
var api = require( '../api.js' );

// Configuration
var config = require( '../lib/config.js');


describe('API - AAAs', function() {
  var id;
  before( function( done ) {
    // Create some users
    async.series( [
      function( done ) { users.add( {
        id: 'john',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: true, operator: false, guest: false }
      }, done ); },
      function( done ) { users.add( {
        id: 'jack',
        password: 'password',
        email: 'test@example.com',
        enabled: true,
        confirmed: true,
        roles: { vno: false, operator: false, guest: true }
      }, done ); }
    ], done );
  } );

  it('should deny creating aaas for non-vnos', function( done ) {
    request(config.base)
      .post('/aaas')
      .type('application/vnd.api+json')
      .auth('john', 'password')
      .send( JSON.stringify( { aaas: {
        fqdn: 'aaa.example.com',
        user_id: 'jack',
        public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
        } } ) )
      .expect( 404, done );
  } );

  var id;
  it('should create aaa', function( done ) {
    request(config.base)
      .post('/aaas')
      .type('application/vnd.api+json')
      .auth('john', 'password')
      .send( JSON.stringify( { aaas: {
        fqdn: 'aaa.example.com',
        user_id: 'john',
        public_key: '78dfb05fe0aa586fb017de566b0d21398ac64032fcf1c765855f4d538cc5a357'
        } } ) )
      .expect( 201 )
      .end( function( err, res ) {
        if( err ) throw err;
        if( ! res.body.aaas ) res.body = JSON.parse( res.text );
        var a = res.body.aaas;
        a.user_id.should.equal('john');
        id = a.id;
        done();
      } );
  } );

  it('should delete aaa', function( done ) {
    request(config.base)
      .delete('/aaas/' + id)
      .auth('john', 'password')
      .expect( 204, done );
  } );

} );
