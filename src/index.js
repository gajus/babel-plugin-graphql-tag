// @flow

import {types} from '@babel/core';
import {declare} from '@babel/helper-plugin-utils';
import {parseExpression} from '@babel/parser';
import parseLiteral from 'babel-literal-to-ast';
import gql from 'graphql-tag';
import createDebug from 'debug';
import { stripIgnoredCharacters } from 'graphql';

const debug = createDebug('babel-plugin-graphql-tag');
const {
  cloneDeep,
  isIdentifier,
  isMemberExpression,
  isImportDefaultSpecifier,
  variableDeclaration,
  variableDeclarator,
  memberExpression,
  callExpression,
  identifier
} = types;

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

export default declare((api, options) => {
  api.assertVersion(7);
  const {
    importName = 'graphql-tag',
    onlyMatchImportSuffix = false,
    strip = false
  } = options;

  const compile = (path: Object, uniqueId) => {
    const source = path.node.quasis.reduce((head, quasi) => {
      return head + quasi.value.raw;
    }, '');

    const expressions = path.get('expressions');

    expressions.forEach((expr) => {
      if (!isIdentifier(expr) && !isMemberExpression(expr)) {
        throw expr.buildCodeFrameError(
          'Only identifiers or member expressions are allowed by this plugin as an interpolation in a graphql template literal.',
        );
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

    const body = parseLiteral(strip ? stripIgnoredCharacters(source) : queryDocument);
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
        extraDefinitions,
      );

      definitionsProperty.value = callExpression(uniqueId, [allDefinitions]);

      uniqueUsed = true;
    }

    debug('created a static representation', body);

    return [body, uniqueUsed];
  };

  return {
    visitor: {
      Program (programPath: Object) {
        const tagNames = [];
        const pendingDeletion = [];
        const uniqueId = programPath.scope.generateUidIdentifier('unique');
        let uniqueUsed = false;
        let hasError = false;

        programPath.traverse({
          ImportDeclaration (path: Object) {
            const pathValue = path.node.source.value;
            if (onlyMatchImportSuffix ? pathValue.endsWith(importName) : pathValue === importName) {
              const defaultSpecifier = path.node.specifiers.find((specifier) => {
                return isImportDefaultSpecifier(specifier);
              });

              if (defaultSpecifier) {
                tagNames.push(defaultSpecifier.local.name);
                pendingDeletion.push({
                  defaultSpecifier,
                  path
                });
              }
            }
          },
          TaggedTemplateExpression (path: Object) {
            if (
              tagNames.some((name) => {
                return isIdentifier(path.node.tag, {name});
              })
            ) {
              try {
                debug('quasi', path.node.quasi);

                const [body, used] = compile(path.get('quasi'), uniqueId);

                uniqueUsed = uniqueUsed || used;

                path.replaceWith(body);
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('error', error);
                hasError = true;
              }
            }
          }
        });

        // Only delete import statement or specifier when there is no error
        if (!hasError) {
          for (const {defaultSpecifier, path: pathForDeletion} of pendingDeletion) {
            if (pathForDeletion.node.specifiers.length === 1) {
              pathForDeletion.remove();
            } else {
              pathForDeletion.node.specifiers = pathForDeletion.node.specifiers.filter((specifier) => {
                return specifier !== defaultSpecifier;
              });
            }
          }
        }

        if (uniqueUsed) {
          programPath.unshiftContainer(
            'body',
            variableDeclaration('const', [variableDeclarator(uniqueId, cloneDeep(uniqueFn))]),
          );
        }
      }
    }
  };
});
