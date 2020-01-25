import { withUnimodules } from '@expo/webpack-config/addons'
import { getModuleFileExtensions } from '@expo/webpack-config/env'

// Temporary until better api is provided to get/customize expo js loader
// See https://github.com/expo/examples/pull/39#discussion_r367702217
const getExpoJsLoader = config => {
  const {
    conditionMatchesFile,
    getRules,
  } = require('@expo/webpack-config/utils')
  const { resolve, join } = require('path')
  const rules = getRules(config)
  const jsLoaders = rules.filter(
    ({ rule }) =>
      rule.test &&
      conditionMatchesFile(rule, resolve(join(__dirname, '../..', 'foo.js')))
  )
  // expo js loader is normally last added js loader (fragile but works)
  const expoJsLoader = jsLoaders[jsLoaders.length - 1]
  // console.log("expoJsLoader",JSON.stringify(expoJsLoader,null,2));
  return expoJsLoader
}

const customizeExpoJsLoader = config => {
  const expoJsLoader = getExpoJsLoader(config)

  expoJsLoader.rule.use.options.plugins =
    expoJsLoader.rule.use.options.plugins || []

  // We need to add the gatsby static queries babel plugin to expo js loader
  // otherwise gatsby will complain
  // see https://github.com/slorber/gatsby-plugin-react-native-web/issues/23
  expoJsLoader.rule.use.options.plugins.push([
    'babel-plugin-remove-graphql-queries',
    {},
    'babel-plugin-remove-graphql-queries-for-expo-js-loader',
  ])

  return config;
}

const resolvableExtensions = () => getModuleFileExtensions('web')

function onCreateBabelConfig({ actions }, options) {
  actions.setBabelPreset({
    name: require.resolve(`babel-preset-expo`),
    options,
  })
}

function onCreateWebpackConfig({ actions, getConfig }) {
  const gatsbyConfig = getConfig()
  if (!gatsbyConfig.context) {
    throw new Error('Expected Gatsby config to provide the root context')
  }

  let config
  try {
    config = customizeExpoJsLoader(withUnimodules(gatsbyConfig))
  } catch (error) {
    console.error(error)
    process.exit(1)
  }

  actions.replaceWebpackConfig(config)
}

exports.resolvableExtensions = resolvableExtensions
exports.onCreateBabelConfig = onCreateBabelConfig
exports.onCreateWebpackConfig = onCreateWebpackConfig
