var config = require( './config.js' );
var mqtt = require( 'mqtt' ).createClient( config.mqtt.port, config.mqtt.host );

module.exports = mqtt;
