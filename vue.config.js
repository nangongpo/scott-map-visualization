'use strict'
const path = require('path')
const project = require('./project')
const GitRevisionPlugin = require('git-revision-webpack-plugin')
const gitRevisionPlugin = new GitRevisionPlugin()

function resolve(dir) {
  return path.join(__dirname, dir)
}

process.env.VUE_APP_PROJECT = JSON.stringify(project)
process.env.VUE_APP_PREFIX_PATH = project.prefixPath

module.exports = {
  publicPath: project.publicPath,
  outputDir: project.outputDir,
  assetsDir: project.assetsDir,
  indexPath: 'index.html',
  filenameHashing: false,
  lintOnSave: !project.isProd,
  productionSourceMap: false,
  devServer: {
    disableHostCheck: true,
    host: '0.0.0.0',
    port: 8080,
    open: true,
    overlay: {
      warnings: false,
      errors: true
    }
    // proxy: {
    //   '/': {
    //     target: '',
    //     changeOrigin: true
    //   }
    // }
  },
  configureWebpack: config => {
    if (project.isProd) {
      // 配置删除 console.log
      // config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true
      config.plugins.push(gitRevisionPlugin)
    }
  },
  chainWebpack: config => {
    // 设置目录别名
    // config.resolve.alias
    //   .set('components', resolve('src/components'))
    //   .set('utils', resolve('src/utils'))
    //   .set('views', resolve('src/views'))
    //   .set('assets', resolve('src/assets'))
    //   .set('styles', resolve('src/styles'))

    // preload —— 用来指定页面加载后很快会被用到的资源, 提高首屏加载速度
    config.plugin('preload').tap(() => [
      {
        rel: 'preload',
        // to ignore runtime.js
        // https://github.com/vuejs/vue-cli/blob/dev/packages/@vue/cli-service/lib/config/app.js#L171
        fileBlacklist: [/\.map$/, /hot-update\.js$/, /runtime\..*\.js$/],
        include: 'initial'
      }
    ])
    // prefetch —— 用来告诉浏览器在页面加载完成后，利用空闲时间提前获取用户未来可能会访问的内容
    config.plugins.delete('prefetch')

    // HtmlWebpackPlugin插件
    config
      .plugin('html')
      .tap(args => {
        args[0].title = project.title || args[0].title
        return args
      })

    // CopyWebpackPlugin插件
    config
      .plugin('copy')
      .tap(args => {
        // 忽略文件夹
        args[0][0].ignore.push('**/*/**')
        // public下所有的文件夹复制到static下
        args[0].push({
          from: resolve('public'),
          to: resolve(`${project.outputDir}/${project.assetsDir}`),
          toType: 'dir',
          ignore: ['.ico', 'index.html']
        })
        return args
      })

    // 调整内联文件的大小限制为10kb
    config.module
      .rule('images')
      .use('url-loader')
      .loader('url-loader')
      .tap(options => Object.assign(options, { limit: 10240 }))

    // 去除元素和元素之间的空格，减少文件体积
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        options.compilerOptions.preserveWhitespace = true
        return options
      })
      .end()

    // 配置成功后，调试窗口中源码位置的webpack://根目录下会多出一个src文件夹，里面就有所有的源码了
    config
      // https://webpack.js.org/configuration/devtool/#development
      .when(process.env.NODE_ENV === 'development',
        config => config.devtool('cheap-source-map')
      )
  }
}
