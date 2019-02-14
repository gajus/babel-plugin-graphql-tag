module.exports = {
  presets: [
    [
      '@babel/env',
      {
        targets: {
          node: 8,
        },
      },
    ],
    '@babel/flow',
  ],
};
