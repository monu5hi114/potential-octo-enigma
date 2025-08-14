const WebSocket = require('ws');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Online users simulation
let onlineUsers = 200;
const clients = new Set();

// Earnings chart data
let earningsData = [
  { id: 1, name: 'WIGHT #', amount: 15000 },
  { id: 2, name: 'Merr**RSY', amount: 11000 },
  { id: 3, name: 'Merr**IUC', amount: 10000 },
  { id: 4, name: 'Merr**CPF', amount: 10000 },
  { id: 5, name: 'Merr**BGX', amount: 6000 },
  { id: 6, name: 'Merr**O9L', amount: 10000 },
  { id: 7, name: 'Man****av', amount: 3000 }
];

// Helper functions
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

// Update online users count
function updateUserCount() {
  const change = getRandomUserChange();
  onlineUsers += change;
  onlineUsers = Math.max(200, Math.min(2000, onlineUsers));
  broadcastOnlineUsers();
  setTimeout(updateUserCount, getRandomDelay());
}

// Update earnings data periodically
function updateEarningsData() {
  // Randomly update some entries
  earningsData = earningsData.map(item => {
    if (Math.random() > 0.7) { // 30% chance to update each entry
      const change = getRandomAmountChange();
      return {
        ...item,
        amount: Math.max(1000, item.amount + change) // Ensure minimum amount
      };
    }
    return item;
  });
  
  // Occasionally add new entries (10% chance)
  if (Math.random() > 0.9) {
    const newId = earningsData.length + 1;
    earningsData.push({
      id: newId,
      name: `User****${Math.random().toString(36).substring(2, 6)}`,
      amount: getRandomInt(2000, 15000)
    });
  }
  
  // Keep only top 10 earners
  earningsData.sort((a, b) => b.amount - a.amount);
  if (earningsData.length > 10) {
    earningsData = earningsData.slice(0, 10);
  }
  
  broadcastEarningsData();
  setTimeout(updateEarningsData, getRandomInt(5000, 15000)); // 5-15 seconds
}

// Broadcast functions
function broadcastOnlineUsers() {
  const message = JSON.stringify({
    type: 'onlineUsers',
    count: onlineUsers,
    timestamp: new Date().toISOString()
  });
  broadcastToClients(message);
}

function broadcastEarningsData() {
  const message = JSON.stringify({
    type: 'earningsData',
    data: earningsData,
    title: "Today's earnings chart",
    timestamp: new Date().toISOString()
  });
  broadcastToClients(message);
}

function broadcastToClients(message) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  clients.add(ws);
  
  // Send current data immediately to new connection
  broadcastOnlineUsers();
  broadcastEarningsData();
  
  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Start the simulation
updateUserCount();
updateEarningsData();

server.listen(3000, () => {
  console.log('Server running on port 3000');
  console.log('Simulating:');
  console.log('- Random user count between 200 and 2000');
  console.log('- Dynamic earnings chart data updates');
});