// Helper module for examining returned error
module.exports = function( err, callback ) {
  var p = err.property;
  var m = err.message;

  switch( p ) {
    case '':
      return callback( {
        id:    'aps-add-unallowed-property',
        code:  409,
        title: "Unallowd property provided."
      } );


    case 'user_id':
      if( m == "is missing and it is required" ) return callback( {
        id:    'aps-add-user_id-missing',
        code:  409,
        title: "No user ID given."
      } );
      return callback( {
        id:    'aps-add-user_id-malformed',
        code:  409,
        title: "Malformed user ID."
      } );

    case 'public_key':
      if( m == "is missing and it is required" ) return callback( {
        id:    'aps-add-public_key-missing',
        code:  409,
        title: "No public key given."
      } );
      return callback( {
        id:    'aps-add-public_key-malformed',
        code:  409,
        title: "Malformed public key."
      } );

    default:
      return callback( {
        id:    'aps-add-malformed',
        code:  409,
        title: "Malformed."
      } );
  }
}
