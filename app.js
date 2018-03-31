const http = require('http');
const koa = require('koa');
const etag = require('koa-etag');
const session = require('koa-session');
const bodyParser = require('koa-bodyparser');
const errorHandler = require('koa-error');
const compress = require('koa-compress');
const PORT = process.env.PORT || 8080;
const koaBody = require('koa-body');
const app = new koa();
const Utils = require('./utils');
const router = require('./router');
app.keys = ['session@&'];

app.use(session({
    key: 'abc::sess',
    maxAge: 86400000,
    overwrite: true,
    httpOnly: true,
    signed: true,
    rolling: false
}, app));
app.use(koaBody());
app.use(async(ctx, next) => {
    let {url = ''} = ctx;
    if(url.indexOf('/oa/user/') >-1){//需要校验登录态
        let check = Utils.checkLogin(ctx);
        if(check.code != 0) return ctx.body = check;
    }
    await next();
    
});
app.use(errorHandler());
app.use(bodyParser());

app.use(etag());

// compressor
app.use(compress({
    filter: contentType => /text|javascript/i.test(contentType),
    threshold: 2048
}));
router(app);
http.createServer(app.callback()).listen(PORT);
log('server is running on port: %s', PORT);