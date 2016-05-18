require('babel-polyfill')
const kue = require('../helpers/kue.js')
const queue = kue.createQueue()
const mongo = require('../helpers/mongo.js')
const wrapJob = require('../helpers/wrapJob.js')
const jobList = require('../config/jobs.js')

mongo.connect().then(() => {
  jobList.map(job => {
    let jobFunction = require(job.path)
    queue.process(job.name, wrapJob(jobFunction))
  })

  console.log(`${jobList.length} jobs loaded, waiting for queued entries`)
})
