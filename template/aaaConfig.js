var config = require( '../lib/config.js' );

module.exports = function( aaa ) {
  return {
    "ipv6_net": config.aaaNet,
    "ipv6_addr": config.aaaNet + aaa.ipv6_id,
    "mqtt": config.mqtt
  }
}
