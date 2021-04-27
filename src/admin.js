


const router = require('express').Router()
const fs = require('fs');

const PATH = __dirname+'/../resource/thumbnail/'
const getImageList = ()=>new Promise((resolve, reject)=>{
    fs.readdir(PATH, (err, files)=>{
        if(err) reject(err)
        const list = files.reduce((prev, item)=>[...prev, item],[])
        resolve(list)
    })
})

router.get('/list', async (req,res)=>{
    const list = await getImageList()
    const result = list.map(e=>({
        file:       e,
        thumbnail:  `/image/thumb/${e}`
    }))
    return res.json({list:result});
})
module.exports = router