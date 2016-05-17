require('babel-polyfill')
const commander = require('commander')
const mongo = require('../helpers/mongo.js')
const createJob = require('../helpers/createJob.js')
const chalk = require('chalk')
const jobList = require('../config/jobs.js')

// Fire off the cli
let jobName = false
commander
  .arguments('<job>')
  .option('-q, --queue', 'Queue the job (by default jobs get executed directly)')
  .action((job) => jobName = job)
  .parse(process.argv)

// Check if the job name is valid
let jobNames = jobList.map(j => j.name)
if (!jobName || jobNames.indexOf(jobName) === -1) {
  jobNames = jobNames.map(j => '  - ' + j).join('\n')
  console.log(chalk.bold.red('You have to specify a valid job name:\n' + jobNames))
  process.exit()
}

let job = jobList.find(j => j.name === jobName)
let verb = commander.queue ? 'Queueing' : 'Executing'
console.log(chalk.green(`${verb} job "${job.data.title}" [${job.name}]`))

// Mock the "done" functionality that jobs expect and
// log all results or errors out to the user
function doneMock (err, result) {
  if (err) {
    console.log(chalk.bold.red('An error occurred in the job:\n' + err))
    process.exit()
  }

  let output = result
    ? 'Job finished successfully:\n' + result
    : 'Job finished successfully'
  console.log(chalk.green(output))
  process.exit()
}

// Queue the job and wait for it to be processed by the workers
if (commander.queue) {
  createJob({
    name: job.name,
    data: {title: '[CLI] ' + job.data.title},
    priority: 'high',
    callback: doneMock
  })

  console.log(chalk.gray('Waiting till the queued job gets processed...'))
}

// Execute the job in this process
if (!commander.queue) {
  const jobFunction = require(job.path)
  let jobMock = {log: console.log}

  mongo.connect().then(() => {
    jobFunction(jobMock, doneMock)
      .catch(err => console.log(chalk.bold.red('An error occurred in the job:\n' + err)))
  })
}
