const express = require('express');
const {
  getBills,
  getBillById,
  createBill,
  recordPayment,
  getExpenses,
  createExpense,
  getFinanceSummary,
} = require('../controllers/financeController');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/rbac');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.get('/summary', getFinanceSummary);

router
  .route('/bills')
  .get(getBills)
  .post(
    authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.ACCOUNTANT, ROLES.RECEPTIONIST),
    createBill
  );

router.route('/bills/:id').get(getBillById);

router.post(
  '/payments',
  authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.ACCOUNTANT),
  recordPayment
);

router
  .route('/expenses')
  .get(getExpenses)
  .post(
    authorize(ROLES.SUPER_ADMIN, ROLES.HOSPITAL_ADMIN, ROLES.ACCOUNTANT),
    createExpense
  );

module.exports = router;
