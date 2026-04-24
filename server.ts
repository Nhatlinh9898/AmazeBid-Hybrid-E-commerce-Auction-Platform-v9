import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import v3Router from './routes/v3';
// import { p2p } from './services/p2pService';
import { db } from './db';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  
  console.log('[Server] Setting up Socket.io...');
  const io = new Server(server, {
    cors: { origin: "*" }
  });
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Health Check
  app.get('/api/health', (req, res) => {
    console.log('[Server] Health check requested');
    try {
      res.json({ 
        status: 'ok_v3', 
        gemini_key: !!process.env.GEMINI_API_KEY,
        api_key: !!process.env.API_KEY,
        db_ready: !!db
      });
    } catch (err) {
      console.error('[Server] Health check failed:', err);
      res.status(500).json({ status: 'error', message: 'Internal Server Error during health check' });
    }
  });

  // Handle errors in v3Router
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('[Server] Global Error Handler:', err);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({ status: 'error', message: err.message || 'Internal Server Error' });
    }
    next(err);
  });

  // API Routes
  app.use('/api', v3Router);

  // API 404 handler
  app.use('/api', (req, res) => {
    console.log(`[Server] API 404: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ status: 'error', message: `API route not found: ${req.originalUrl}` });
  });

  // Socket.io Logic
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_product_room', (productId) => {
      socket.join(productId);
      console.log(`User ${socket.id} joined room ${productId}`);
    });

    socket.on('bid:place', (data) => {
      // Broadcast to all in the room
      console.log('New bid received:', data);
      io.to(data.productId).emit('bid:updated', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // Real Email Sending Endpoint (Resend)
  app.post('/api/send-email', async (req, res) => {
    const { to, subject, html } = req.body;
    
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ 
        error: 'RESEND_API_KEY is not configured on the server.',
        message: 'Vui lòng cấu hình RESEND_API_KEY trong phần Settings để gửi email thật.'
      });
    }

    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: [to],
        subject: subject,
        html: html,
      });

      if (error) {
        console.error('Resend Error:', error);
        return res.status(400).json({ error });
      }

      res.json({ success: true, data });
    } catch (err) {
      console.error('Failed to send real email:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log('Initializing Vite...');
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log('Vite initialized');
    } catch (e: any) {
      console.error(`Vite initialization failed: ${e.message}`);
      throw e;
    }
    console.log('Vite middleware mounted');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Background Auction Manager (Runs every 1 minute)
    setInterval(async () => {
      try {
        const products = db.get('products') || [];
        const now = new Date();
        let changed = false;

        const updatedProducts = products.map((p: any) => {
          if (p.type === 'AUCTION' && p.endTime && new Date(p.endTime) < now) {
            // Auction ended. Check bids.
            const bidCount = p.bidCount || 0;
            if (bidCount === 0 && p.autoRestart) {
              console.log(`[AuctionManager] Auto-restarting auction for ${p.title} (${p.id})`);
              changed = true;
              
              const oldStart = p.startTime ? new Date(p.startTime).getTime() : now.getTime();
              const oldEnd = new Date(p.endTime).getTime();
              const duration = oldEnd - oldStart;
              
              // Set new start to now and extend end by the same duration
              return {
                ...p,
                startTime: now.toISOString(),
                endTime: new Date(now.getTime() + duration).toISOString(),
                currentBid: p.price, // Reset to starting price
                bidHistory: [],
                status: 'AVAILABLE'
              };
            }
          }
          return p;
        });

        if (changed) {
          await db.update('products', () => updatedProducts);
          io.emit('auction:restarted', { message: 'Some auctions have been restarted' });
        }
      } catch (err) {
        console.error('[AuctionManager] Error:', err);
      }
    }, 60000); // 1 minute

    // Initialize P2P Relay Node after server starts
    /*
    try {
      console.log('[Server] Initializing P2P Relay Node...');
      p2p.initServer(server);
      console.log('[Server] P2P Relay Node initialized');
    } catch (err: any) {
      console.error('[Server] P2P Initialization failed:', err.message);
    }
    */
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
