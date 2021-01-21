/* eslint-disable prefer-exponentiation-operator */
// @flow

import {types} from '@babel/core';
import {declare} from '@babel/helper-plugin-utils';
import {parseExpression} from '@babel/parser';
import parseLiteral from 'babel-literal-to-ast';
import gql from 'graphql-tag';
import createDebug from 'debug';
import {stripIgnoredCharacters} from 'graphql';

const debug = createDebug('babel-plugin-graphql-tag');
const {
  cloneDeep,
  isIdentifier,
  isMemberExpression,
  isImportSpecifier,
  isImportDefaultSpecifier,
  variableDeclaration,
  variableDeclarator,
  memberExpression,
  callExpression,
  identifier,
  isObjectPattern,
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
    importSources = ['graphql-tag', '@apollo/client'],
    gqlTagIdentifiers = ['gql'],
    onlyMatchImportSuffix = false,
    strip = false,
  } = options;

  const gqlTagIdentifiersSet = new Set(gqlTagIdentifiers);

  const compile = (path: Object, uniqueId) => {
    // eslint-disable-next-line unicorn/no-reduce
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
    const finalSource = strip ? stripIgnoredCharacters(source) : source;
    let queryDocument = gql(strip ? stripIgnoredCharacters(finalSource) : finalSource);

    // If a document contains only one operation, that operation may be unnamed:
    // https://facebook.github.io/graphql/#sec-Language.Query-Document
    if (queryDocument.definitions.length > 1) {
      for (const definition of queryDocument.definitions) {
        if (!definition.name) {
          throw new Error('GraphQL query must have name.');
        }
      }
    }

    if (options.transform && options.transform) {
      queryDocument = options.transform(finalSource, queryDocument);
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
          CallExpression: {
            enter (nodePath) {
              const callee = nodePath.get('callee');
              const {arguments: args} = nodePath.node;

              if (callee.isIdentifier() && callee.equals('name', 'require')) {
                const [{value: pathValue}] = args;
                if (importSources.some((source) => {
                  return onlyMatchImportSuffix ? pathValue.endsWith(source) : pathValue === source;
                })) {
                  if (nodePath.parentPath.isVariableDeclarator()) {
                    const gqlDeclaration = nodePath.parentPath.parent.declarations[0];

                    if (isObjectPattern(gqlDeclaration.id)) {
                      const gqlProperty = gqlDeclaration.id.properties.find((property) => {
                        return gqlTagIdentifiersSet.has(property.key.name);
                      });
                      tagNames.push(gqlProperty.key.name);

                      if (gqlDeclaration.id.properties.length === 1) {
                        pendingDeletion.push({
                          defaultSpecifier: null,
                          path: nodePath.parentPath,
                        });
                      }

                      gqlDeclaration.id.properties = gqlDeclaration.id.properties.filter((property) => {
                        return !gqlTagIdentifiersSet.has(property.key.name);
                      });

                      return;
                    }

                    tagNames.push(gqlDeclaration.id.name);
                    pendingDeletion.push({
                      defaultSpecifier: null,
                      path: nodePath.parentPath,
                    });
                  }
                }
              }
            },
          },
          ImportDeclaration (path: Object) {
            const pathValue = path.node.source.value;
            const gqlSpecifier = path.node.specifiers.find((specifier) => {
              if (isImportSpecifier(specifier)) {
                return gqlTagIdentifiersSet.has(specifier.local.name);
              }

              if (isImportDefaultSpecifier(specifier)) {
                return importSources.some((source) => {
                  return onlyMatchImportSuffix ? pathValue.endsWith(source) : pathValue === source;
                });
              }

              return null;
            });

            if (gqlSpecifier) {
              tagNames.push(gqlSpecifier.local.name);
              pendingDeletion.push({
                defaultSpecifier: gqlSpecifier,
                path,
              });
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

                path.replaceWith(cloneDeep(body));
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('error', error);
                hasError = true;
              }
            }
          },
        });

        // Only delete import statement or specifier when there is no error
        if (!hasError) {
          for (const {defaultSpecifier, path: pathForDeletion} of pendingDeletion) {
            if (defaultSpecifier === null) {
              pathForDeletion.remove();
              continue;
            }
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
      },
    },
  };
});
