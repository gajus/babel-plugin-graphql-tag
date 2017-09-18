import gql from 'graphql-tag';

const bar = gql`
  fragment barFragment on Foo {
    field1
    field2
  }
`;

const baz = {
  fragments: {
    foo: gql`
      fragment bazFragment on Foo {
        field2
        field3
      }
    `
  }
};

const foo = gql`
  query foo {
    foo {
      ...barFragment
      ...bazFragment
    }
  }

  ${bar}
  ${baz.fragments.foo}
`;
