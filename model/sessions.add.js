// Helper module for examining returned error
module.exports = function( err, callback ) {
  var p = err.property;
  var m = err.message;

  switch( p ) {
    case '':
      return callback( {
        id:    'sessions-add-unallowed-property',
        code:  409,
        title: "Unallowd property provided."
      } );

    case 'id':
      return callback( {
        id:    'sessions-add-id-missing',
        code:  409,
        title: "No ID given."
      } );

    case 'ap_id':
      if( m == "is missing and it is required" ) return callback( {
        id:    'sessions-add-ap_id-missing',
        code:  409,
        title: "No AP ID given."
      } );
      return callback( {
        id:    'sessions-add-ap_id-malformed',
        code:  409,
        title: "Malformed AP ID."
      } );

    case 'ud_id':
      if( m == "is missing and it is required" ) return callback( {
        id:    'sessions-add-ud_id-missing',
        code:  409,
        title: "No UD ID given."
      } );
      return callback( {
        id:    'sessions-add-ud_id-malformed',
        code:  409,
        title: "Malformed UD ID."
      } );

    default:
      return callback( {
        id:    'sessions-add-malformed',
        code:  409,
        title: "Malformed."
      } );
  }
}
