// websockify.js [--web web_dir] [--cert cert.pem [--key key.pem]] [--record dir] [source_addr:]source_port target_addr:target_port
//  node ./websockify-js/websockify/websockify.js --web ./noVNC 9000 127.0.0.1:5900
const net = require('net');
const  http = require('http');
const   https = require('https');
const   url = require('url');
const  path = require('path');
const  fs = require('fs');
const  mime = require('mime-types');
let webServer, source_host, source_port, target_host, target_port;

class  VncServer{
    constructor(sourceArg,targetArg) {
        this.sourceArg=sourceArg || '9000' ;// 9000
        this.targetArg=targetArg || '127.0.0.1:5900' ;
        this.webDir='./noVNC'
    }
    createVncServer(){
        // parse source and target arguments into parts
        try {
            let idx;
            idx =  this.sourceArg.indexOf(":");
            if (idx >= 0) {
                source_host =  this.sourceArg.slice(0, idx);
                source_port = parseInt( this.sourceArg.slice(idx+1), 10);
            } else {
                source_host = "";
                source_port = parseInt( this.sourceArg, 10);
            }

            idx = this.targetArg.indexOf(":");
            if (idx < 0) {
                throw("target must be host:port");
            }
            target_host = this.targetArg.slice(0, idx);
            target_port = parseInt(this.targetArg.slice(idx+1), 10);

            if (isNaN(source_port) || isNaN(target_port)) {
                throw("illegal port");
            }
        } catch(e) {
            console.error('VncServer need sourceArg like 9000 , targetArg like 127.0.0.1:5900  webDir ./noVNC  ')
          //  console.error("websockify.js [--web web_dir] [--cert cert.pem [--key key.pem]] [--record dir] [source_addr:]source_port target_addr:target_port");
            process.exit(2);
        }

        console.log("WebSocket settings: ");
        console.log("    - proxying from " + source_host + ":" + source_port +
            " to " + target_host + ":" + target_port);
        if ( this.webDir) {
            console.log("    - Web server active. Serving: " +  this.webDir);
        }
       // if (argv.cert) {
       //     argv.key = argv.key || argv.cert;
       //     var cert = fs.readFileSync(argv.cert),
       //         key = fs.readFileSync(argv.key);
       //     console.log("    - Running in encrypted HTTPS (wss://) mode using: " + argv.cert + ", " + argv.key);
       //     webServer = https.createServer({cert: cert, key: key}, this.httpRequest);
       // } else {
            console.log("    - Running in unencrypted HTTP (ws://) mode");
            webServer = http.createServer((request, response)=>this.httpRequest(request, response));
        //}
        return webServer

    }
}

// Handle new WebSocket client
VncServer.prototype.newClient = (client, req)=> {
    let start_time = new Date().getTime();
    let rs = null;
    let target = net.createConnection(target_port,target_host, function() {
    });
    target.on('data', function(data) {
        if (rs) {
            let tdelta = Math.floor(new Date().getTime()) - start_time;
            let rsdata = '\'{' + tdelta + '{' + decodeBuffer(data) + '\',\n';
            rs.write(rsdata);
        }

        try {
            client.send(data);
        } catch(e) {
            target.end();
        }
    });
    target.on('end', function() {
        client.close();
        if (rs) {
            rs.end('\'EOF\'];\n');
        }
    });
    target.on('error', function() {
        target.end();
        client.close();
        if (rs) {
            rs.end('\'EOF\'];\n');
        }
    });

    client.on('message', function(msg) {
        if (rs) {
            let rdelta = Math.floor(new Date().getTime()) - start_time;
            let rsdata = ('\'}' + rdelta + '}' + decodeBuffer(msg) + '\',\n');
            rs.write(rsdata);
        }
        target.write(msg);
    });
    client.on('close', function(code, reason) {
        target.end();
    });
    client.on('error', function(a) {
        target.end();
    });
};

// Send an HTTP error response
VncServer.prototype.httpError= (response, code, msg)=> {
    response.writeHead(code, {"Content-Type": "text/plain"});
    response.write(msg + "\n");
    response.end();
    return;
}
// Process an HTTP static file request
VncServer.prototype.httpRequest =  function (request, response) {

    if (!this.webDir) {
        return this.httpError(response, 403, "403 Permission Denied");
    }
    let uri = url.parse(request.url).pathname
        , filename = path.join(__dirname,this.webDir, uri);

    fs.stat(filename, (err,stats)=> {
        if(!stats) {
            return this.httpError(response, 404, "404 Not Found");
        }
        if (fs.statSync(filename).isDirectory()) {
            filename += '/index.html';
        }
        fs.readFile(filename, "binary", (err, file)=> {
            if(err) {
                return this.httpError(response, 500, err);
            }
            let headers = {};
            let contentType = mime.contentType(path.extname(filename));
            if (contentType !== false) {
                headers['Content-Type'] = contentType;
            }
            response.writeHead(200, headers);
            response.write(file, "binary");
            response.end();
        });
    });
};
function decodeBuffer(buf) {
    let returnString = '';
    for (let i = 0; i < buf.length; i++) {
        if (buf[i] >= 48 && buf[i] <= 90) {
            returnString += String.fromCharCode(buf[i]);
        } else if (buf[i] === 95) {
            returnString += String.fromCharCode(buf[i]);
        } else if (buf[i] >= 97 && buf[i] <= 122) {
            returnString += String.fromCharCode(buf[i]);
        } else {
            let charToConvert = buf[i].toString(16);
            if (charToConvert.length === 0) {
                returnString += '\\x00';
            } else if (charToConvert.length === 1) {
                returnString += '\\x0' + charToConvert;
            } else {
                returnString += '\\x' + charToConvert;
            }
        }
    }
    return returnString;
}

module.exports=VncServer
