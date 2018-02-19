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
        'selectionSet': null
      }]
    }
  }],
  'loc': {
    'start': 0,
    'end': 15,
    'source': {
      'body': 'query foo {foo}',
      'name': 'GraphQL request',
      'locationOffset': {
        'line': 1,
        'column': 1
      }
    }
  }
};
const bar = {
  'kind': 'Document',
  'definitions': [{
    'kind': 'OperationDefinition',
    'operation': 'query',
    'name': {
      'kind': 'Name',
      'value': 'bar'
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
          'value': 'bar'
        },
        'arguments': [],
        'directives': [],
        'selectionSet': null
      }]
    }
  }],
  'loc': {
    'start': 0,
    'end': 15,
    'source': {
      'body': 'query bar {bar}',
      'name': 'GraphQL request',
      'locationOffset': {
        'line': 1,
        'column': 1
      }
    }
  }
};
