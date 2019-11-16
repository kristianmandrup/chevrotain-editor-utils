# Syntax Generator

Given a Syntax Model like the following:

```ts
{
  'scope-block': {
    block: true,
    beginToken: {
      matches: '{',
      name: 'meta.brace.curly'
    },
    endToken: {
      matches: '}',
      name: 'meta.brace.curly'
    }
  },
  'var-ref': {
    syntax: {
      name: 'variable.other.private',
      matches: /[a-zA-Z]\w*/,
      in: 'expression'
    }
  },
  'control-statement': {
    syntax: {
      name: 'keyword.control',
      matches: ['FROM', 'WHERE'], // based on referenced token matches values
      in: 'expression',
    }
  },
  'expression': {
    references: ['control-statement', 'var-ref'],
    partOf: ['block'],
    root: true
  }
}
```

The Syntax Generator can generate a syntax model that is compatible with any editor/IDE that supports the TetMate `tmLanguage` standard, such as VS Code.

```ts
{
  // ...
    "var-ref": {
      "match": "(\\s*)(_+[a-zA-Z_0-9]+)",
      "name": "variable.other.private.sqlx"
    },
  "control-statement": {
    "match": "\\s*(?i)(SELECT|FROM|WHERE)\\b",
    "name": "keyword.where.sqlx",
  },
  "expression": {
    "name": "meta.expression.sqlx",
    "patterns": [
      {
        "include": "#control-statement"
      },
      {
        "include": "#var-ref"
      },
      // ...
    ]
  }
}
```

See `syntax-gen` for utility functions that support generating a syntax model from such a model.

- `generateRepo(data, opts)`
- `generateSyntax(data, opts)`
- `generateSyntaxJson(data, opts)`

## How to use it

`const MyParser = withSyntaxModeller($MyParser)`

This will add the special `consumeStx`, `subruleStx` and `syntax` methods to your Parser which lets you build an internal syntax model when you parse.

To use the full syntax infrastructure:

```ts
import { writeSyntaxFile } from "chevrotain-editor-utils";

// configure parser
const parser = new Parser(config, tokenTypes, tokens, performSelfAnalysis);
parser.tokenMap = tokenMap;

// "fake" parse
parser.parse(doc);

// write to syntax file
const syntaxJsonStr = generateSyntaxJson(parser.syntaxModel.model);
writeSyntaxFile("sqlx", syntaxJsonStr);
```
