'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _babelTypes = require('babel-types');

var _babelLiteralToAst = require('babel-literal-to-ast');

var _babelLiteralToAst2 = _interopRequireDefault(_babelLiteralToAst);

var _babylon = require('babylon');

var _graphqlTag = require('graphql-tag');

var _graphqlTag2 = _interopRequireDefault(_graphqlTag);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _graphql = require('graphql');

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _debug2.default)('babel-plugin-graphql-tag');

// eslint-disable-next-line no-restricted-syntax
const uniqueFn = (0, _babylon.parseExpression)(`
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

exports.default = () => {
  const compile = (path, uniqueId, opts) => {
    const source = path.node.quasis.reduce((head, quasi) => {
      return head + quasi.value.raw;
    }, '');

    const expressions = path.get('expressions');

    expressions.forEach(expr => {
      if (!(0, _babelTypes.isIdentifier)(expr) && !(0, _babelTypes.isMemberExpression)(expr)) {
        throw expr.buildCodeFrameError('Only identifiers or member expressions are allowed by this plugin as an interpolation in a graphql template literal.');
      }
    });

    debug('compiling a GraphQL query', source);

    const queryDocument = (0, _graphqlTag2.default)(source);
    if (opts && opts.generateHash) {
      // generate graphql documentId
      const hash = _crypto2.default.createHash('sha256');
      hash.update(Buffer.from((0, _graphql.print)(queryDocument)));
      // $FlowFixMe inject documentId
      queryDocument.documentId = hash.digest('base64');
    }
    // If a document contains only one operation, that operation may be unnamed:
    // https://facebook.github.io/graphql/#sec-Language.Query-Document
    if (queryDocument.definitions.length > 1) {
      for (const definition of queryDocument.definitions) {
        if (!definition.name) {
          throw new Error('GraphQL query must have name.');
        }
      }
    }

    const body = (0, _babelLiteralToAst2.default)(queryDocument);

    let uniqueUsed = false;

    if (expressions.length) {
      const definitionsProperty = body.properties.find(property => {
        return property.key.value === 'definitions';
      });

      const definitionsArray = definitionsProperty.value;

      const extraDefinitions = expressions.map(expr => {
        return (0, _babelTypes.memberExpression)(expr.node, (0, _babelTypes.identifier)('definitions'));
      });

      const allDefinitions = (0, _babelTypes.callExpression)((0, _babelTypes.memberExpression)(definitionsArray, (0, _babelTypes.identifier)('concat')), extraDefinitions);

      definitionsProperty.value = (0, _babelTypes.callExpression)(uniqueId, [allDefinitions]);

      uniqueUsed = true;
    }

    debug('created a static representation', body);

    return [body, uniqueUsed];
  };

  return {
    visitor: {
      Program(programPath, state) {
        const tagNames = [];
        const uniqueId = programPath.scope.generateUidIdentifier('unique');
        let uniqueUsed = false;

        programPath.traverse({
          ImportDeclaration(path) {
            if (path.node.source.value === 'graphql-tag') {
              const defaultSpecifier = path.node.specifiers.find(specifier => {
                return (0, _babelTypes.isImportDefaultSpecifier)(specifier);
              });

              if (defaultSpecifier) {
                tagNames.push(defaultSpecifier.local.name);

                if (path.node.specifiers.length === 1) {
                  path.remove();
                } else {
                  path.node.specifiers = path.node.specifiers.filter(specifier => {
                    return specifier !== defaultSpecifier;
                  });
                }
              }
            }
          },
          TaggedTemplateExpression(path) {
            if (tagNames.some(name => {
              return (0, _babelTypes.isIdentifier)(path.node.tag, { name });
            })) {
              try {
                debug('quasi', path.node.quasi);

                var _compile = compile(path.get('quasi'), uniqueId, state.opts),
                    _compile2 = _slicedToArray(_compile, 2);

                const body = _compile2[0],
                      used = _compile2[1];


                uniqueUsed = uniqueUsed || used;

                path.replaceWith(body);
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('error', error);
              }
            }
          }
        });

        if (uniqueUsed) {
          programPath.unshiftContainer('body', (0, _babelTypes.variableDeclaration)('const', [(0, _babelTypes.variableDeclarator)(uniqueId, uniqueFn)]));
        }
      }
    }
  };
};
//# sourceMappingURL=index.js.map