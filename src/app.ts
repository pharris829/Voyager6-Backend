import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import tasksRouter from './api/routes/tasks';
import boardsRouter from './api/routes/boards';
import workflowsRouter from './api/routes/workflows';
import usersRouter from './api/routes/users';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/v1', tasksRouter);
app.use('/api/v1/boards', boardsRouter);
app.use('/api/v1', workflowsRouter);
app.use('/api/v1/users', usersRouter);

app.use(errorHandler);

export default app;
