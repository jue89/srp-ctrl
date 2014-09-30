// Helper module for examining returned error
module.exports = function( err, callback ) {
  var p = err.property;
  var m = err.message;

  switch( p ) {
    case '':
      return callback( {
        id:    'aps-update-unallowed-property',
        code:  409,
        title: "Unallowd property provided."
      } );


    case 'user_id':
      return callback( {
        id:    'aps-update-user_id-malformed',
        code:  409,
        title: "Malformed user ID."
      } );

    case 'public_key':

      return callback( {
        id:    'aps-update-public_key-malformed',
        code:  409,
        title: "Malformed public key."
      } );

    default:
      return callback( {
        id:    'aps-update-malformed',
        code:  409,
        title: "Malformed."
      } );
  }
}
