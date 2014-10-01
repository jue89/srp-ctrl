// Helper module for examining returned error
module.exports = function( err, callback ) {
  var p = err.property;
  var m = err.message;

  switch( p ) {
    case '':
      return callback( {
        id:    'uds-add-unallowed-property',
        code:  409,
        title: "Unallowd property provided."
      } );


    case 'user_id':
      if( m == "is missing and it is required" ) return callback( {
        id:    'uds-add-user_id-missing',
        code:  409,
        title: "No user ID given."
      } );
      return callback( {
        id:    'uds-add-user_id-malformed',
        code:  409,
        title: "Malformed user ID."
      } );

    case 'mac':
      if( m == "is missing and it is required" ) return callback( {
        id:    'uds-add-mac-missing',
        code:  409,
        title: "No MAC given."
      } );
      return callback( {
        id:    'uds-add-mac-malformed',
        code:  409,
        title: "Malformed MAC."
      } );

    case 'last_ap_id':
      if( m == "is missing and it is required" ) return callback( {
        id:    'uds-add-last_ap_id-missing',
        code:  409,
        title: "No AP ID given."
      } );
      return callback( {
        id:    'uds-add-last_ap_id-malformed',
        code:  409,
        title: "Malformed AP ID."
      } );

    default:
      return callback( {
        id:    'uds-add-malformed',
        code:  409,
        title: "Malformed."
      } );
  }
}
