  ////////////////////////
 // REQUIREMENTS       //
////////////////////////

var helper = require( '../lib/helper.js' );


module.exports = function( api ) {

  [ {
    path: 'aaas',
    tpl: require( '../template/aaaConfig.js'),
    roles: ['vno']
  }, {
    path: 'aps',
    tpl: require( '../template/apConfig.js'),
    roles: ['operator']
  } ].forEach( function( endpoint ){
    api.get( '/' + endpoint.path + '/:id/config', function( req, res ) {
      req.requireAuth( endpoint.roles, ['confirmed','enabled'], function() {
        endpoint.tpl( req.params.id, function( err, config ) {

          // Catch errors
          if( err ) return res.status(err.code).endJSON( { errors: err } );

          // Calcutlate ETAG
          var etag = helper.objectToEtag( config );

          // Set header
          res.setHeader( 'ETag', etag );

          // Check if etag matches --> Report 304
          if( req.headers['if-none-match'] == etag ) {
            return res.status( 304 ).end();
          }

          // When no match --> send result
          res.endJSON( { config: config } );

        } );
      } );
    } );
  } );

}
