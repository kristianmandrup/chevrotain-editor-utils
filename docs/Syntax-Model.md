# Syntax Model

The Syntax Model API makes it possible to create the language configuration file and syntax file for VC Code directly from a Chevrotain parser definition.

Example:

```ts
class SqlParser extends BaseParser {
  rootRule = () => this.turtleDoc();

  turtleDoc = () =>
    this.RULE("sqlDoc", () => {
      this.MANY(() => this.SUBRULE(this.statement()));
    });

  statement = () => this.RULE("statement", () => {});
}

const ParseWithSM = withSyntaxModeller(SqlParser);

const config = {};
const whenToken = createToken({
  name: "when",
  label: "when",
  pattern: /When/
});
const tokens = [];
const tokenMap = {
  when: whenToken
};

const tokenTypes = [whenToken];
const performSelfAnalysis = true;

// create parser
const parser = new ParseWithSM(config, tokenTypes, tokens, performSelfAnalysis);
// set token map used for lookup
parser.tokenMap = tokenMap;

// ParseWithSM.performSelfAnalysis(parser);

const syntaxDef = {
  type: "condition",
  partOf: "expression",
  matches: "when"
};
parser.parserOff();

parser.consumeStx("when", syntaxDef);
const model = parser.stxModel();
const { condition } = model;
console.log(condition.syntax);
// {
//   matches: ["when"]
// }
console.log(condition.expression);
// {
//   patterns: [
//     {
//       include "#when"
//     }
// }
```

## How it works

A typical chevrotain parser rule definition:

```ts
$.RULE("fromClause", () => {
  $.CONSUME(From);
  $.CONSUME(Identifier);
});
```

Chevrotain token:

```ts
const Identifier = createToken({
  name: "Identifier",
  pattern: /_+[a-zA-Z_0-9]+/
});
// ...
```

We need to generate VS Code syntax definition for the token

```json
{
  "Identifier": {
    "match": "(\\s*)(_+[a-zA-Z_0-9]+)",
    "name": "variable.other.private.sqlx"
  },
```

We can see, that the syntax definition has characteristics that are very similar to the token definition. However uses a slightly different `match` expression and requires a `name` with a prefix specific to editor conventions (originally as defined in the TextMate `tmLanguage`).

To see more examples of syntax defintions, see [Syntax Generator](./SyntaxGen.md)

We could have the parser build an internal syntax model (as the Parser API is being used). The model can then be used to generate a syntax structure as output. This syntax output should be able to get the developer 90-95% of the way of creating a matching syntax `json` file.

We can use this wrapper API to add additional meta data to the tokens, such as `matches` in the following.

```ts
const tokenMap = createTokenMap({
  Identifier: { name: "Identifier", pattern: /[a-zA-Z]\w*/ },
  From: {
    name: "From",
    pattern: /FROM/,
    matches: "FROM",
    longer_alt: "#Identifier"
  },
  Where: {
    name: "Where",
    pattern: /WHERE/,
    matches: "WHERE",
    longer_alt: Identifier
  }
});
```

The `createTokenMap` helper function can be found in `utils/create-token-map`

## Parser using Syntax Model api

Parser using `consumeStx`, `subruleStx` and `syntax` to generate a `SyntaxModel`

```ts
$.rule("fromClause", () => {
  $.consumeStx("From", {
    type: "control-statement",
    matches: "From"
  });
  $.consumeStx("Identifier", {
    type: "var-ref",
    partOf: "expression"
  });
});

$.rule("whereClause", () => {
  $.consumeStx("Where", {
    type: "control-statement",
    matches: "Where"
  });
  $.subruleStx("expression", {
    // ...
  });
});

$.rule("block", () => {
  const ctx = { type: "scope-block", block: true };
  const stxName = "meta.brace.curly";
  $.consumeStx("LBrace", { ...ctx, matches: "{", begin: stxName });
  $.subruleStx("expression", { ...ctx, matches: "expression" });
  $.consumeStx("RBrace", { ...ctx, matches: "}", end: stxName });
});

// could have default mapping using conventions, then allow overrides
// warn if no syntax mapping defined
$.syntax("expression", "meta.expression", {
  references: ["control-statement"],
  root: true
});
$.syntax("var-ref", "variable.other.private");
$.syntax("control-statement", "keyword.control");
// ...
```

### Block rule

The `block` rule should generate a syntax like:

```json
{
  "begin": "\\{",
  "beginCaptures": {
    "0": {
      "name": "meta.brace.curly.sqf"
    }
  },
  "end": "\\}",
  "endCaptures": {
    "0": {
      "name": "meta.brace.curly.sqf"
    }
  },
  "patterns": [
    {
      "include": "#expression"
    }
  ]
}
```

The syntax model wrappers

```ts
consumeStx = (tokenRef, opts = {}) => {
  this.CONSUME(this.tokenFor(tokenRef));
  this.addToModel(tokenRef, opts);
};

addToModel = (tokenRef, opts) => {
  let { type, matches, partOf } = opts;

  const typeEntry = {
    //...
  };
  this.syntaxModel[type] = typeEntry;
};

syntax = (repoKey, syntaxName, opts = {}) => {
  const { references, root } = opts;
  this.syntaxModel[repoKey] = {
    // ...
  };
};
```

This could generate a rule model:

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

Which can be used to generate a syntax model:

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
