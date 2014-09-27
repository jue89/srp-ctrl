// Helper module for examining returned error
module.exports = function( err, callback ) {
  var p = err.property;
  var m = err.message;

  switch( p ) {
    case '':
      return callback( {
        id:    'users-add-unallowed-property',
        code:  409,
        title: "Unallowd property provided."
      } );

    case 'email':
      if( m == "is missing and it is required" ) return callback( {
        id:    'users-add-email-missing',
        code:  409,
        title: "No e-mail address given."
      } );
      return callback( {
        id:    'users-add-email-malformed',
        code:  409,
        title: "Malformed e-mail address."
      } );

    case 'password':
      if( m == "is missing and it is required" ) return callback( {
        id:    'users-add-password-missing',
        code:  409,
        title: "No password given."
      } );
      return callback( {
        id:    'users-add-password-malformed',
        code:  409,
        title: "Password must have at least 8 characters."
      } );

    case 'roles':
    case 'roles.admin':
    case 'roles.guest':
    case 'roles.operator':
      if( m == "is missing and it is required" ) return callback( {
        id:    'users-add-roles-missing',
        code:  409,
        title: "No roles given."
      } );
      return callback( {
        id:    'users-add-roles-malformed',
        code:  409,
        title: "Roles format is wrong."
      } );

    default:
      return callback( {
        id:    'users-add-malformed',
        code:  409,
        title: "Malformed."
      } );
  }
}
