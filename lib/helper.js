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
  },

  // Helps at pagination
  paginator: function( url, page, limit, count ) {
    // Ensure to be int
    page = parseInt( page );
    limit = parseInt( limit );
    count = parseInt( count );

    if( limit == 0 ) return {
      self: url + page,
      prev: null,
      next: null,
      first: url + "0",
      last: url + "0"
    }
    else return {
      self: url + page,
      prev: ( page > 0 ) ? url + (page - 1) : null,
      next: ( (page+1) * limit < count ) ? url + (page+1) : null,
      first: url + "0",
      last: url + ( ( count > 0 ) ? Math.ceil( count / limit ) - 1  : 0 )
    }
  },

  // Creates Etag from obj
  objectToEtag: function( obj ) {
    var md5 = crypto.createHash('md5');
    md5.update( JSON.stringify( obj ) );
    return md5.digest().toString('hex');
  }

}
