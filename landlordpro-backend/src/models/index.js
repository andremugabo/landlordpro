const { User } = require('./User');
const { Notification } = require('./Notification');

// Define associations
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  User,
  Notification
};
