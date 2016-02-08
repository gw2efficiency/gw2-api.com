const chalk = require('chalk')

function info (string) {
  console.log(chalk.gray(prefix() + string))
}

function success (string) {
  console.log(chalk.green(prefix() + string))
}

function error (string) {
  console.log(chalk.bold.red(prefix() + string))
}

function prefix () {
  let date = new Date()
  let leadingZero = x => x > 9 ? x : '0' + x

  let month = leadingZero(date.getMonth() + 1)
  let day = leadingZero(date.getDate())
  let hours = leadingZero(date.getHours())
  let minutes = leadingZero(date.getMinutes())

  return '[' + day + '/' + month + ' ' + hours + ':' + minutes + '] '
}

module.exports = {info, success, error}
