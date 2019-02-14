const foo = {
  'kind': 'Document',
  'definitions': [{
    'kind': 'OperationDefinition',
    'operation': 'query',
    'name': null,
    'variableDefinitions': null,
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
    'end': 5,
    'source': {
      'body': '{foo}',
      'name': 'GraphQL request',
      'locationOffset': {
        'line': 1,
        'column': 1
      }
    }
  }
};
