const kue = require('./kue.js')
const queue = kue.createQueue()
const schedule = require('node-schedule')

const defaultAttributes = {
  data: {},
  priority: 'medium',
  attempts: 1,
  backoff: false,
  ttl: 1000 * 60 * 60,
  callback: () => false,
  delay: false
}

// Schedule/create a job based on the attributes.schedule
function createJobWrapper (attributes) {
  if (!attributes.schedule) {
    return createJob(attributes)
  }

  console.log(`Reoccurring job scheduled: "${attributes.data.title}" [${attributes.schedule}]`)
  schedule.scheduleJob(attributes.schedule, () => createJob(attributes))
}

// Create a single job
function createJob (attributes) {
  let time = (new Date()).toISOString()
  attributes = {...defaultAttributes, ...attributes}

  let job = queue.create(attributes.name, attributes.data)
    .priority(attributes.priority)
    .attempts(attributes.attempts)
    .backoff(attributes.backoff)
    .ttl(attributes.ttl)
    .delay(attributes.delay)

  job.on('complete', (result) => attributes.callback(null, result))
  job.on('failed', (err) => attributes.callback(err, null))

  job.save((err) => {
    if (err) {
      return console.error(`[${time}] Failed queueing: "${attributes.data.title}"`, err)
    }

    console.log(`[${time}] Job queued: "${attributes.data.title}"`)
  })
}

module.exports = createJobWrapper
