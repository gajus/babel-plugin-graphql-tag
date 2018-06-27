import gql from 'graphql-tag';

const test = () => {
  return '{ bar }';
};

const foo = gql`query foo {foo ${test()} }`;
