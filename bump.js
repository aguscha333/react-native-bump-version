#!/usr/bin/env node

const fs = require('fs')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const semver = require('semver')

const configMap = new Map([
  ['androidPath', './android/app/build.gradle'],
  ['iosPath', './ios/MyApp/Info.plist'],
])

const IOS_VERSION_NUMBER_REGEX = /<key>CFBundleShortVersionString<\/key>\n\s+<string>(.+)<\/string>/m
const IOS_BUILD_NUMBER_REGEX = /<key>CFBundleVersion<\/key>\n\s+<string>(.+)<\/string>/m

function getAndroidVersionNameRegex(env) {
  return new RegExp(`versionName "([.|\\d]+)" // ${env}`)
}

function getAndroidVersionCodeRegex(env) {
  return new RegExp(`versionCode \\d+ // ${env}`)
}

function getAndroidVersionName(env) {
  const file = fs.readFileSync(configMap.get('androidPath'), 'utf8')
  const [currentLine] = file.match(getAndroidVersionNameRegex(env))
  console.log(currentLine)
  const [current] = currentLine.match(/[.|\d]+/)
  return current
}

function getAndroidVersionCode(env) {
  const file = fs.readFileSync(configMap.get('androidPath'), 'utf8')
  const [currentLine] = file.match(getAndroidVersionCodeRegex(env))
  const [current] = currentLine.match(/\d+/)
  return parseInt(current, 0)
}

function getIosVersion() {
  const file = fs.readFileSync(configMap.get('iosPath'), 'utf8')
  const [, current] = file.match(IOS_VERSION_NUMBER_REGEX)
  return current
}
function getIosBuild() {
  const file = fs.readFileSync(configMap.get('iosPath'), 'utf8')
  const [, current] = file.match(IOS_BUILD_NUMBER_REGEX)
  return parseInt(current, 0)
}

function android(env, next, type) {
  const current = getAndroidVersionName(env)
  const nextVersion = next || semver.inc(current, type)

  const currentVersionCode = getAndroidVersionCode(env)
  const nextVersionCode = currentVersionCode + 1

  const file = fs.readFileSync(configMap.get('androidPath'), 'utf8')
  let updated = file.replace(
    getAndroidVersionNameRegex(env),
    `versionName "${nextVersion}" // ${env}`,
  )
  updated = updated.replace(
    getAndroidVersionCodeRegex(env),
    `versionCode ${nextVersionCode} // ${env}`,
  )
  fs.writeFileSync(configMap.get('androidPath'), updated, 'utf8')

  // eslint-disable-next-line no-console
  console.log(`Android SUCCESS! new version is ${nextVersion} with version code ${nextVersionCode}`)
}

function ios(next, type) {
  const current = getIosVersion()
  const nextVersion = next || semver.inc(current, type)

  const currentBuild = getIosBuild()
  const nextBuild = current === nextVersion ? currentBuild + 1 : 1

  const file = fs.readFileSync(configMap.get('iosPath'), 'utf8')
  let updated = file.replace(
    IOS_VERSION_NUMBER_REGEX,
    `<key>CFBundleShortVersionString</key>\n  <string>${nextVersion}</string>`,
  )
  updated = updated.replace(
    IOS_BUILD_NUMBER_REGEX,
    `<key>CFBundleVersion</key>\n  <string>${nextBuild}</string>`,
  )
  fs.writeFileSync(configMap.get('iosPath'), updated, 'utf8')

  // eslint-disable-next-line no-console
  console.log(`iOS SUCCESS! new version is ${nextVersion} with build number ${nextBuild}`)
}

function configure(env, configFilePath = `${process.cwd()}/rnbv.config.js`) {
  if (fs.existsSync(configFilePath)) {
    // eslint-disable-next-line import/no-dynamic-require
    const config = require(`${process.cwd()}/rnbv.config.js`)
    // eslint-disable-next-line no-restricted-syntax
    for (const key of configMap.keys()) {
      if (config[`${key}-${env}`] || config[key]) {
        configMap.set(key, config[`${key}-${env}`] || config[key])
      }
    }
  }
}

function run() {
  const { ENV, next, type } = yargs(hideBin(process.argv)).argv

  configure(ENV)

  android(ENV, next, type)
  ios(next, type)
}

run()

module.exports = {
  run,
  configure,
}
