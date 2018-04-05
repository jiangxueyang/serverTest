const router = require('koa-router')();
const Utils = require('../utils');
const Tips = require('../utils/tip');
const db = require('../db');

//创建一个笔记本
router.post('/oa/user/addNote',async (ctx,next)=>{
    let data = Utils.filter(ctx.request.body, ['name']);
    let {name} = data, {uid} = ctx.state  || {};
    let res = Utils.formatData(data, [
        {key: 'name', type: 'string'}
    ]);
    if (! res) return ctx.body = Tips[1007];
    let create_time = Utils.formatCurrentTime();
    let sql = `INSERT INTO t_note(name,uid,create_time) VALUES(?,?,?)`,
        value = [name, uid, create_time];
    await db.query(sql, value).then(res => {
        let {insertId: id} = res;
        if (id) {
            ctx.body = {
                ...Tips[0],
                data: {
                    id
                }
            }
        } else {
            ctx.body = Tips[1002]
        }
    }).catch(e => {
        if(+e.errno === 1062){//笔记本不能重复
            ctx.body = {
                code: 1010,
                msg: '笔记本已存在！'
            };
        }else{
            ctx.body = Tips[1002]
        }
    })
});

//修改笔记本名称
router.post('/oa/user/modifyNote', async (ctx, next) => {
    let data = Utils.filter(ctx.request.body, ['name', 'id']), {uid} = ctx.state  || {};
    let res = Utils.formatData(data, [
        {key: 'name', type: 'string'},
        {key: 'id', type: 'number'}
    ]);
    if (! res) return ctx.body = Tips[1007];
    let {name, id} = data;
    let sql = `UPDATE t_note set name=? WHERE id=? AND uid=?`, value = [name, id, uid];
    await db.query(sql, value).then(res => {
        ctx.body = Tips[0];
    }).catch(e => {
        ctx.body = Tips[1002];
    })
    
});


//删除笔记本
router.post('/oa/user/removeNote', async (ctx, next) => {
    let data = Utils.filter(ctx.request.body, ['id']), {uid} = ctx.state  || {};
    let res = Utils.formatData(data, [
        {key: 'id', type: 'number'}
    ]);
    if (! res) return ctx.body = Tips[1007];
    let {id} = data;
    let sql = `UPDATE t_note set is_delete=1 WHERE id=${id} AND uid=${uid};`,
        sql1 = `UPDATE t_blog set is_delete=1 WHERE note_id=${id}  AND uid=${uid}`
    await db.query(`${sql}${sql1}`).then(res => {
        ctx.body = Tips[0];
    }).catch(e => {
        ctx.body = Tips[1002]
    })
    
});

//查询笔记本详情
router.get('/oa/user/noteDetail/:id', async (ctx, next) => {
    let data = Utils.filter(ctx.params, ['id']);
    let res = Utils.formatData(data, [
        {key: 'id', type: 'number'}
    ]);
    if (! res) return ctx.body = Tips[1007];
    let {id} = data;
    await db.query('SELECT name FROM t_note WHERE id=? AND is_delete=0', [id]).then(res => {
        if (res.length > 0) {
            ctx.body = {
                ...Tips[0],
                data: res[0]
            };
        } else {
            ctx.body = Tips[1003];
        }
    }).catch(() => {
        ctx.body = Tips[1002];
    })
})

//查询我的笔记本列表 type:0 所有 1分页查询

router.get('/oa/user/myNote', async (ctx, next) => {
    let data = Utils.filter(ctx.request.query, ['pageSize', 'pageNum', 'type']), {uid} = ctx.state  || {};
    let res = Utils.formatData(data, [
        {key: 'type', type: 'number'},
    ]);
    if (! res) return ctx.body = Tips[1007];
    let {pageSize = 15, pageNum = 1, type = 0} = data;
    pageSize = Number(pageSize);
    pageNum = Number(pageNum);
    let offset = (pageNum - 1) * pageSize;
    let sql1 = `SELECT count(1) FROM  t_note WHERE uid=${uid} AND is_delete=0;`,
        sql= `SELECT name,id,create_time,update_time  FROM  t_note WHERE uid=${uid} AND is_delete=0 ORDER BY create_time DESC`;
    if(+type === 1){
        sql += ` limit ${offset},${pageSize};`
    }
    
    await db.query(sql1+sql).then(async result => {
        let res1 = result[0],res2 = result[1],total = 0,list = []
        if(res1 && res1.length >0 && res2 && res2.length >0){
            total = res1[0]['count(1)']
            list = res2
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