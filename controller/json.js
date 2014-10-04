module.exports = function( api ) {

  api.use( function( req, res, next ) {

    // Helper function to set correct type
    res.endJSON = function( obj ) {
      var pretty = (this.req.query.pretty != null) ? '  ' : null;

      if( ! pretty ) this.type('application/vnd.api+json');

      this.end( JSON.stringify( obj, null, pretty ) );
    }

    next();

  } );

}
