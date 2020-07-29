const _unique = definitions => {
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
};

const bar = {
  "kind": "Document",
  "definitions": [{
    "kind": "FragmentDefinition",
    "name": {
      "kind": "Name",
      "value": "barFragment"
    },
    "typeCondition": {
      "kind": "NamedType",
      "name": {
        "kind": "Name",
        "value": "Foo"
      }
    },
    "directives": [],
    "selectionSet": {
      "kind": "SelectionSet",
      "selections": [{
        "kind": "Field",
        "name": {
          "kind": "Name",
          "value": "field1"
        },
        "arguments": [],
        "directives": []
      }, {
        "kind": "Field",
        "name": {
          "kind": "Name",
          "value": "field2"
        },
        "arguments": [],
        "directives": []
      }]
    }
  }],
  "loc": {
    "start": 0,
    "end": 59,
    "source": {
      "body": "\n  fragment barFragment on Foo {\n    field1\n    field2\n  }\n",
      "name": "GraphQL request",
      "locationOffset": {
        "line": 1,
        "column": 1
      }
    }
  }
};
const baz = {
  fragments: {
    foo: {
      "kind": "Document",
      "definitions": [{
        "kind": "FragmentDefinition",
        "name": {
          "kind": "Name",
          "value": "bazFragment"
        },
        "typeCondition": {
          "kind": "NamedType",
          "name": {
            "kind": "Name",
            "value": "Foo"
          }
        },
        "directives": [],
        "selectionSet": {
          "kind": "SelectionSet",
          "selections": [{
            "kind": "Field",
            "name": {
              "kind": "Name",
              "value": "field2"
            },
            "arguments": [],
            "directives": []
          }, {
            "kind": "Field",
            "name": {
              "kind": "Name",
              "value": "field3"
            },
            "arguments": [],
            "directives": []
          }]
        }
      }],
      "loc": {
        "start": 0,
        "end": 79,
        "source": {
          "body": "\n      fragment bazFragment on Foo {\n        field2\n        field3\n      }\n    ",
          "name": "GraphQL request",
          "locationOffset": {
            "line": 1,
            "column": 1
          }
        }
      }
    }
  }
};
const foo = {
  "kind": "Document",
  "definitions": _unique([{
    "kind": "OperationDefinition",
    "operation": "query",
    "name": {
      "kind": "Name",
      "value": "foo"
    },
    "variableDefinitions": [],
    "directives": [],
    "selectionSet": {
      "kind": "SelectionSet",
      "selections": [{
        "kind": "Field",
        "name": {
          "kind": "Name",
          "value": "foo"
        },
        "arguments": [],
        "directives": [],
        "selectionSet": {
          "kind": "SelectionSet",
          "selections": [{
            "kind": "FragmentSpread",
            "name": {
              "kind": "Name",
              "value": "barFragment"
            },
            "directives": []
          }, {
            "kind": "FragmentSpread",
            "name": {
              "kind": "Name",
              "value": "bazFragment"
            },
            "directives": []
          }]
        }
      }]
    }
  }].concat(bar.definitions, baz.fragments.foo.definitions)),
  "loc": {
    "start": 0,
    "end": 84,
    "source": {
      "body": "\n  query foo {\n    foo {\n      ...barFragment\n      ...bazFragment\n    }\n  }\n\n  \n  \n",
      "name": "GraphQL request",
      "locationOffset": {
        "line": 1,
        "column": 1
      }
    }
  }
};
