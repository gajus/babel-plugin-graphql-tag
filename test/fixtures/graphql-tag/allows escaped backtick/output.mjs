const foo = {
  "kind": "Document",
  "definitions": [{
    "kind": "ObjectTypeDefinition",
    "description": {
      "kind": "StringValue",
      "value": "This is a comment with an `escaped backtick`.",
      "block": true
    },
    "name": {
      "kind": "Name",
      "value": "Foo"
    },
    "interfaces": [],
    "directives": [],
    "fields": [{
      "kind": "FieldDefinition",
      "name": {
        "kind": "Name",
        "value": "bar"
      },
      "arguments": [],
      "type": {
        "kind": "NamedType",
        "name": {
          "kind": "Name",
          "value": "String"
        }
      },
      "directives": [{
        "kind": "Directive",
        "name": {
          "kind": "Name",
          "value": "deprecated"
        },
        "arguments": [{
          "kind": "Argument",
          "name": {
            "kind": "Name",
            "value": "reason"
          },
          "value": {
            "kind": "StringValue",
            "value": "Use `derivedDetails.approvalLikelihood`",
            "block": false
          }
        }]
      }]
    }]
  }],
  "loc": {
    "start": 0,
    "end": 157,
    "source": {
      "body": "\n  \"\"\"\n  This is a comment with an `escaped backtick`.\n  \"\"\"\n  type Foo {\n    bar: String @deprecated(reason: \"Use `derivedDetails.approvalLikelihood`\")\n  }\n",
      "name": "GraphQL request",
      "locationOffset": {
        "line": 1,
        "column": 1
      }
    }
  }
};
