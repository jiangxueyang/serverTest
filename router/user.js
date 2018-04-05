const router = require('koa-router')();
const Utils = require('../utils');
const Tips = require('../utils/tip');
const md5 = require('md5');
const db = require('../db');

//登录
router.post('/oa/login', async (ctx, next) => {
    let data = Utils.filter(ctx.request.body, ['name', 'password']);
    let res = Utils.formatData(data, [
        {key: 'name', type: 'string'},
        {key: 'password', type: 'string'}
    ]);
    if (! res) return ctx.body = Tips[1007];
    let {name, password} = data;
    let sql = 'SELECT uid FROM t_user WHERE name=? and password=? and is_delete=0', value = [name, md5(password)];
    await db.query(sql, value).then(res => {
        if (res && res.length > 0) {
            let val = res[0];
            let uid = val['uid'];
            let token = Utils.generateToken({uid});
            ctx.body = {
                ...Tips[0], data: {token}
            }
        } else {
            ctx.body = Tips[1006];
        }
    }).catch(e => {
        ctx.body = Tips[1002];
    });
    
});

//查询登录信息
router.get('/oa/user/auth', async (ctx, next) => {
    let {uid} = ctx.state  || {};
    let sql = 'SELECT name,uid,nick_name FROM t_user WHERE uid=? AND is_delete=0', value = [uid];
    await db.query(sql, value).then(res => {
        if (res && res.length > 0) {
            ctx.body = {...Tips[0], data: res[0]};
        } else {
            ctx.body = Tips[1005];
        }
    }).catch(e => {
        ctx.body = Tips[1005];
    })
});
//退出登录
router.post('/oa/quit', async (ctx, next) => {
    ctx.state = null;
    ctx.body = Tips['0']
    
});
module.exports = router;