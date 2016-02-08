const chalk = require('chalk')

class AbstractWorker {
  constructor (api, cache) {
    this.api = api
    this.cache = cache
  }

  // Schedule a worker function to run every X seconds
  schedule (callback, seconds) {
    return setInterval(() => this.execute(callback), seconds * 1000)
  }

  // Wrap a worker function in logging / error handling and execute it
  async execute (callback) {
    let description = this.constructor.name + ' > ' + callback.name
    let task = this.logTask(description)
    try {
      await callback.call(this)
      task.done()
    } catch (e) {
      task.error(e.message)
    }
  }

  // Log start, success and error messages for a task
  logTask (description) {
    this.logInfo('Starting task: ' + description)
    let start = new Date()
    return {
      done: () => {
        let ms = new Date() - start
        this.logSuccess('Finished task: ' + description + ' [' + ms + 'ms]')
      },
      error: (message) => {
        let ms = new Date() - start
        this.logError('Failed task: ' + description + ' ' + message + ' [' + ms + 'ms]')
      }
    }
  }

  logInfo (string) {
    console.log(chalk.gray(string))
  }

  logSuccess (string) {
    console.log(chalk.green(string))
  }

  logError (string) {
    console.log(chalk.bold.red(string))
  }
}

module.exports = AbstractWorker
