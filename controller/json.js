module.exports = function( express ) {
  // Helper function to set correct type
  express.response.endJSON = function( obj ) {
    var pretty = (this.req.query.pretty != null) ? '  ' : null;

    if( ! pretty ) this.type('application/vnd.api+json');

    this.end( JSON.stringify( obj, null, pretty ) );
  }
}
