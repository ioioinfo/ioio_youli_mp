var view_globals = function(server,request) {
    return {
        domain:'http://youli.hankang365.com',
        p_name:'微信API',
        host: 'http://youli.hankang365.com/',
        image_host: 'http://youli.hankang365.com',
        api_host: 'http://211.149.248.241:8000/images/youli/',
        appkey: function() { return server.plugins.cache.myCache.get("wx_appkey");},
        appsecret: function() { return server.plugins.cache.myCache.get("wx_appsecret");},
    };
};

module.exports = view_globals;
