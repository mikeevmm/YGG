/**
 * This file takes in plain source text for the grammar and transforms it into
 * an Abstract Syntax Tree.
 **/

const parser = require('./parser');
const errors = require('./errors');

/** Tokens **/
const Define = (identifier, statement, pos) => {
  return {type: 'Define', identifier, statement, pos};
};

const Choose = (possibles, pos) => {
  return {
    type: 'Choose', possibles, pos
  }
};

const Optional = (maybe, pos) => {
  return {
    type: 'Optional', maybe, pos
  }
};

const Identifier = (identifier, pos) => {
  return {
    type: 'Identifier', identifier, pos
  }
};

const Regex = (literal, left, right, pos) => {
  return {
    type: 'Regex', literal, left, right, pos
  }
};

const Literal = (literal, pos) => {
  return {
    type: 'Literal', literal, pos
  }
};

const Statements = (statements, pos) => {
  return {
    type: 'Statements', statements, pos
  }
};

/** Grammar literals **/
const WHITESPACE = [' ', '\t', '\n', '\r', '\v', '\f'];
const isAlphaNumeric = (chr) => {
  const code = chr.charCodeAt(0);
  if (!(code > 47 && code < 58) &&   // numeric (0-9)
      !(code > 64 && code < 91) &&   // upper alpha (A-Z)
      !(code > 96 && code < 123)) {  // lower alpha (a-z)
    return false;
  }
  return true;
};
const OP_DEFINE = '=';
const OP_CHOOSE = '|';
const OP_OPTIONAL = '?';
const OP_REGEX = '&';
const OPERATORS = [OP_DEFINE, OP_CHOOSE, OP_OPTIONAL, OP_REGEX];
const LITERAL_DELIMITERS = ['"', '\''];

/** Parsing **/
const consumeWhitespace = (stream) => {
  ({content, stream} = parser.whileAny(stream, WHITESPACE));
  return stream;
};

const parseLiteral = (stream) => {
  const pos = stream.pos;
  ({matches, stream} = parser.any(stream, LITERAL_DELIMITERS));
  if (!matches) {
    throw errors.AstExpectLiteralStartError(pos);
  }
  const delimiter = parser.last(stream);
  const total_content = [];
  while (true) {
    ({content, stream} = parser.until(stream, delimiter));
    total_content.push(content);
    if (parser.eof(stream)) {
      throw errors.AstLiteralUnexpectedEOFError(pos);
    } else {
      if (parser.last(stream, 2) === '\\') {
        total_content.push(delimiter);
      } else {
        break;
      }
    }
  }
  return {literal: Literal(total_content.join(''), pos), stream};
};

const parseIdentifier = (stream) => {
  const pos = stream.pos;
  ({content, stream} = parser.whileCondition(stream, isAlphaNumeric));
  if (content.length == 0) throw errors.AstExpectIdentifier(pos);
  return {identifier: Identifier(content, pos), stream};
};

const parseDefine = (stream) => {
  const pos = stream.pos;
  let identifier;
  ({identifier, stream} = parseIdentifier(stream));
  stream = consumeWhitespace(stream);
  let statement;
  ({statement, stream} = parseStatement(stream));
  return {define: Define(identifier, statement, pos), stream};
};

const parseChoose = (stream) => {
  const pos = stream.pos;
  stream = consumeWhitespace(stream);
  ({statements, stream} = parseStatements(stream));
  return {choose: Choose(statements, pos), stream};
};

const parseOptional = (stream) => {
  const pos = stream.pos;
  ({statement, stream} = parseStatement(stream));
  return {optional: Optional(statement, pos), stream};
};

const parseRegex = (stream) => {
  const pos = stream.pos;
  let literal;
  ({literal, stream} = parseLiteral(stream));
  stream = consumeWhitespace(stream);
  ({statement, stream} = parseStatement(stream));
  const left = statement;
  stream = consumeWhitespace(stream);
  ({statement, stream} = parseStatement(stream));
  const right = statement;
  const regex = Regex(literal, left, right, pos);
  return {regex, stream};
};

const parseOperator = (stream) => {
  for (const i in OPERATORS) {
    const operator = OPERATORS[i];
    ({matches, stream} = parser.matchStr(stream, operator));
    if (matches) {
      return {operator, stream};
    }
  }
  throw new errors.AstExpectOperator(stream.pos);
};

const parseOperation = (stream) => {
  ({operator, stream} = parseOperator(stream));
  stream = consumeWhitespace(stream);
  let statement;
  switch (operator) {
    case OP_DEFINE:
      ({define, stream} = parseDefine(stream));
      statement = define;
      break;
    case OP_CHOOSE:
      ({choose, stream} = parseChoose(stream));
      statement = choose;
      break;
    case OP_OPTIONAL:
      ({optional, stream} = parseOptional(stream));
      statement = optional;
      break;
    case OP_REGEX:
      ({regex, stream} = parseRegex(stream));
      statement = regex;
      break;
    default:
      throw new Error(`Unimplemented operator '${operator}'!`);
  }
  return {statement, stream};
};

const parseStatement = (stream) => {
  let statement;
  const next_char = parser.peek(stream);
  if (next_char == '(') {
    ({statements, stream} = parseStatements(stream));
    statement = statements;
  } else {
    if (LITERAL_DELIMITERS.includes(next_char)) {
      ({literal, stream} = parseLiteral(stream));
      statement = literal;
    } else {
      if (isAlphaNumeric(next_char)) {
        ({identifier, stream} = parseIdentifier(stream));
        statement = identifier;
      } else {
        // Backtrack to be able to provide better errors
        const backtrack = stream.pos;
        ({matches} = parser.matchAnyStr(stream, OPERATORS));
        if (matches) {
          stream.pos = backtrack;
          ({statement, stream} = parseOperation(stream));
        } else {
          throw errors.AstExpectStatement(stream.pos);
        }
      }
    }
  }
  return {statement, stream};
};

const parseStatements = (stream) => {
  const start_pos = stream.pos;
  ({matches, stream} = parser.match(stream, '('));
  if (!matches) {
    throw errors.AstExpectStatements(stream.pos);
  }
  stream = consumeWhitespace(stream);
  const statements = [];
  while (true) {
    if (parser.eof(stream)) {
      throw errors.AstUnclosedStatements(start_pos);
    }
    ({matches, stream} = parser.match(stream, ')'));
    if (matches) {
      break;
    }
    ({statement, stream} = parseStatement(stream));
    statements.push(statement);
    stream = consumeWhitespace(stream);
  }
  return {statements: Statements(statements, stream.pos), stream};
};

const astize = (grammar) => {
  let stream = parser.Stream(grammar);
  stream = consumeWhitespace(stream);
  ({statements} = parseStatements(stream));
  return statements;
};

module.exports = {
  astize,
  Define,
  Choose,
  Optional,
  Identifier,
  Literal,
  Statements,
};
