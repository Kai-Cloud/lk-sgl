const io = require('socket.io-client');
const axios = require('axios');
const https = require('https');
const path = require('path');
require('dotenv').config();

// Configuration
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3030';
const BOT_USERNAME = process.env.BOT_USERNAME || path.basename(__dirname); // "game-bot"
const BOT_PASSWORD = process.env.BOT_PASSWORD;
const BOT_DISPLAY_NAME = process.env.BOT_DISPLAY_NAME || '游戏大厅';
const BOT_CONTENT_URL = process.env.BOT_CONTENT_URL || '/games/games.json';
const BOT_ROOM_THEME = process.env.BOT_ROOM_THEME || 'game-lobby';
const BOT_AVATAR = process.env.BOT_AVATAR || '🎮';
const REJECT_UNAUTHORIZED = process.env.REJECT_UNAUTHORIZED !== 'false';

async function main() {
  console.log('\n========================================');
  console.log('🎮 游戏大厅 Bot starting...');
  console.log('========================================\n');

  // Step 1: Login via HTTP API
  let token;
  try {
    const axiosConfig = {
      httpsAgent: new https.Agent({ rejectUnauthorized: REJECT_UNAUTHORIZED })
    };

    const loginResponse = await axios.post(
      `${SERVER_URL}/api/login`,
      { username: BOT_USERNAME, password: BOT_PASSWORD, isBot: true },
      axiosConfig
    );

    if (!loginResponse.data.success) {
      throw new Error(loginResponse.data.error || 'Login failed');
    }

    token = loginResponse.data.token;
    console.log('✅ Login successful');

  } catch (error) {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
  }

  // Step 2: Connect via Socket.io
  const socket = io(SERVER_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
    rejectUnauthorized: REJECT_UNAUTHORIZED
  });

  let currentUser = null;
  let myPrivateRooms = [];

  socket.on('connect', () => {
    console.log('🔌 Connected to server');
    socket.emit('loginWithToken', { token });
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Disconnected: ${reason}`);
    if (reason === 'io server disconnect') {
      console.log('🔄 Server disconnected, will auto-reconnect...');
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`✅ Reconnected (attempts: ${attemptNumber})`);
    socket.emit('loginWithToken', { token });
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Reconnecting... (attempt ${attemptNumber})`);
  });

  socket.on('loginSuccess', (data) => {
    currentUser = data.user;
    console.log(`✅ Authenticated as: ${currentUser.displayName} (${currentUser.username})`);

    // Step 3: Update display name if needed
    if (currentUser.displayName !== BOT_DISPLAY_NAME) {
      socket.emit('updateDisplayName', { displayName: BOT_DISPLAY_NAME });
    }

    // Step 4: Report bot metadata (content_url makes this a "content bot")
    socket.emit('botSetMetadata', {
      content_url: BOT_CONTENT_URL,
      room_theme: BOT_ROOM_THEME,
      avatar: BOT_AVATAR
    });

    // Step 5: Ensure private rooms exist with all users, then restore visibility
    socket.emit('botEnsureRoomsForAllUsers');
    socket.emit('botRestoreRooms');
  });

  socket.on('displayNameUpdated', (data) => {
    console.log(`✏️  Display name updated to: ${data.displayName}`);
  });

  socket.on('roomList', (rooms) => {
    // Track which private rooms belong to this bot
    myPrivateRooms = rooms.filter(r => r.type === 'private');
    console.log(`📁 Managing ${myPrivateRooms.length} private rooms`);
  });

  socket.on('newRoom', (room) => {
    // Track new private rooms
    if (room.type === 'private') {
      myPrivateRooms.push(room);
      console.log(`📁 New room created: ${room.name}`);
    }
  });

  // Note: No message handling - frontend displays game cards directly via content_url

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  // Heartbeat: keep online status alive
  setInterval(() => {
    if (socket.connected && currentUser) {
      socket.emit('keepAlive');
      console.log('💓 Heartbeat');
    }
  }, 30000);

  // Handle shutdown - hide all rooms
  process.on('SIGINT', async () => {
    console.log('\n⏹️  Shutting down...');
    socket.emit('botHideRooms');
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for server to process
    socket.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    socket.emit('botHideRooms');
    socket.close();
    process.exit(0);
  });
}

main().catch(error => {
  console.error('❌ Bot startup failed:', error);
  process.exit(1);
});
