var config = require( '../lib/config.js' );
var aaasModel = require( '../model/aaas.js' );


module.exports = function( id, done ) {

  // Build request
  var q = { fields: ['ipv6_id','fqdn'] }

  // And go ...
  aaasModel.get( id, q, function( err, aaa ) {
    if( err ) return done( err );

    done( null, {
      "ipv6_net": config.aaaNet + ":",
      "ipv6_addr": config.aaaNet + aaa.ipv6_id,
      "mqtt": config.mqtt
    } );
  } );

}
