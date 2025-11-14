/**
 * Simple scheduler: scans medicines every minute and creates pending reminders
 * for "today" times when within a tolerance window.
 * This is a prototype; in production prefer cron jobs or external scheduler.
 */
const Medicine = require('../models/Medicine');
const Reminder = require('../models/Reminder');

function hhmmToDateToday(hhmm) {
  const [hh, mm] = hhmm.split(':').map(s => parseInt(s,10));
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
}

let running = false;
function start() {
  if (running) return;
  running = true;
  setInterval(async () => {
    try {
      const meds = await Medicine.find({});
      const now = Date.now();
      for (const m of meds) {
        if (!m.schedule || !m.schedule.length) continue;
        for (const t of m.schedule) {
          const due = hhmmToDateToday(t);
          const diff = Math.abs(due - now);
          // if due within the next minute, create a reminder if none exists
          if (diff < 60*1000) {
            const exists = await Reminder.findOne({ medicineId: m._id, scheduledTime: due });
            if (!exists) {
              await Reminder.create({ userId: m.userId, medicineId: m._id, scheduledTime: due, status: 'Pending' });
              console.log('Created reminder for', m._id, t);
            }
          }
        }
      }
    } catch(e) {
      console.error('Scheduler error', e);
    }
  }, 60*1000);
}

module.exports = { start };
