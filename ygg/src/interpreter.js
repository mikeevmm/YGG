/**
 * This file provides a function `fold` that is able to fold an AST-ized grammar
 * into a member of that grammar.
 **/

const errors = require('./errors');

const foldDefine = (define, memory, input) => {
  [value, memory, input] = fold(define.statement, memory, input);
  memory[define.identifier.identifier] = value;
  return ['', memory, input];
};

const foldChoose = (choose, memory, input) => {
  const choices = choose.possibles.statements;
  const choice = choices[Math.floor(Math.random() * choices.length)];
  return fold(choice, memory, input);
};

const foldOptional = (optional, memory, input) => {
  if (Math.random() < 0.5) {
    return fold(optional.maybe, memory, input);
  } else {
    return ['', memory, input];
  }
};

const foldRegex = (regex, memory, input) => {
  ([literal_value, memory, input] = fold(regex.literal, memory, input));
  let regexp;
  try {
    regexp = new RegExp(literal_value);
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw errors.InterpreterRegexError(literal_value, err, regex.pos);
    } else {
      throw err;
    }
  }
  const matches = regexp.test(input);
  if (matches) {
    return fold(regex.left, memory, input);
  } else {
    return fold(regex.right, memory, input);
  }
};

const foldIdentifier = (identifier, memory, input) => {
  identifier = identifier.identifier
  if (!(identifier in memory)) {
    throw errors.InterpreterUnknownIdentifierError(identifier, identifier.pos);
  }
  return fold(memory[identifier], memory, input);
};

const foldLiteral = (literal, memory, input) => {
  return [literal.literal, memory, input];
};

const foldStatements = (statements, memory, input) => {
  const folds = [];
  for (const i in statements.statements) {
    const statement = statements.statements[i];
    ([folded, memory, input] = fold(statement, memory, input));
    folds.push(folded);
  }
  return [folds.join(''), memory, input];
};

const fold = (node, memory, input) => {
  if ((typeof node) === 'string') {
    return [node, memory, input];
  }

  let folder;
  switch (node.type) {
    case 'Define':
      folder = foldDefine;
      break;
    case 'Choose':
      folder = foldChoose;
      break;
    case 'Optional':
      folder = foldOptional;
      break;
    case 'Identifier':
      folder = foldIdentifier;
      break;
    case 'Literal':
      folder = foldLiteral;
      break;
    case 'Statements':
      folder = foldStatements;
      break;
    case 'Regex':
      folder = foldRegex;
      break;
    default:
      throw `Unhandled node type '${node.type}'`;
  }
  return folder(node, memory, input);
};

module.exports = {fold};
