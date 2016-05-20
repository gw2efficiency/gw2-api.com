// This process just handles the scheduling of background jobs.
// It pushes the tasks into a priority queue to be picked up by the worker processes.

const createJob = require('../helpers/createJob.js')
const jobList = require('../config/jobs.js')

jobList
  .filter(job => job.schedule)
  .map(job => createJob(job))

module.exports = jobList
