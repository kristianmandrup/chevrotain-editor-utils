# Chevrotain Editor Utils

This library containts a set of utilies aimed at making it easier to add Editor/IDE support for [chevrotain](https://sap.github.io/chevrotain/docs/) parsers.

The library currently consists of:

- Syntax Generator
- Syntax Model
- Parser utilities

## Add SyntaxModel to Parser

`const SyntaxParser = withSyntaxModeller(MyParser)`

This will add the special API wrapper methods to your Parser:

- `consumeStx` consume token with addition syntax meta data
- `subruleStx` and `subruleStx2` evaluate subrule with addition syntax meta data
- `syntax` add additional syntax information to syntax model

These methods lets you build an internal syntax model when you parse.

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

## Documentation

- [Syntax Model](./docs/Syntax-Model.md)
- [Syntax Generator](./docs/Syntax-Generator.md)
- [VS Code language extension](./docs/VSC-lang-extension.md)
