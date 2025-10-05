const User = require('./User');
const Notification = require('./Notification');
const Property = require('./Property');
const Local = require('./Local');
const Tenant = require('./Tenant');
const Lease = require('./Lease');
const Payment = require('./Payment');
const PaymentMode = require('./PaymentMode');
const Document = require('./Document');
const Expense = require('./Expense');

// 🔗 Associations

// User ↔ Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Property ↔ Local
Property.hasMany(Local, { foreignKey: 'property_id', as: 'propertyLocals' });
Local.belongsTo(Property, { foreignKey: 'property_id', as: 'property' });

// Tenant ↔ Lease
Tenant.hasMany(Lease, { foreignKey: 'tenant_id', as: 'tenantLeases' });
Lease.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'leaseTenant' });

// Local ↔ Lease
Local.hasMany(Lease, { foreignKey: 'local_id', as: 'localLeases' });
Lease.belongsTo(Local, { foreignKey: 'local_id', as: 'leaseLocal' });

// Lease ↔ Payment
Lease.hasMany(Payment, { foreignKey: 'lease_id', as: 'leasePayments' });
Payment.belongsTo(Lease, { foreignKey: 'lease_id', as: 'paymentLease' });

// PaymentMode ↔ Payment
PaymentMode.hasMany(Payment, { foreignKey: 'payment_mode_id', as: 'payments' });
Payment.belongsTo(PaymentMode, { foreignKey: 'payment_mode_id', as: 'paymentMode' });

// Lease ↔ Document
Lease.hasMany(Document, { foreignKey: 'lease_id', as: 'leaseDocuments' });
Document.belongsTo(Lease, { foreignKey: 'lease_id', as: 'documentLease' });

// Tenant ↔ Document (if applicable)
Tenant.hasMany(Document, { foreignKey: 'owner_id', as: 'tenantDocuments' });
Document.belongsTo(Tenant, { foreignKey: 'owner_id', as: 'documentTenant' });

// Property ↔ Expense
Property.hasMany(Expense, { foreignKey: 'property_id', as: 'propertyExpenses' });
Expense.belongsTo(Property, { foreignKey: 'property_id', as: 'expenseProperty' });

// Local ↔ Expense
Local.hasMany(Expense, { foreignKey: 'local_id', as: 'localExpenses' });
Expense.belongsTo(Local, { foreignKey: 'local_id', as: 'expenseLocal' });

module.exports = {
  User,
  Notification,
  Property,
  Local,
  Tenant,
  Lease,
  Payment,
  PaymentMode,
  Document,
  Expense
};
