// @flow

import {
  isIdentifier,
  isMemberExpression,
  isImportDefaultSpecifier,
  variableDeclaration,
  variableDeclarator,
  memberExpression,
  callExpression,
  identifier
} from 'babel-types';
import parseLiteral from 'babel-literal-to-ast';
import {parseExpression} from 'babylon';
import gql from 'graphql-tag';
import createDebug from 'debug';

const debug = createDebug('babel-plugin-graphql-tag');

// eslint-disable-next-line no-restricted-syntax
const uniqueFn = parseExpression(`
  (definitions) => {
    const names = {};
    return definitions.filter(definition => {
      if (definition.kind !== 'FragmentDefinition') {
        return true;
      }
      const name = definition.name.value;
      if (names[name]) {
        return false;
      } else {
        names[name] = true;
        return true;
      }
    });
  }
`);

const removeImports = (paths, defaultSpecifiers) => {
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const defaultSpecifier = defaultSpecifiers[i];

    if (path.node.specifiers.length === 1) {
      path.remove();
    } else {
      path.node.specifiers = path.node.specifiers.filter(
        (specifier) => {
          return specifier !== defaultSpecifier;
        }
      );
    }
  }
};

export default () => {
  const compile = (path: Object, uniqueId) => {
    const source = path.node.quasis.reduce((head, quasi) => {
      return head + quasi.value.raw;
    }, '');

    const expressions = path.get('expressions');

    expressions.forEach((expr) => {
      if (!isIdentifier(expr) && !isMemberExpression(expr)) {
        throw expr.buildCodeFrameError('Only identifiers or member expressions are allowed by this plugin as an interpolation in a graphql template literal.');
      }
    });

    debug('compiling a GraphQL query', source);

    const queryDocument = gql(source);

    // If a document contains only one operation, that operation may be unnamed:
    // https://facebook.github.io/graphql/#sec-Language.Query-Document
    if (queryDocument.definitions.length > 1) {
      for (const definition of queryDocument.definitions) {
        if (!definition.name) {
          throw new Error('GraphQL query must have name.');
        }
      }
    }

    const body = parseLiteral(queryDocument);
    let uniqueUsed = false;

    if (expressions.length) {
      const definitionsProperty = body.properties.find((property) => {
        return property.key.value === 'definitions';
      });

      const definitionsArray = definitionsProperty.value;

      const extraDefinitions = expressions.map((expr) => {
        return memberExpression(expr.node, identifier('definitions'));
      });

      const allDefinitions = callExpression(
        memberExpression(definitionsArray, identifier('concat')),
        extraDefinitions
      );

      definitionsProperty.value = callExpression(
        uniqueId,
        [allDefinitions]
      );

      uniqueUsed = true;
    }

    debug('created a static representation', body);

    return [body, uniqueUsed];
  };

  return {
    visitor: {
      Program (programPath: Object) {
        const tagNames = [];
        const uniqueId = programPath.scope.generateUidIdentifier('unique');
        let uniqueUsed = false;
        const importPaths = [];
        const importDefaultSpecifiers = [];
        let failed = false;

        programPath.traverse({
          ImportDeclaration (path: Object) {
            if (path.node.source.value === 'graphql-tag') {
              const defaultSpecifier = path.node.specifiers.find((specifier) => {
                return (
                isImportDefaultSpecifier(specifier)
                );
              });

              if (defaultSpecifier) {
                tagNames.push(defaultSpecifier.local.name);

                importPaths.push(path);
                importDefaultSpecifiers.push(defaultSpecifier);
              }
            }
          },
          TaggedTemplateExpression (path: Object) {
            if (tagNames.some((name) => {
              return isIdentifier(path.node.tag, {name});
            })) {
              try {
                debug('quasi', path.node.quasi);

                const [body, used] = compile(path.get('quasi'), uniqueId);

                uniqueUsed = uniqueUsed || used;

                path.replaceWith(body);
              } catch (error) {
                failed = true;
                // eslint-disable-next-line no-console
                console.warn('compilation skipped', error.message);
              }
            }
          }
        });

        if (!failed) {
          removeImports(importPaths, importDefaultSpecifiers);
        }
        if (uniqueUsed) {
          programPath.unshiftContainer(
            'body',
            variableDeclaration(
              'const',
              [variableDeclarator(uniqueId, uniqueFn)]
            )
          );
        }
      }
    }
  };
};
