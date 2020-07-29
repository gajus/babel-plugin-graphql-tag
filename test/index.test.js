const path = require('path');
const runner = require("@babel/helper-transform-fixture-test-runner").default;

runner(
  __dirname + "/fixtures",
  path.basename(path.dirname(__dirname)),
  {},
  { sourceType: 'module' },
);
