
import express from 'express';
import cors from 'cors';
const fileserver = require('./fileserver')

const appRun = async () => {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '500mb' }));
    app.use(express.urlencoded({ limit: '500mb', extended: false }));
    
    app.use(function (req, res, next) {
      res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, HEAD, OPTIONS');
      res.header('Access-Control-Allow-Origin', '*');
      next();
    });
  
    app.use('/image', fileserver)
    app.use('/', (req, res) => {
      res.type('text/plain');
      res.status(200);
      res.send('jigugong-image-serv');
    });
  
    //커스텀 404 페이지
    app.use((req, res) => {
      let url = req.protocol + '://' + req.get('host') + req.originalUrl;
      res.type('text/plain');
      res.status(404);
      res.send('404 - Not Found');
    });
  
    //커스텀 500 페이지
    app.use((err, req, res, next) => {
      console.log(err.stack);
      res.type('text/plain');
      res.status(500);
      res.send('500 - Server Error');
    });
  
    return { app };
};
export default appRun