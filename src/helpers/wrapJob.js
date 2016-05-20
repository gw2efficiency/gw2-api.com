function wrapJob (callback) {
  if (!callback) {
    console.error(`Callback is missing for wrapping job!`)
    return
  }

  // Overwrite the job logging function to include timings,
  // log to the console as well and catch all errors in the promise
  return (job, done) => {
    const start = new Date()
    job.___logger = job.log

    job.log = (string) => {
      let difference = new Date() - start
      let text = `${string} (+${difference}ms)`
      job.___logger(text)
      console.log(text)
    }

    const doneLog = (x, y) => {
      let time = (new Date()).toISOString()
      console.log(`[${time}] Completed job "${job.data.title}" [${job.id}]`)
      done(x, y)
    }

    let time = (new Date()).toISOString()
    console.log(`[${time}] Starting job "${job.data.title}" [${job.id}]`)

    callback(job, doneLog)
      .catch((err) => {
        console.log(`[${time}] Error in job "${job.data.title}"`, err)
        done(err)
      })
  }
}

module.exports = wrapJob
