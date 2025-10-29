const cron = require('node-cron');
const { Op } = require('sequelize');
const Lease = require('../models/Lease');

/**
 * Daily job to mark expired leases
 * Runs every day at midnight (Africa/Kigali timezone)
 */
cron.schedule(
  '0 0 * * *',
  async () => {
    try {
      const today = new Date();

      // Update all active leases where end_date < today
      const [updatedCount] = await Lease.update(
        { status: 'expired' },
        {
          where: {
            status: 'active',
            end_date: { [Op.lt]: today },
          },
        }
      );

      if (updatedCount > 0) {
        console.log(`✅ Lease Status Updater: ${updatedCount} leases marked as expired.`);
      } else {
        console.log('ℹ️ Lease Status Updater: No leases to update today.');
      }
    } catch (err) {
      console.error('❌ Error updating lease statuses:', err.message);
    }
  },
  {
    timezone: 'Africa/Kigali',
  }
);
