/*
    MIT License
    
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

import express from "express";
import path from "path";
import session from "express-session";
import router from "./routes/index.js";
import fs from 'fs';
import hbs from "hbs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import connectDB from "./config/db.js";
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ensureDefaultSettings } from "./models/CertificateSettings.js";
import { createAdmin } from "./models/userModel.js";

hbs.handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
  if (operator === "==" && v1 === v2) return options.fn(this);
  return options.inverse(this);
});

hbs.registerHelper("endsWith", function (str, suffix) {
  return str ? str.toLowerCase().endsWith(suffix.toLowerCase()) : false;
});

hbs.registerHelper("or", function (a, b) {
  return a || b;
});

hbs.registerHelper('inc', function (value) {
  return parseInt(value, 10) + 1;
});

// ✅ Added eq helper for templates like blotter.xian
hbs.registerHelper('eq', function(a, b) {
  return a === b;
});

// Substring helper for getting first character
hbs.registerHelper('substring', function(str, start, end) {
  if (!str) return '';
  return str.substring(start, end).toUpperCase();
});

// Greater than helper
hbs.registerHelper('gt', function(a, b) {
  return a > b;
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const isVercelRuntime = Boolean(process.env.VERCEL);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve manifest.json with correct content-type
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(path.join(process.cwd(), 'public', 'manifest.json'));
});

// Serve service-worker.js with correct content-type
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(process.cwd(), 'public', 'service-worker.js'));
});

app.use(express.static(path.join(process.cwd(), "public")));
app.use("/uploads", express.static("public/uploads"));

// Session configuration (using MemoryStore for now - works fine for single server)
app.use(session({
  secret: process.env.SESSION_SECRET || "xianfire-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Set views directory first
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "xian");

// Register partials synchronously BEFORE setting up the engine
const partialsDir = path.join(__dirname, "views/partials");

hbs.registerPartials(partialsDir, (err) => {
  if (err) {
    console.error("❌ Could not register partials:", err);
  }
});

// Also manually register .xian partials since hbs.registerPartials looks for .hbs by default
try {
  const files = fs.readdirSync(partialsDir);
  files
    .filter(file => file.endsWith('.xian'))
    .forEach(file => {
      const partialName = file.replace('.xian', ''); 
      const fullPath = path.join(partialsDir, file);
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        hbs.registerPartial(partialName, content);
        console.log(`✅ Registered partial: ${partialName}`);
      } catch (err) {
        console.error(`❌ Failed to read partial: ${file}`, err);
      }
    });
  console.log(`✅ All partials registered successfully`);
} catch (err) {
  console.error("❌ Could not read partials directory:", err);
}

// Custom engine that bypasses hbs middleware issues
app.engine("xian", (filePath, options, callback) => {
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) return callback(err);
    
    try {
      const template = hbs.handlebars.compile(content);
      const html = template(options);
      callback(null, html);
    } catch (err) {
      callback(err);
    }
  });
});

app.use("/", router);

// WebRTC Signaling Server for Video/Audio Calls
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join call room
  socket.on('join-call', (data) => {
    socket.join('officials-call');
    socket.to('officials-call').emit('user-joined', {
      userId: socket.id,
      username: data.username,
      role: data.role
    });
  });

  // Initiate call - notify all other users
  socket.on('initiate-call', (data) => {
    const callId = `call-${Date.now()}-${socket.id}`;
    socket.to('officials-call').emit('incoming-call', {
      callId: callId,
      callerId: socket.id,
      callerName: data.callerName,
      callerRole: data.callerRole,
      type: data.type // 'video' or 'audio'
    });
    console.log(`${data.callerName} initiated ${data.type} call`);
  });

  // Call accepted
  socket.on('call-accepted', (data) => {
    socket.to(data.callerId).emit('call-accepted', {
      callId: data.callId,
      acceptedBy: socket.id
    });
    console.log('Call accepted:', data.callId);
  });

  // Call declined
  socket.on('call-declined', (data) => {
    socket.to(data.callerId).emit('call-declined', {
      callId: data.callId,
      declinedBy: socket.id
    });
    console.log('Call declined:', data.callId);
  });

  // WebRTC signaling
  socket.on('offer', (data) => {
    socket.to('officials-call').emit('offer', {
      offer: data.offer,
      from: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.to).emit('answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to('officials-call').emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  // Leave call
  socket.on('leave-call', () => {
    socket.to('officials-call').emit('user-left', socket.id);
    socket.leave('officials-call');
  });

  socket.on('disconnect', () => {
    socket.to('officials-call').emit('user-left', socket.id);
    console.log('User disconnected:', socket.id);
  });
});

export default httpServer;
export { app, io };

// Start server after the database is ready
const initializeApp = async () => {
  try {
    await connectDB();
    await ensureDefaultSettings();
    await createAdmin();

    if (!isVercelRuntime) {
      httpServer.listen(PORT, () => {
        console.log(`🔥 XianFire running at http://localhost:${PORT}`);
      });
    } else {
      console.log('🔥 Vercel runtime detected. Express app is ready for serverless execution.');
    }
  } catch (error) {
    console.error('❌ Application startup failed:', error);
    if (!isVercelRuntime) {
      process.exit(1);
    }
  }
};

initializeApp();

export { app as default };
