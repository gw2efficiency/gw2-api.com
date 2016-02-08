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
  var date = new Date()
  let leadingZero = x => x > 9 ? x : '0' + x

  var month = leadingZero(date.getMonth() + 1)
  var day = leadingZero(date.getDate())
  var hours = leadingZero(date.getHours())
  var minutes = leadingZero(date.getMinutes())

  return '[' + day + '/' + month + ' ' + hours + ':' + minutes + '] '
}

module.exports = {info, success, error}
