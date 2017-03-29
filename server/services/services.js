exports.register = function(server, options, next){

    var load_module = function(key, path) {
        var module = require(path)(server);
        if (typeof module.init === 'function') { module.init(); }
        if (typeof module.refresh === 'function') { module.refresh(); }
        server.expose(key, module);
    };

    load_module('youli', './youli.js');
    load_module('amap', './amap.js');
  
    next();
}

exports.register.attributes = {
    name: 'services'
};