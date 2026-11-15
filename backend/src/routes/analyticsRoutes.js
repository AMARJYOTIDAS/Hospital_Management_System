const express = require('express');
const { getDashboardAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);
router.get('/dashboard', getDashboardAnalytics);

module.exports = router;
