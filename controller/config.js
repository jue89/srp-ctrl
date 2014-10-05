  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

var url = require( 'url' );
var helper = require( '../lib/helper.js' );
var aaasModel = require( '../model/aaas.js' );
var config = require( '../lib/config.js' );
var aaaTemplate = require( '../template/aaaConfig.js')


module.exports = function( api ) {

  api.get( '/aaas/:id/config', function( req, res ) {
    req.requireAuth( ['admin'], ['confirmed','enabled'], function() {

      // Build request
      var q = { fields: ['ipv6_id','fqdn'] }

      // And go ...
      aaasModel.get( req.params.id, q, function( err, aaa ) {
        // Catch errors
        if( err ) return res.status(err.code).endJSON( { errors: err } );

        res.endJSON( { config: aaaTemplate( aaa ) } );
      } );
    } );
  } );

}
