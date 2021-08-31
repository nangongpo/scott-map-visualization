const isProd = process.env.NODE_ENV === 'production'
const packageJSON = require('./package.json')
const publicPath = './'
const outputDir = 'dist'
const assetsDir = 'static'

const project = {
  title: '大货车管控-可视化',
  name: 'scott-map-visualization',
  publicPath,
  outputDir,
  assetsDir,
  prefixPath: isProd ? `${publicPath}${assetsDir}` : '',
  version: packageJSON.version
}

module.exports = project
