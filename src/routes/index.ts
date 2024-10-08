import express from 'express';
import userRoutes from './users.route';
import authenRoutes from './authen.route';

const router = express.Router();

router.use('/', authenRoutes);
router.use('/users', userRoutes);

export default router;
