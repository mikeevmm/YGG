/**
 * This file provides objects for parsing and interpreting error reporting.
 */

const InterpreterUnknownIdentifierError = (identifier, pos) => {
  return {ygg: true, type: 'InterpreterUnknownIdentifierError', identifier, pos};
};

const InterpreterRegexError = (literal, regex_error, pos) => {
  return {ygg: true, type: 'InterpreterRegexError', literal, regex_error, pos};
};

const AstExpectLiteralStartError = (pos) => {
  return {ygg: true, type: 'AstExpectLiteralStartError', pos};
};

const AstLiteralUnexpectedEOFError = (start_pos) => {
  return {ygg: true, type: 'AstLiteralUnexpectedEOFError', start_pos};
};

const AstExpectIdentifier = (pos) => {
  return {ygg: true, type: 'AstExpectIdentifier', pos};
};

const AstExpectOperator = (pos) => {
  return {ygg: true, type: 'AstExpectOperator', pos};
};

const AstExpectStatement = (pos) => {
  return {ygg: true, type: 'AstExpectStatement', pos};
};

const AstExpectStatements = (pos) => {
  return {ygg: true, type: 'AstExpectStatements', pos};
};

const AstUnclosedStatements = (start_pos) => {
  return {ygg: true, type: 'AstUnclosedStatements', start_pos};
};

const printAt = (source, pos) => {
  // 0 indexed lines! To be consistent with pos.
  const line_idx = source.slice(0, pos).split('\n').length - 1;
  let col;
  if (line_idx == 0) {
    col = pos;
  } else {
    col = pos - source.slice(0, pos).lastIndexOf('\n')
  }
  const line_end_idx = source.slice(pos).indexOf('\n');
  let line;
  if (line_end_idx === -1) {
    line = source.slice(line_idx);
  } else {
    line = source.slice(line_idx, line_end_idx - line_idx);
  }
  console.error(`Line ${line_idx}, column ${col},`)
  console.error('| ', line);
  console.error('| ', [' '.repeat(col), '^ Here'].join(''));
};

const prettyPrint = (source, err) => {
  switch (err.type) {
    case 'InterpreterUnknownIdentifierError':
      console.error(`Identifier '${err.identifier}' used before definition.`);
      printAt(source, err.pos);
      console.error('Hint: You need to define this value first, with');
      console.error(`     = ${err.identifier} <value>`);
      break;
    case 'InterpreterRegexError':
      console.error(err.regex_error.message);
      printAt(source, err.pos);
      break;
    case 'AstExpectLiteralStartError':
      console.error('Expected the start of a literal, with " or \'.');
      printAt(source, err.pos);
      break;
    case 'AstLiteralUnexpectedEOFError':
      console.error(
          'Literal started, but not ended (found end of file instead).');
      printAt(source, err.start_pos);
      break;
    case 'AstExpectIdentifier':
      console.error('Expected an identifier (numbers and letters) here.');
      printAt(source, err.pos);
      break;
    case 'AstExpectOperator':
      console.error('Expected an operator (one of "=", "|", "&", "?") here.');
      printAt(source, err.pos);
      break;
    case 'AstExpectStatement':
      console.error(
          'Expected some statement (literal, operation, identifier, group of statements) here.');
      printAt(source, err.pos);
      break;
    case 'AstExpectStatements':
      console.error('Expected a bracketed group of statements here.');
      printAt(source, err.pos);
      break;
    case 'AstUnclosedStatements':
      console.error(
          'Bracketed group of statements was started, but never closed (found end of file instead).');
      printAt(source, err.start_pos);
      break;
    default:
      // Either not implemented or another type of error
      if ('type' in err) {
        console.warn('Possibly unimplemented error type ', err.type);
      }
      throw err;
  }
};

module.exports = {
  InterpreterUnknownIdentifierError,
  InterpreterRegexError,
  AstExpectLiteralStartError,
  AstLiteralUnexpectedEOFError,
  AstExpectIdentifier,
  AstExpectOperator,
  AstExpectStatement,
  AstExpectStatements,
  AstUnclosedStatements,
  prettyPrint
};