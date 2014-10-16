var async = require( 'async' );
var config = require( '../lib/config.js' );
var aaasModel = require( '../model/aaas.js' );
var apsModel = require( '../model/aps.js' );


module.exports = function( id, done ) {

  var ret = {
    ssid: config.ssid
  };

  async.waterfall( [
    function( done ) {
      var q = { fields: ['ipv6_id','aaa_secret'] };
      apsModel.get( id, q, function( err, ap ) {
        if( err ) return done( err );

        ret.ipv6_addr = config.aaaNet + ap.ipv6_id;
        ret.aaa_secret = ap.aaa_secret;

        done();
      } );
    },
    function( done ) {
      var q = { fields: ['ipv6_id','public_key','fqdn'], limit: 1 };
      aaasModel.find( q, function( err, aaa ) {
        if( err ) return done( err );

        ret.aaa_fqdn = aaa.data[0].fqdn;
        ret.aaa_ipv6 = config.aaaNet + aaa.data[0].ipv6_id;
        ret.aaa_public_key = aaa.data[0].public_key;

        done();
      } );
    }
  ], function( err ){
    if( err ) return done( err );

    done( null, ret );
  } );

}
