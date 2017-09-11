'use strict';

var Hapi = require('hapi');

// Create a server with a host and port
var server = new Hapi.Server();

// Setup the server with a host and port
server.connection({
    port: parseInt(process.argv[2], 10) || 17001,
    host: '0.0.0.0'
});

// Setup the views engine and folder
server.register(require('vision'), (err) => {

    if (err) {
        throw err;
    }

    var swig = require('swig');
    swig.setDefaults({ cache: false });

    server.views({
        engines: {
            html: swig
        },
        isCached: false,
        relativeTo: __dirname,
        path: './templates'
    });
});

server.state('cookie', {
    ttl: null,
    isSecure: false,
    isHttpOnly: true,
    encoding: 'base64json',
    clearInvalid: false, // remove invalid cookies
    strictHeader: true // don't allow violations of RFC 6265
});

// Export the server to be required elsewhere.
module.exports = server;

// db setting
var db_options = {
    connectionLimit: 10,
    host: '127.0.0.1',
    port: 3306,
    user: 'uuinfo',
    password: '123321',
    database: 'ioio_youli',
    charset: 'utf8_general_ci'
};

/*
    Load all plugins and then start the server.
    First: community/npm plugins are loaded
    Second: project specific plugins are loaded
 */
server.register([{
        register: require("good"),
        options: {
            ops: false,
            reporters: {
                myConsoleReporter: [{
                    module: 'good-console'
                }, 'stdout']
            }
        }
    }, {
        register: require('./server/utils/cache.js')
    }, {
        register: require('./server/db/db_mysql.js'),
        options: db_options
    }, {
        register: require('./server/models/models.js')
    }, {
        register: require('./server/services/services.js')
    }, {
        register: require('./server/utils/g.js'),
        options: require('./view_globals.js')
    }, {
        register: require('./server/api/wx_controller.js')
    }
], function() {
    //Start the server
    server.start(function() {
        //Log to the console the host and port info
        console.log('Server started at: ' + server.info.uri);
    });
});
