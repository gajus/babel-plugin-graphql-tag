// @flow

import {
  isIdentifier,
  TemplateLiteral
} from 'babel-types';
import {
  parse
} from 'babylon';
import gql from 'graphql-tag';

export default () => {
  const compile = (node: TemplateLiteral) => {
    const source = node.quasis.reduce((head, quasi) => {
      return head + quasi.value.raw;
    }, '');

    const queryDocument = gql(source);

    for (const definition of queryDocument.definitions) {
      if (!definition.name) {
        // eslint-disable-next-line no-console
        console.error('query', source);

        throw new Error('GraphQL query must have name.');
      }
    }

    return parse(JSON.stringify([queryDocument])).program.body[0].expression.elements[0];
  };

  return {
    visitor: {
      ImportDeclaration (path: Object) {
        if (path.node.source.value === 'graphql-tag') {
          path.remove();
        }
      },
      TaggedTemplateExpression (path: Object) {
        if (isIdentifier(path.node.tag, {
          name: 'gql'
        })) {
          path.replaceWith(
            compile(path.node.quasi)
          );
        }
      }
    }
  };
};
