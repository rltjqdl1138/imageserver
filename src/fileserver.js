import axios from 'axios'
import {app} from './config'
const sizeOf = require('image-size')
const sharp = require('sharp')

const router = require('express').Router()
const multiparty = require('multiparty')
const bodyParser = require('body-parser')
const fs = require('fs');

const DIR_RAW = __dirname+'/../resource/raw/'
const DIR_THUMB = __dirname+'/../resource/thumbnail/'
const DIR_320 = __dirname+'/../resource/image/320/'
const DIR_480 = __dirname+'/../resource/image/480/'
const DIR_640 = __dirname+'/../resource/image/640/'
const DIR_720 = __dirname+'/../resource/image/720/'
const DIR_1080 = __dirname+'/../resource/image/1080/'

const LOCAL_SERVER = 'http://localhost:3900'
const DEV_SERVER = 'https://dev.earthyguna.com'
const SERVER = 'https://earthyguna.com'

console.log(`\n\nMain Server:\t${LOCAL_SERVER}\n\n`)
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

router.get('/html/dev', (req,res)=>{
    const body = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" '+
    'content="text/html; charset=UTF-8" />'+
    '</head>'+
    '<body>'+
    '<form action="/image/dev" enctype="multipart/form-data" '+
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
router.get('/html/test', (req,res)=>{
    const body = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" '+
    'content="text/html; charset=UTF-8" />'+
    '</head>'+
    '<body>'+
    '<form action="/image/test" enctype="multipart/form-data" '+
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
    const parsedUrl = req.url.split('/')
    let path
    switch(parsedUrl[1]){
        case 'thumb':
        case 'thumbnail':
            path = `${DIR_THUMB}${parsedUrl[2]}`; break;
        case 'raw':
            path = `${DIR_RAW}${parsedUrl[2]}`; break;
        case '320':
            path = `${DIR_320}${parsedUrl[2]}`; break;
        case '480':
            path = `${DIR_480}${parsedUrl[2]}`; break;
        case '640':
            path = `${DIR_640}${parsedUrl[2]}`; break;
        case '720':
            path = `${DIR_720}${parsedUrl[2]}`; break;
        case '1080':
            path = `${DIR_1080}${parsedUrl[2]}`; break;
        default:
            path = parsedUrl[2] ? `${DIR_720}${parsedUrl[2]}` : `${DIR_720}${parsedUrl[1]}`
    }
    const stream = fs.createReadStream(path)
        .on('open', ()=>{
            res.writeHead(200, {"Content-Type": "image"})
            stream.pipe(res)
        })
        .on('error',()=> res.status(404).end())
})
router.post('/*', (req,res)=>{
    const parsedUrl = (req.url.split('/'))[1]
    const form = new multiparty.Form();
    form.on('error', err => res.status(500).end() )
    form.on('part', part => {
        if (!part.filename)
            return res.status(400).end()
        const extend = part.filename.split('.')
        const filename =  String(Math.floor(Math.random()*100000)) + String(Number(new Date())) + '.' +extend[extend.length-1];
        console.log(`[Upload filename]: ${filename}`)
        const dirname = DIR_RAW + filename
        const writeStream = fs.createWriteStream(dirname);
        writeStream.filename = filename;
        part.pipe(writeStream);
        part.on('end',()=>{
            writeStream.end();
            resizeImage(filename)
                .then(()=>sendToJigugong(filename, parsedUrl))
                .then((data)=>res.status(200).json(data))
                .catch((e)=>{console.log(e); res.status(500).end()})
        });
    });
    form.parse(req)
})
const sendToJigugong = async (filename, server_type)=>{
    let server_url
    switch(server_type){
        case '':
            server_url = SERVER; break;
        case 'dev':
            server_url = DEV_SERVER; break;
        case 'test':
            server_url = LOCAL_SERVER; break;
        default:
            throw new Error('not supported')
    }
    console.log(server_url)
    const {data:response} = await axios.post(`${server_url}/v1/image`,{filename},
    {
        headers:{
            'Content-Type': 'application/json',
            'Authorization': token
        }
    })
    return response
}
const resizeImage = async(filename)=>{
    const LAND = 0
    const PORT = 1
    const RATIOS = [2, 3, 4, 6, 6.75]
    const {width, height} = sizeOf(DIR_RAW + filename)
    // 더 작은 쪽을 기준으로 resize
    const type = width > height ? LAND : PORT
    const pivot_width = type === LAND ? Math.floor(160*width/height) : 160
    const pivot_height = type === LAND ? 160 : Math.floor(160*height/width)
    const width_list = RATIOS.map(e=>Math.floor(pivot_width*e))
    const height_list = RATIOS.map(e=>Math.floor(pivot_height*e))

    await sharp(DIR_RAW + filename).resize(320,320).toFile(DIR_THUMB+filename)
    console.log('thumb')
    await sharp(DIR_RAW + filename).resize(width_list[0],height_list[0] ).toFile(DIR_320 +filename)
    console.log('320')
    await sharp(DIR_RAW + filename).resize(width_list[1],height_list[1] ).toFile(DIR_480 +filename)
    console.log('480')
    await sharp(DIR_RAW + filename).resize(width_list[2],height_list[2] ).toFile(DIR_640 +filename)
    console.log('640')
    await sharp(DIR_RAW + filename).resize(width_list[3],height_list[3] ).toFile(DIR_720 +filename)
    console.log('720')
    await sharp(DIR_RAW + filename).resize(width_list[4],height_list[4] ).toFile(DIR_1080+filename)
    console.log('1080')
}

module.exports = router