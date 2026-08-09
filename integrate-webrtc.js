// Script to integrate WebRTC into officials_chat.xian
// Run with: node integrate-webrtc.js

import fs from 'fs';
import path from 'path';

const chatFilePath = 'views/partials/officials_chat.xian';

console.log('🔧 Integrating WebRTC into officials chat...\n');

// Read the current file
let content = fs.readFileSync(chatFilePath, 'utf8');

// Check if already integrated
if (content.includes('webrtc-calls.js')) {
  console.log('✅ WebRTC is already integrated!');
  console.log('\n📝 Next steps:');
  console.log('1. Ensure your site is accessed via HTTPS');
  console.log('2. Test video/audio calls');
  console.log('3. See WEBRTC_SETUP.md for detailed instructions\n');
  process.exit(0);
}

// Add WebRTC script before Socket.io script
const socketScriptTag = '<script src="/socket.io/socket.io.js"></script>';
const webrtcScriptTag = '<!-- WebRTC Implementation -->\n<script src="/js/webrtc-calls.js"></script>\n\n';

if (content.includes(socketScriptTag)) {
  content = content.replace(socketScriptTag, webrtcScriptTag + socketScriptTag);
  console.log('✅ Added WebRTC script tag');
} else {
  console.log('⚠️  Could not find Socket.IO script tag');
}

// Add WebRTC initialization after socket connection
const socketConnectCode = `  // Join the officials call room on connection
  socket.on('connect', () => {
    socket.emit('join-call', {
      username: '{{user.username}}',
      role: '{{user.role}}'
    });
  });`;

const webrtcInitCode = `  // Join the officials call room on connection
  socket.on('connect', () => {
    socket.emit('join-call', {
      username: '{{user.username}}',
      role: '{{user.role}}'
    });
  });
  
  // Initialize WebRTC handler
  let webrtcCall = null;
  
  document.addEventListener('DOMContentLoaded', function() {
    webrtcCall = new WebRTCCall(socket, '{{user.username}}', '{{user.role}}');
  });`;

if (content.includes(socketConnectCode)) {
  content = content.replace(socketConnectCode, webrtcInitCode);
  console.log('✅ Added WebRTC initialization');
} else {
  console.log('⚠️  Could not find socket connection code');
}

// Write the updated content
fs.writeFileSync(chatFilePath, content, 'utf8');

console.log('\n✅ WebRTC integration complete!');
console.log('\n📝 Next steps:');
console.log('1. Restart your server');
console.log('2. Access your site via HTTPS (required for camera/mic)');
console.log('3. Test video/audio calls between officials');
console.log('4. See WEBRTC_SETUP.md for detailed setup guide\n');
console.log('⚠️  IMPORTANT: HTTPS is required for WebRTC to work online!');
console.log('   Access via: https://barangay.mocogo.site\n');
