#!/usr/bin/env node

const fs = require('fs')
const chalk = require('chalk')

const configMap = new Map([
  ['androidPath', './android/app/build.gradle'],
  ['iosPath', './ios/MyApp/Info.plist'],
])

const IOS_VERSION_NUMBER_REGEX = /\<key\>CFBundleShortVersionString\<\/key\>\n\s+\<string\>(.+)\<\/string\>/m
const IOS_BUILD_NUMBER_REGEX = /\<key\>CFBundleVersion\<\/key\>\n\s+\<string\>(.+)\<\/string\>/m

function getAndroidVersionNameRegex(env) {
  return new RegExp(`versionName "([.|\\d]+)" // ${env}`)
}

function getAndroidVersionCodeRegex(env) {
  return new RegExp(`versionCode \\d+ // ${env}`)
}

function getAndroidVersionCode(env) {
  const file = fs.readFileSync(configMap.get('androidPath'), 'utf8')
  const [currentLine] = file.match(getAndroidVersionCodeRegex(env))
  const [current] = currentLine.match(/\d+/)
  return parseInt(current)
}

function getIosVersion() {
  const file = fs.readFileSync(configMap.get('iosPath'), 'utf8')
  const [_, current] = file.match(IOS_VERSION_NUMBER_REGEX)
  return current
}
function getIosBuild() {
  const file = fs.readFileSync(configMap.get('iosPath'), 'utf8')
  const [_, current] = file.match(IOS_BUILD_NUMBER_REGEX)
  return parseInt(current)
}

function android(env, next) {
  const currentVersionCode = getAndroidVersionCode(env)
  const nextVersionCode = currentVersionCode + 1
  const file = fs.readFileSync(configMap.get('androidPath'), 'utf8')
  let updated = file.replace(getAndroidVersionNameRegex(env), `versionName "${next}" // ${env}`)
  updated = updated.replace(
    getAndroidVersionCodeRegex(env),
    `versionCode ${nextVersionCode} // ${env}`,
  )
  fs.writeFileSync(configMap.get('androidPath'), updated, 'utf8')

  console.log(
    chalk.green(`Android SUCCESS! new version is ${next} with version code ${nextVersionCode}`),
  )
}

function ios(next) {
  const currentVersion = getIosVersion()
  const currentBuild = getIosBuild()
  const nextBuild = currentVersion === next ? currentBuild + 1 : 1
  const file = fs.readFileSync(configMap.get('iosPath'), 'utf8')
  let updated = file.replace(
    IOS_VERSION_NUMBER_REGEX,
    `<key>CFBundleShortVersionString</key>\n  <string>${next}</string>`,
  )
  updated = updated.replace(
    IOS_BUILD_NUMBER_REGEX,
    `<key\>CFBundleVersion\<\/key\>\n  <string>${nextBuild}</string>`,
  )
  fs.writeFileSync(configMap.get('iosPath'), updated, 'utf8')

  console.log(chalk.green(`iOS SUCCESS! new version is ${next} with build number ${nextBuild}`))
}

function configure(env, configFilePath = `${process.cwd()}/rnbv.config.js`) {
  if (fs.existsSync(configFilePath)) {
    const config = require(`${process.cwd()}/rnbv.config.js`)
    for (key of configMap.keys()) {
      if (config[`${key}-${env}`] || config[key]) {
        configMap.set(key, config[`${key}-${env}`] || config[key])
      }
    }
  }
}

function run() {
  const [env = 'dev', version] = process.argv.filter((arg) => !arg.startsWith('/'))

  configure(env)

  android(env, version)
  ios(version)
}

module.exports = {
  run,
  configure,
}
