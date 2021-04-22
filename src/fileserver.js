import axios from 'axios'
import {app} from './config'


const router = require('express').Router()
const multiparty = require('multiparty')
const bodyParser = require('body-parser')
const fs = require('fs');
const __resource = __dirname+'/../resource/image/'

let IMAGE_DB_SERVER = 'http://localhost:3900'
if(app === 'development')
    IMAGE_DB_SERVER = 'https://dev.earthyguna.com'
else if(app === 'production')
    IMAGE_DB_SERVER = 'https://earthyguna.com'

console.log(`\n\nMain Server:\t${IMAGE_DB_SERVER}\n\n`)
const {token} = require('../resource/json/token.json')

router.use(bodyParser.urlencoded({extended: false}))
router.use(bodyParser.json())
router.get('/html', (req,res)=>{
    const body = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" '+
    'content="text/html; charset=UTF-8" />'+
    '</head>'+
    '<body>'+
    '<form action="/image" enctype="multipart/form-data" '+
    'method="post">'+
    '<input type="file" name="file" multiple="multiple">'+
    '<input type="submit" value="Upload file" />'+
    '</form>'+
    '</body>'+
    '</html>'

    res.writeHead(200, {"Content-Type": "text/html"});
    res.write(body);
    res.end();
})
router.get('/*', (req,res)=>{
    const url = req.url.slice(1)
    const stream = fs.createReadStream(__resource + url)
        .on('open', ()=>{
            res.writeHead(200, {"Content-Type": "image"})
            stream.pipe(res)
        })
        .on('error',()=> res.status(404).end())
})
router.post('/', (req,res)=>{
    const form = new multiparty.Form();
    form.on('error', err => res.status(500).end() )
    form.on('part', part => {
        if (!part.filename)
            return res.status(400).end()
        const extend = part.filename.split('.')
        const filename =  String(Math.floor(Math.random()*100000)) + String(Number(new Date())) + '.' +extend[extend.length-1];
        console.log(`[Upload filename]: ${filename}`)
        const dirname = __resource + filename
        const writeStream = fs.createWriteStream(dirname);
        writeStream.filename = filename;
        part.pipe(writeStream);
        part.on('end',()=>{
            writeStream.end();
            sendToJigugong(filename)
                .then((data)=>res.status(200).json(data))
                .catch(()=>res.status(500).end())
        });
    });
    form.parse(req)
})
const sendToJigugong = async (filename)=>{
    const {data:response} = await axios.post(`${IMAGE_DB_SERVER}/v1/image`,{filename},
    {
        headers:{
            'Content-Type': 'application/json',
            'Authorization': token
        }
    })
    return response
}
module.exports = router