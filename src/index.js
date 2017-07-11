// @flow

import {
  isIdentifier,
  TemplateLiteral
} from 'babel-types';
import {
  parse
} from 'babylon';
import gql from 'graphql-tag';
import createDebug from 'debug';

const debug = createDebug('babel-plugin-graphql-tag');

export default () => {
  const compile = (node: TemplateLiteral) => {
    const source = node.quasis.reduce((head, quasi) => {
      return head + quasi.value.raw;
    }, '');

    debug('compiling a GraphQL query', source);

    const queryDocument = gql(source);

    for (const definition of queryDocument.definitions) {
      if (!definition.name) {
        throw new Error('GraphQL query must have name.');
      }
    }

    const body = parse(JSON.stringify([queryDocument])).program.body[0].expression.elements[0];

    debug('created a static representation', body);

    return body;
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
          try {
            debug('quasi', path.node.quasi);

            const body = compile(path.node.quasi);

            path.replaceWith(body);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('error', error);
          }
        }
      }
    }
  };
};
