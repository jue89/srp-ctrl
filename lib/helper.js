var crypto = require('crypto')

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
  },
  // Converts and objectID to IPv6 Interface Identifier
  objectIDtoIPv6: function( id ) {
    // MD5-hash ojectID
    var md5 = crypto.createHash('md5');
    md5.update( id );

    // First 8 byte becomes IPv6 Interface Identifier
    var ipv6_id = md5.digest().slice(0,8).toString('hex');

    // Add colons and return
    return ipv6_id.substr(0,4)
      + ":" + ipv6_id.substr(4,4)
      + ":" + ipv6_id.substr(8,4)
      + ":" + ipv6_id.substr(12,4);
  }
}
