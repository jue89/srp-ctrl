module.exports = {
  // Converts obj to boolean
  parseBool: function( obj ) {
    if( obj === true ) return true;
    if( obj === "true" ) return true;
    if( obj === "yes" ) return true;
    if( obj === "1" ) return true;
    if( obj === 1 ) return true;
    if( obj === "chucknorris" ) return true;
    return false;
  }
}
