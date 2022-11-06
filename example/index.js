const vncServer =require('../index')
const  WebSocketServer = require('ws').Server;
let vncConfig={
    port:9000,
    vncAddress:'127.0.0.1:5900',
}
 let vnc_server=  new vncServer(vncConfig.port,vncConfig.vncAddress);
 let webServer= vnc_server.createVncServer();
 webServer.listen(vncConfig.port, ()=> {
  let   wsServer = new WebSocketServer({server: webServer});
    wsServer.on('connection', vnc_server.newClient);
});
