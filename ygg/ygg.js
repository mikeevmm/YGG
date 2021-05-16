/**
 * YGG - Yet-another Grammar Grammar
 *
 * This module transforms a text description of a grammar, i.e., a description
 * of a set of valid strings, into either a JS source file or a function that
 * produce members of this grammar.
 *
 * For example:
 *
 * ```js
 * const GRAMMAR = `
 *    (
 *      (= fruit |("banana" "apple" "orange"))
 *      "I love to eat " fruit "s! "
 *      "Don't you like " fruit "?"
 *    )
 * `;
 * 
 * const {interpret} = require('ygg');
 * const generator = interpret(GRAMMAR);
 * 
 * console.log(generator(''));
 * //   I love to eat bananas! Don't you like bananas?
 * ```
 * 
 * The grammar grammar has the following syntax:
 * 
 * ? <optional expression>               -> Reduced to the expression or ""
 * | (<option 1> <option 2> ...)         -> Reduced to one of the options
 * = <identifier> <expression>           -> Attributes the expression to the identifier, and reduces to nothing
 * & "<regex>" <expression> <expression> -> If the regex matches/doesn't match the input, reduces to the first/second expression
 * <identifier>                          -> Identifiers are numbers and letters; reduces to the value of the identifier
 * ( <expression> <expression> ... )     -> Reduces to the concatenated expressions
 * "<literal expression>"                -> Simple text; delimited by " or '
 **/

const { exit } = require('process');
const errors = require('./src/errors');

const compile = (grammar, output_file) => {
  const fs = require('fs');
  const {Wrangler} = require('./src/wrangler');

  const w = Wrangler();
  try {
    w.wrangle(grammar);
  } catch(err) {
    errors.prettyPrint(grammar, err);
    throw err;
  }
  return fs.writeFileSync(output_file, w.source);
};

const interpret = (grammar) => {
  const {astize} = require('./src/ast');
  const {fold} = require('./src/interpreter');

  let ast;
  try {
    ast = astize(grammar);
  } catch(err) {
    errors.prettyPrint(grammar, err);
    throw err;
  }
  
  const interpreter = (input) => {
    let folded;
    try {
      [folded, _memory, _input] = fold(ast, {}, input);
    } catch(err) {
      errors.prettyPrint(grammar, err);
      throw err;
    }
    return folded;
  };
  return interpreter;
};

module.exports = {
  compile,
  interpret
};
