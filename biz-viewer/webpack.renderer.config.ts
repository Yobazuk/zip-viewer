import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

rules.push({
  test: /\.module\.(scss|sass)$/,
  use: [
    { loader: 'style-loader' },
    {
      loader: 'css-loader',
      options: { modules: { localIdentName: '[local]__[hash:base64:5]' } },
    },
    {
      loader: 'sass-loader',
      options: {
        implementation: require('sass'),
        sassOptions: {
          api: 'modern-compiler',
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
  ],
});

rules.push({
  test: /\.(scss|sass)$/,
  exclude: /\.module\.(scss|sass)$/,
  use: [
    { loader: 'style-loader' },
    { loader: 'css-loader' },
    {
      loader: 'sass-loader',
      options: {
        implementation: require('sass'),
        sassOptions: {
          api: 'modern-compiler',
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
  ],
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss', '.sass'],
  },
};
