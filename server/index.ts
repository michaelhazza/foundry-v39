import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { authRoutes } from './routes/auth.routes.js';
import { organizationRoutes } from './routes/organizations.routes.js';
import { userRoutes } from './routes/users.routes.js';
import { projectRoutes } from './routes/projects.routes.js';
import { dataSourceRoutes } from './routes/dataSources.routes.js';
import { processingJobRoutes } from './routes/processingJobs.routes.js';
import { schemaMappingRoutes } from './routes/schemaMappings.routes.js';
import { deidentificationRuleRoutes } from './routes/deidentificationRules.routes.js';
import { datasetRoutes } from './routes/datasets.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Security middleware (must be first)
app.use(helmet());
app.use(cors({
  origin: process.env.APP_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', dataSourceRoutes);
app.use('/api/projects', processingJobRoutes);
app.use('/api/projects', schemaMappingRoutes);
app.use('/api/projects', deidentificationRuleRoutes);
app.use('/api/projects', datasetRoutes);

// Production: serve static files
if (isProduction) {
  const staticPath = path.resolve(__dirname, '../public');
  app.use(express.static(staticPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Error handler (MUST be last)
app.use(errorHandler);

// Start server
const host = isProduction ? '0.0.0.0' : '127.0.0.1';
app.listen(PORT, host, () => {
  console.log(`Server listening on ${host}:${PORT}`); // @allow-console
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`); // @allow-console
});

export default app;
