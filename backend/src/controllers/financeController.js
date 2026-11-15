const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { generateSequentialId } = require('../utils/idGenerator');
const { BILL_STATUS } = require('../config/constants');
const { recordAudit } = require('../middlewares/auditLogger');

// @desc    Get all bills
// @route   GET /api/v1/finance/bills
// @access  Private
const getBills = async (req, res, next) => {
  try {
    const { status, patientId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.paymentStatus = status;
    if (patientId) query.patient = patientId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bills = await Bill.find(query)
      .populate('patient', 'patientId fullName phone email')
      .populate('admission', 'admissionId admissionDate dischargeDate')
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Bill.countDocuments(query);

    res.status(200).json({
      success: true,
      count: bills.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: bills,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single bill with its payments
// @route   GET /api/v1/finance/bills/:id
// @access  Private
const getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('patient', 'patientId fullName phone email address')
      .populate('admission', 'admissionId admissionDate dischargeDate room bed')
      .populate('createdBy', 'name role');

    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const payments = await Payment.find({ bill: bill._id })
      .populate('receivedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...bill.toObject(),
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new itemized bill
// @route   POST /api/v1/finance/bills
// @access  Private (Admin, Accountant, Receptionist)
const createBill = async (req, res, next) => {
  try {
    const { patient, admission, items = [], taxAmount = 0, discountAmount = 0, dueDate, notes } = req.body;

    const subTotal = items.reduce((sum, item) => sum + (Number(item.totalPrice) || (item.unitPrice * item.quantity)), 0);
    const tax = Number(taxAmount) || 0;
    const discount = Number(discountAmount) || 0;
    const totalAmount = Math.max(0, subTotal + tax - discount);
    const balanceAmount = totalAmount;

    const billId = await generateSequentialId('BILL', 'Bill', 'billId');

    const bill = await Bill.create({
      billId,
      patient,
      admission: admission || null,
      items,
      subTotal,
      taxAmount: tax,
      discountAmount: discount,
      totalAmount,
      paidAmount: 0,
      balanceAmount,
      paymentStatus: BILL_STATUS.UNPAID,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: notes || '',
      createdBy: req.user._id,
    });

    await recordAudit({
      req,
      action: 'BILL_CREATED',
      module: 'FINANCE',
      targetEntity: 'Bill',
      targetId: bill._id.toString(),
      details: { billId, totalAmount, patient },
    });

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: bill,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record payment for a bill
// @route   POST /api/v1/finance/payments
// @access  Private (Admin, Accountant)
const recordPayment = async (req, res, next) => {
  try {
    const { billId, amount, paymentMethod, transactionReference, notes } = req.body;

    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const payAmount = Number(amount);
    if (payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
    }

    if (payAmount > bill.balanceAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount ($${payAmount}) exceeds balance due ($${bill.balanceAmount})`,
      });
    }

    const paymentSeqId = await generateSequentialId('PAY', 'Payment', 'paymentId');

    const payment = await Payment.create({
      paymentId: paymentSeqId,
      bill: bill._id,
      patient: bill.patient,
      amount: payAmount,
      paymentMethod: paymentMethod || 'CASH',
      transactionReference: transactionReference || '',
      paymentDate: new Date(),
      notes: notes || '',
      receivedBy: req.user._id,
    });

    // Update bill
    bill.paidAmount += payAmount;
    bill.balanceAmount -= payAmount;

    if (bill.balanceAmount === 0) {
      bill.paymentStatus = BILL_STATUS.PAID;
    } else {
      bill.paymentStatus = BILL_STATUS.PARTIALLY_PAID;
    }
    await bill.save();

    await recordAudit({
      req,
      action: 'PAYMENT_RECORDED',
      module: 'FINANCE',
      targetEntity: 'Payment',
      targetId: payment._id.toString(),
      details: { paymentId: paymentSeqId, billId: bill.billId, amount: payAmount },
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        billUpdated: {
          billId: bill.billId,
          paidAmount: bill.paidAmount,
          balanceAmount: bill.balanceAmount,
          paymentStatus: bill.paymentStatus,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get operational expenses
// @route   GET /api/v1/finance/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const query = {};
    if (category) query.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const expenses = await Expense.find(query)
      .populate('recordedBy', 'name role')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.status(200).json({
      success: true,
      count: expenses.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record an expense
// @route   POST /api/v1/finance/expenses
// @access  Private (Admin, Accountant)
const createExpense = async (req, res, next) => {
  try {
    const { title, category, amount, paymentMethod, vendor, date, receiptNumber, notes } = req.body;

    const expenseId = await generateSequentialId('EXP', 'Expense', 'expenseId');

    const expense = await Expense.create({
      expenseId,
      title,
      category: category || 'MEDICAL_SUPPLIES',
      amount: Number(amount),
      paymentMethod: paymentMethod || 'BANK_TRANSFER',
      vendor: vendor || '',
      date: date || new Date(),
      status: 'PAID',
      receiptNumber: receiptNumber || '',
      notes: notes || '',
      recordedBy: req.user._id,
    });

    await recordAudit({
      req,
      action: 'EXPENSE_RECORDED',
      module: 'FINANCE',
      targetEntity: 'Expense',
      targetId: expense._id.toString(),
      details: { expenseId, title, amount },
    });

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get financial KPI summary
// @route   GET /api/v1/finance/summary
// @access  Private
const getFinanceSummary = async (req, res, next) => {
  try {
    const payments = await Payment.find();
    const expenses = await Expense.find();
    const bills = await Bill.find();

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalBilled = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalReceivables = bills.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);
    const netIncome = totalRevenue - totalExpenses;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netIncome,
        totalBilled,
        totalReceivables,
        billsCount: bills.length,
        paymentsCount: payments.length,
        expensesCount: expenses.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBills,
  getBillById,
  createBill,
  recordPayment,
  getExpenses,
  createExpense,
  getFinanceSummary,
};
