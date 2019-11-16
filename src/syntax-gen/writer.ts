const fs = require("fs");
export const writeSyntaxFile = (name, jsonContent) =>
  fs.writeFileSync(`./syntax/${name}.json`, jsonContent);
