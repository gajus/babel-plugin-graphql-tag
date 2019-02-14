module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: 'commonjs',
        targets: {
          node: 8
        }
      }
    ],
    '@babel/preset-flow'
  ]
};
