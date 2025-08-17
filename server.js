const WebSocket = require("ws");
const http = require("http");
const express = require("express");
const path = require("path");
const cors = require("cors");

// -------------------- Express Setup --------------------
const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Root build folder for Unity WebGL
const buildPath = path.join(__dirname, "Build");

// Serve Unity compressed files with correct headers
app.get(/\.wasm\.gz$/, (req, res) => {
  res.set("Content-Encoding", "gzip");
  res.type("application/wasm");
  res.sendFile(path.join(buildPath, path.basename(req.url)));
});

app.get(/\.framework\.js\.gz$/, (req, res) => {
  res.set("Content-Encoding", "gzip");
  res.type("application/javascript");
  res.sendFile(path.join(buildPath, path.basename(req.url)));
});

app.get(/\.data\.gz$/, (req, res) => {
  res.set("Content-Encoding", "gzip");
  res.type("application/octet-stream");
  res.sendFile(path.join(buildPath, path.basename(req.url)));
});

app.get(/\.loader\.js$/, (req, res) => {
  res.type("application/javascript");
  res.sendFile(path.join(buildPath, path.basename(req.url)));
});

// Serve everything else (HTML, CSS, images, TemplateData, etc.)
app.use(express.static(__dirname));

// Create HTTP server (needed for WebSocket + Express together)
const server = http.createServer(app);

// -------------------- WebSocket Setup --------------------
const wss = new WebSocket.Server({ server });

// Online users simulation
let onlineUsers = 200;
const clients = new Set();

// Earnings chart data
let earningsData = [
  { id: 1, name: "WIGHT #", amount: 15000 },
  { id: 2, name: "Merr**RSY", amount: 11000 },
  { id: 3, name: "Merr**IUC", amount: 10000 },
  { id: 4, name: "Merr**CPF", amount: 10000 },
  { id: 5, name: "Merr**BGX", amount: 6000 },
  { id: 6, name: "Merr**O9L", amount: 10000 },
  { id: 7, name: "Man****av", amount: 3000 },
];

// -------------------- Helpers --------------------
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomDelay() {
  return getRandomInt(500, 3000);
}
function getRandomUserChange() {
  return getRandomInt(-15, 20);
}
function getRandomAmountChange() {
  return getRandomInt(-500, 1000);
}

// -------------------- Simulations --------------------

// Update online users
function updateUserCount() {
  const change = getRandomUserChange();
  onlineUsers += change;
  onlineUsers = Math.max(200, Math.min(2000, onlineUsers));
  broadcastOnlineUsers();
  setTimeout(updateUserCount, getRandomDelay());
}

// Update earnings data periodically
function updateEarningsData() {
  earningsData = earningsData.map((item) => {
    if (Math.random() > 0.7) {
      const change = getRandomAmountChange();
      return {
        ...item,
        amount: Math.max(1000, item.amount + change),
      };
    }
    return item;
  });

  // Occasionally add new entries
  if (Math.random() > 0.9) {
    const newId = earningsData.length + 1;
    earningsData.push({
      id: newId,
      name: `User****${Math.random().toString(36).substring(2, 6)}`,
      amount: getRandomInt(2000, 15000),
    });
  }

  // Keep only top 10 earners
  earningsData.sort((a, b) => b.amount - a.amount);
  if (earningsData.length > 10) {
    earningsData = earningsData.slice(0, 10);
  }

  broadcastEarningsData();
  setTimeout(updateEarningsData, getRandomInt(5000, 15000));
}

// -------------------- Broadcasts --------------------
function broadcastOnlineUsers() {
  const message = JSON.stringify({
    type: "onlineUsers",
    count: onlineUsers,
    timestamp: new Date().toISOString(),
  });
  broadcastToClients(message);
}

function broadcastEarningsData() {
  const message = JSON.stringify({
    type: "earningsData",
    data: earningsData,
    title: "Today's earnings chart",
    timestamp: new Date().toISOString(),
  });
  broadcastToClients(message);
}

function broadcastToClients(message) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// -------------------- WebSocket Connections --------------------
wss.on("connection", (ws) => {
  clients.add(ws);

  // Send current data only to the new client
  ws.send(
    JSON.stringify({
      type: "onlineUsers",
      count: onlineUsers,
      timestamp: new Date().toISOString(),
    })
  );
  ws.send(
    JSON.stringify({
      type: "earningsData",
      data: earningsData,
      title: "Today's earnings chart",
      timestamp: new Date().toISOString(),
    })
  );

  ws.on("close", () => {
    clients.delete(ws);
  });
});

// -------------------- Start Everything --------------------
updateUserCount();
updateEarningsData();

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log("- Serving Unity WebGL build with gzip headers");
  console.log("- WebSocket simulating online users + earnings data");
});
