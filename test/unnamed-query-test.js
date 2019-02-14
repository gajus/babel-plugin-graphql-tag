import { transform } from '@babel/core';
import assert from 'assert';

const fixture = `
  import gql from 'graphql-tag';
  gql\`type Widget { name: String } query {widget}\`;
`;

describe('When given an unnamed query', () => {
  let originalError;

  before(function() {
    originalError = console.error;
  });

  after(function() {
    console.error = originalError;
  });

  it('fails when there are other definitions', () => {
    const calls = [];

    console.error = (...args) => calls.push(args.join(' '));

    transform(fixture, {
      plugins: [['./src']],
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0], 'error Error: GraphQL query must have name.');
  });
});
