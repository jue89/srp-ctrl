var os = require( 'os' );
var config = require( './lib/config.js' );
var mqtt = require( './lib/mqtt.js' );

setInterval( function() {
	mqtt.publish( 'heartbeat', JSON.stringify( {
		host: config.fqdn,
		load: os.loadavg()
	} ) );
}, 5000 );
