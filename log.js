var config = require( './lib/config.js' );
var mqtt = require( './lib/mqtt.js' );

function listen( model, event, type, message ) {
	model.on( event, function( ) {
		mqtt.publish( 'log', JSON.stringify( {
			host: config.fqdn,
			type: type,
			msg: message( arguments )
		} ) );
	} );
}

function install( model, name ) {
	listen( model, 'get', 0, function( arg ) {
		return name + " GET " + arg[0].id;
	} );
	listen( model, 'find', 0, function( arg ) {
		return name + " FETCHED " + arg[0].length + " objects";
	} );
	listen( model, 'add', 1, function( arg ) {
		return name + " CREATED " + arg[0].id + " (" + arg[0].email + ")";
	} );
	listen( model, 'update', 1, function( arg ) {
		return name + " UPDATED " + arg[1].id;
	} );
	listen( model, 'remove', 2, function( arg ) {
		return name + " REMOVED " + arg[0];
	} );
}
	
install( require( './model/users.js' ), "USER" );
install( require( './model/aps.js' ), "AP" );
install( require( './model/uds.js' ), "UD" );
install( require( './model/aaas.js' ), "AAA" );
install( require( './model/sessions.js' ), "SESSION" );
