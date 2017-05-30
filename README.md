# babel-plugin-graphql-tag

[![Travis build status](http://img.shields.io/travis/gajus/babel-plugin-graphql-tag/master.svg?style=flat-square)](https://travis-ci.org/gajus/babel-plugin-graphql-tag)
[![NPM version](http://img.shields.io/npm/v/babel-plugin-graphql-tag.svg?style=flat-square)](https://www.npmjs.org/package/babel-plugin-graphql-tag)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

Compiles GraphQL tagged template strings using [graphql-tag](https://github.com/apollographql/graphql-tag).

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

## Implementation

* Searches for imports of `graphql-tag` and removes them.
* Searches for [tagged template literals](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Template_literals) with `gql` identifier and compiles them using `graphql-tag`.
