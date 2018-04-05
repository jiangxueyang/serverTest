const router = require('koa-router')();
const Utils = require('../utils');
const Tips = require('../utils/tip');
const db = require('../db/index');
const fs = require('fs');
const path = require('path');
const asyncBusboy = require('async-busboy');
// 上传图片
router.post('/oa/user/upFiles', async (ctx, next) => {
    try {
        let data = await asyncBusboy(ctx.req), {uid} = ctx.state  || {};
        let { files = [] } = data;
        if(files.length === 0) return ctx.body = Tips[1002];
        let file = files[0];
        let { mimeType = '', filename, path: filepath } = file;
        if(mimeType.indexOf('image') === -1) return ctx.body = Tips[1002];
        let name = Date.now() + '.' + filename.split('.').pop();
        let savePath = path.join(__dirname, `../../img/${name}`);
        try {
            let create_time = Utils.formatCurrentTime();
            let sql = 'INSERT INTO t_user_img(name,uid,create_time) VALUES (?,?,?)', value = [name, uid, create_time];
            await db.query(sql, value).then(res => {
                let img = fs.readFileSync(filepath);
                fs.writeFileSync(savePath, img);
                fs.unlinkSync(filepath);//清除缓存文件
                ctx.body = {
                    ...Tips[0], data: { name }
                };
            }).catch(() => {
                ctx.body = Tips[1002];
            })
            
        } catch (e) {
            ctx.body = Tips[1005];
        }
    } catch (e) {
        ctx.body = Tips[1002];
    }
});

//删除图片
router.post('/oa/user/removeImg', async (ctx, next) => {
    let data = Utils.filter(ctx.request.body, ['name']),{uid} = ctx.state  || {};
    let res = Utils.formatData(data, [
        { key: 'name', type: 'string' }
    ]);
    if (!res) return ctx.body = Tips[1007];
    let { name } = data;
    let sql = 'UPDATE t_user_img set is_delete=1 WHERE name=? AND uid=?;', value = [name, uid];
    await db.query(sql, value).then(res => {
        fs.unlinkSync(path.join(__dirname, `../../img/${name}`));//清除缓存文件
        ctx.body = Tips[0];
    }).catch(() => {
        ctx.body = Tips[1002];
    })
    
});
//分页查询 图片
router.get('/oa/user/myImg', async (ctx, next) => {
    let data = Utils.filter(ctx.request.query, ['pageSize', 'pageNum']), uid = ctx.session.uid;
    let { pageNum = 1, pageSize = 10 } = data;
    pageNum = Number(pageNum);
    pageSize = Number(pageSize);
    let offset = (pageNum - 1) * pageSize;
    let sql = `SELECT name,create_time,id FROM t_user_img  WHERE uid=${uid} AND is_delete=0 ORDER BY create_time DESC limit ${offset},${pageSize};`,
        sql1 = `SELECT count(1) FROM  t_user_img WHERE uid=${uid} AND is_delete=0;`;
    await db.query(sql1+sql).then(async result => {
        let res1 = result[0],res2 = result[1],total = 0,list =[];
        if(res1 && res1.length >0 && res2 && res2.length >0){
            total = res1[0]['count(1)'];
            list = res2;
        }
        ctx.body = {
            ...Tips[0],
            data: {
                list,
                pageSize,
                total
            }
        };
    }).catch(e => {
        ctx.body = Tips[1002];
    })
});


module.exports = router;