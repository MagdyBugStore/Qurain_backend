import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getWallet,
  getTransactions,
  getWithdrawalRequests,
  createWithdrawalRequest,
  updateWalletBalance,
} from '../controllers/wallet.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Wallet operations
router.get('/', getWallet);
router.get('/transactions', getTransactions);
router.get('/withdrawal-requests', getWithdrawalRequests);
router.post('/withdrawal-requests', createWithdrawalRequest);

// Admin only
router.patch('/balance', authorize('admin'), updateWalletBalance);

export default router;
