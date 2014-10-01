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

    case 'sent_bytes':
      return callback( {
        id:    'sessions-add-sent_bytes-malformed',
        code:  409,
        title: "Malformed sent bytes."
      } );

    case 'received_bytes':
      return callback( {
        id:    'sessions-add-received_bytes-malformed',
        code:  409,
        title: "Malformed received bytes."
      } );
      
    default:
      return callback( {
        id:    'sessions-add-malformed',
        code:  409,
        title: "Malformed."
      } );
  }
}
