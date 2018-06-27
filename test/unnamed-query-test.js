import { transform } from 'babel-core';
import assert from 'assert';

const fixture = `
  import gql from 'graphql-tag';
  gql\`type Widget { name: String } query {widget}\`;
`;

describe("When given an unnamed query", () => {
  let originalWarn;

  before(function() {
    originalWarn = console.warn;
  });

  after(function() {
    console.warn = originalWarn;
  });

  it('fails when there are other definitions', () => {
    const calls = [];

    console.warn = (...args) => calls.push(args.join(' '));

    transform(fixture, {
      plugins: [['./src']]
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0], 'compilation skipped GraphQL query must have name.');
  });
});
