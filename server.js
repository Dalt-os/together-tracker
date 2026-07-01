const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.static('public')); // pon tu HTML aquí

// Estado compartido en memoria (reemplazable por SQLite luego)
let sharedState = {};
let sharedNames = ['Pareja 1', 'Pareja 2'];
let sharedConfig = { s: 20, a: 11, b: 6 };

// Broadcast a todos los clientes conectados excepto el emisor
function broadcast(data, senderWs) {
  wss.clients.forEach(client => {
    if (client !== senderWs && client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

// WebSocket: sincronización en tiempo real
wss.on('connection', (ws) => {
  // Al conectar, enviar el estado actual
  ws.send(JSON.stringify({
    type: 'INIT',
    state: sharedState,
    names: sharedNames,
    config: sharedConfig
  }));

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);

    if (msg.type === 'STATE_UPDATE') {
      sharedState = msg.state;
      broadcast({ type: 'STATE_UPDATE', state: sharedState }, ws);
    }
    if (msg.type === 'NAMES_UPDATE') {
      sharedNames = msg.names;
      broadcast({ type: 'NAMES_UPDATE', names: sharedNames }, ws);
    }
    if (msg.type === 'CONFIG_UPDATE') {
      sharedConfig = msg.config;
      broadcast({ type: 'CONFIG_UPDATE', config: sharedConfig }, ws);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));