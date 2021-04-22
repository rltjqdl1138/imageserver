require('@babel/polyfill');
const appRun = require('./app').default;
const http = require('http');

appRun().then(({ app }) => {
    const server = http.createServer(app);
    const port = process.env.PORT || 5000;
  
    server.listen(port, () => {
      console.log(`Server is running on ${port} port`);
    });
});