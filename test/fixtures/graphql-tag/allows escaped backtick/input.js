import { gql } from 'graphql-tag';

const foo = gql`
  """
  This is a comment with an \`escaped backtick\`.
  """
  type Foo {
    bar: String @deprecated(reason: "Use \`derivedDetails.approvalLikelihood\`")
  }
`;
