import { Wallet, Transaction, WithdrawalRequest, Teacher } from '../models/index.js';

/**
 * Get wallet data
 */
export const getWallet = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    let wallet = await Wallet.findOne({ teacherId: teacher._id });
    if (!wallet) {
      wallet = new Wallet({
        teacherId: teacher._id,
        balance: 0,
        currency: 'SAR',
      });
      await wallet.save();
    }

    const [transactions, withdrawalRequests] = await Promise.all([
      Transaction.find({ teacherId: teacher._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      WithdrawalRequest.find({ teacherId: teacher._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        wallet: {
          balance: parseFloat(wallet.balance.toString()),
          currency: wallet.currency,
          transactions,
          withdrawalRequests,
        },
      },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transactions
 */
export const getTransactions = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    const transactions = await Transaction.find({ teacherId: teacher._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50)
      .lean();

    res.json({
      success: true,
      data: { transactions },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get withdrawal requests
 */
export const getWithdrawalRequests = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    const requests = await WithdrawalRequest.find({ teacherId: teacher._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 20)
      .lean();

    res.json({
      success: true,
      data: { withdrawalRequests: requests },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create withdrawal request
 */
export const createWithdrawalRequest = async (req, res, next) => {
  try {
    const { amount, currency, bankName, accountNumber, iban } = req.body;
    const teacher = await Teacher.findOne({ userId: req.user.id });
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher profile not found' },
        meta: {},
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'INVALID_AMOUNT', message: 'Amount must be greater than zero' },
        meta: {},
      });
    }

    // Check wallet balance
    let wallet = await Wallet.findOne({ teacherId: teacher._id });
    if (!wallet) {
      wallet = new Wallet({ teacherId: teacher._id, balance: 0, currency: 'SAR' });
      await wallet.save();
    }

    const balance = parseFloat(wallet.balance.toString());
    if (amount > balance) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' },
        meta: {},
      });
    }

    const request = new WithdrawalRequest({
      teacherId: teacher._id,
      amount,
      currency: currency || wallet.currency,
      bankName,
      accountNumber,
      iban,
      status: 'pending',
    });
    await request.save();

    res.status(201).json({
      success: true,
      data: { withdrawalRequest: request },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update wallet balance (internal/admin use)
 */
export const updateWalletBalance = async (req, res, next) => {
  try {
    const { teacherId, newBalance } = req.body;
    const teacher = await Teacher.findById(teacherId);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'TEACHER_NOT_FOUND', message: 'Teacher not found' },
        meta: {},
      });
    }

    let wallet = await Wallet.findOne({ teacherId: teacher._id });
    if (!wallet) {
      wallet = new Wallet({
        teacherId: teacher._id,
        balance: newBalance,
        currency: 'SAR',
      });
    } else {
      wallet.balance = newBalance;
    }
    await wallet.save();

    res.json({
      success: true,
      data: { wallet },
      error: null,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};
