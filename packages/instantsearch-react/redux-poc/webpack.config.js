import { resolve as r } from 'path';
import webpack from 'webpack';

const publicPath = 'http://localhost:8080/';

export default {
  entry: [
    `webpack-dev-server/client?${publicPath}`,
    'webpack/hot/only-dev-server',
    r('src/index.js'),
  ],

  devtool: 'cheap-module-eval-source-map',

  output: {
    path: r('dist'),
    filename: 'bundle.js',
    publicPath,
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['react-hot', 'babel'],
        include: [r('src'), r('node_modules/algoliasearch-helper-provider/src')],
      },
      {
        test: /\.svg$/,
        loaders: [
          'babel',
          // https://github.com/boopathi/react-svg-loader/issues/44
          'react-svg?' + JSON.stringify({
            svgo: {
              plugins: [{ removeAttrs: { attrs: 'xmlns.*' } }],
            },
          })
        ],
        include: [r('src/impl/svg')],
      },
    ],
  },

  plugins: [
    // Don't use --hot and this at the same time
    // new webpack.HotModuleReplacementPlugin(),
  ],
};
