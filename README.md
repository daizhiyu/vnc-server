# vnv-server 服务

 提供node服务 ，让其他电脑或设备可以通过浏览器或/vnc专属服务 远程连接到开启此服务的设备上

包含 packages 是windows 64位 VNC 服务软件包

### VNC软件简介

**VNC**（Virtual Network Computing），为一种使用 RFB 协定的屏幕画面分享及远端操作软件。此软件借由网络，可传送键盘与鼠标的动作及即时的屏幕画面。

VNC 与操作系统无关，因此可跨平台使用，例如可用 Windows 连线到某 Linux 的电脑，反之亦同。甚至在没有安装用户端程式的电脑中，只要有支援 JAVA 的浏览器，也可使用。

UltraVNC：加入了 TightVNC 的部份程式及加强效能的图型映射驱动程式，并结合 Active Directory 及 NTLM 的帐号密码认证，但仅有 Windows 版本。

 安装

```
npm i --save vnc-server

```

```
const vncServer =require('vnc-server')
const  WebSocketServer = require('ws').Server;
let vncConfig={
    port:9000,  // 当前服务监听的ws端口
    vncAddress:'127.0.0.1:5900',// vnc服务端口
}
 let vnc_server=  new vncServer(vncConfig.port,vncConfig.vncAddress);
 let webServer= vnc_server.createVncServer();
 webServer.listen(vncConfig.port, ()=> {
  let   wsServer = new WebSocketServer({server: webServer});
    wsServer.on('connection', vnc_server.newClient);
});


```

vue 使用    需要安装 @novnc/novnc  

```js
<template>
   <div id="view" ref="rfbRef"></div>
</template>

<script setup>

import {nextTick, onMounted, ref} from "vue";
import RFB from '@novnc/novnc/core/rfb';
  const vncConfig={
    "rfb": "http://127.0.0.1:9000/vnc.html",
    "password": "123456",
    "websockify": "ws://127.0.0.1:9000"
  },

const rfbServer =ref();
const rfbRef =ref();
onMounted(()=>{
  rfbServer.value=new RFB(rfbRef.value,vncConfig.websockify);
})
const connect=()=>{
  rfbServer.value.sendCredentials({password:vncConfig.password});
 
}
const disconnect = () => {
  rfbServer.value.disconnect();
  rfbServer.value=new RFB(rfbRef.value,websockify);
}



</script>


```


