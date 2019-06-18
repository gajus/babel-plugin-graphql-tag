# babel-plugin-graphql-tag

[![GitSpo Mentions](https://gitspo.com/badges/mentions/gajus/babel-plugin-graphql-tag?style=flat-square)](https://gitspo.com/mentions/gajus/babel-plugin-graphql-tag)
[![Travis build status](http://img.shields.io/travis/gajus/babel-plugin-graphql-tag/master.svg?style=flat-square)](https://travis-ci.org/gajus/babel-plugin-graphql-tag)
[![NPM version](http://img.shields.io/npm/v/babel-plugin-graphql-tag.svg?style=flat-square)](https://www.npmjs.org/package/babel-plugin-graphql-tag)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

Compiles GraphQL tagged template strings using [graphql-tag](https://github.com/apollographql/graphql-tag).

## Motivation

Compiling GraphQL queries at the build time:

* reduces the script initialization time; and
* removes the `graphql-tag` dependency

Removing the `graphql-tag` dependecy from the bundle saves approx. 50 KB.

## Implementation

* Searches for imports of `graphql-tag` and removes them.
* Searches for [tagged template literals](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Template_literals) with `gql` identifier and compiles them using `graphql-tag`.

## Example compilation

Input:

```js
import gql from 'graphql-tag';

const foo = gql`query {bar}`;

```

Output:

```js
const foo = {
  "definitions": [
    {
      "directives": [
      ],
      "kind": "OperationDefinition",
      "operation": "query",
      "selectionSet": {
        "kind": "SelectionSet",
        "selections": [
          {
            "alias": null,
            "arguments": [
            ],
            "directives": [
            ],
            "kind": "Field",
            "name": {
              "kind": "Name",
              "value": "bar"
            },
            "selectionSet": null
          }
        ]
      },
      "variableDefinitions": [
      ]
    }
  ],
  "kind": "Document",
  "loc": {
    "end": 11,
    "start": 0
  }
};

```

### Using fragments

Using GraphQL [fragments](http://graphql.org/learn/queries/#fragments) requires to:

1. Define a fragment using `graphql-tag`.
2. Append the referenced fragment as a variable to the end of the GraphQL query.

Example:

```js
import gql from 'graphql-tag';

const bar = gql`
  fragment barFragment on Foo {
    field1
    field2
  }
`;

const foo = gql`
  query foo {
    foo {
      ...barFragment
    }
  }

  ${bar}
`;

```

### Options

- `importName` - The name of the module import to process (default = "graphql-tag")
- `onlyMatchImportSuffix` - Matches the end of the import instead of the entire name. Useful for relative imports, e.g. `./utils/graphql` (default = false)
- `strip` - Strips insignificant characters such as whitespace from a GraphQL string literal and returns that instead of the AST object, e.g. `query foo{foo{bar baz}}` (default = false)
