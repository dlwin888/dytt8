const schedule = require("node-schedule")
const task = require('./movie-list')

const SCHEDULE_RULE = '0 30 8 * * *'; //ÿ��8��30�ַ���
module.exports = function () {
  schedule.scheduleJob(SCHEDULE_RULE, task)
}