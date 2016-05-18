const chalk = require('chalk')

function info (string) {
  print(chalk.gray(prefix() + string))
}

function success (string) {
  print(chalk.green(prefix() + string))
}

function error (string) {
  print(chalk.bold.red(prefix() + string))
}

let silenced = false

function print (string) {
  if (!silenced) {
    console.log(string)
  }
}

function quiet (bool) {
  silenced = bool
}

function prefix () {
  let date = new Date()
  let leadingZero = x => x > 9 ? x : `0${x}`

  let month = leadingZero(date.getUTCMonth() + 1)
  let day = leadingZero(date.getUTCDate())
  let hours = leadingZero(date.getUTCHours())
  let minutes = leadingZero(date.getUTCMinutes())

  return `[${day}/${month} ${hours}:${minutes}] `
}

module.exports = {info, success, error, quiet}
