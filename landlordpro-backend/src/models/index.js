const sequelize = require('../../db');


const User = require('./User');
const Tenant = require('./Tenant');
const Property = require('./Property');
const Local = require('./Local');
const Lease = require('./Lease');
const PaymentMode = require('./PaymentMode');
const Payment = require('./Payment');
const Document = require('./Document');
const Expense = require('./Expense');
const Notification = require('./Notification');


module.exports = {
sequelize,
User,
Tenant,
Property,
Local,
Lease,
PaymentMode,
Payment,
Document,
Expense,
Notification
};