# babel-plugin-graphql-tag

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

### With fragments

Input:

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

Output:

```js
const bar = {
  'kind': 'Document',
  'definitions': [{
    'kind': 'FragmentDefinition',
    'name': {
      'kind': 'Name',
      'value': 'barFragment'
    },
    'typeCondition': {
      'kind': 'NamedType',
      'name': {
        'kind': 'Name',
        'value': 'Foo'
      }
    },
    'directives': [],
    'selectionSet': {
      'kind': 'SelectionSet',
      'selections': [{
        'kind': 'Field',
        'alias': null,
        'name': {
          'kind': 'Name',
          'value': 'field1'
        },
        'arguments': [],
        'directives': [],
        'selectionSet': null
      }, {
        'kind': 'Field',
        'alias': null,
        'name': {
          'kind': 'Name',
          'value': 'field2'
        },
        'arguments': [],
        'directives': [],
        'selectionSet': null
      }]
    }
  }],
  'loc': {
    'start': 0,
    'end': 59,
    'source': {
      'body': '\n  fragment barFragment on Foo {\n    field1\n    field2\n  }\n',
      'name': 'GraphQL request',
      'locationOffset': {
        'line': 1,
        'column': 1
      }
    }
  }
};

const foo = {
  'kind': 'Document',
  'definitions': [{
    'kind': 'OperationDefinition',
    'operation': 'query',
    'name': {
      'kind': 'Name',
      'value': 'foo'
    },
    'variableDefinitions': [],
    'directives': [],
    'selectionSet': {
      'kind': 'SelectionSet',
      'selections': [{
        'kind': 'Field',
        'alias': null,
        'name': {
          'kind': 'Name',
          'value': 'foo'
        },
        'arguments': [],
        'directives': [],
        'selectionSet': {
          'kind': 'SelectionSet',
          'selections': [{
            'kind': 'FragmentSpread',
            'name': {
              'kind': 'Name',
              'value': 'barFragment'
            },
            'directives': []
          }]
        }
      }]
    }
  }].concat(bar.definitions),
  'loc': {
    'start': 0,
    'end': 60,
    'source': {
      'body': '\n  query foo {\n    foo {\n      ...barFragment\n    }\n  }\n\n  \n',
      'name': 'GraphQL request',
      'locationOffset': {
        'line': 1,
        'column': 1
      }
    }
  }
};
```
