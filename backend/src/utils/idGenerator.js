const mongoose = require('mongoose');

/**
 * Generate sequential formatted IDs:
 * e.g. PID-2026-0001, DOC-2026-0001, APT-2026-0001
 * 
 * @param {string} prefix - 'PID', 'DOC', 'APT', 'BILL', 'RX', etc.
 * @param {string} modelName - Name of Mongoose model
 * @param {string} idField - Field name storing the ID string
 * @returns {Promise<string>}
 */
const generateSequentialId = async (prefix, modelName, idField) => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `${prefix}-${currentYear}-`;

  const Model = mongoose.model(modelName);
  
  // Find latest record with this year's prefix
  const latestRecord = await Model.findOne({
    [idField]: { $regex: `^${yearPrefix}` },
  })
    .sort({ [idField]: -1 })
    .select(idField)
    .lean();

  let nextSequence = 1;

  if (latestRecord && latestRecord[idField]) {
    const parts = latestRecord[idField].split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSequence = lastNum + 1;
    }
  }

  // Format with 4 digits zero padding
  const paddedSeq = String(nextSequence).padStart(4, '0');
  return `${yearPrefix}${paddedSeq}`;
};

module.exports = { generateSequentialId };
