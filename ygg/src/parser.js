/**
 * This file provides utility for consuming plain source text in a tokenized
 * fashion.
 **/

const Stream = (content) => {
  return {
    content: content, pos: 0
  }
};

const eof = (stream) => (stream.pos >= stream.content.length);

const peek = (stream) => {
  if (eof(stream)) return '';
  return stream.content[stream.pos];
};

const consume = (stream) => {
  if (eof(stream)) return '';
  const consumed = peek(stream);
  stream.pos++;
  return {consumed, stream};
};

const last = (stream, offset=1) => {
  const i = (stream.pos - offset);
  if (i < 0 || i >= stream.content.length) return '';
  return stream.content[i];
};

const match = (stream, chr) => {
  if (eof(stream)) return {matches: false, stream};
  const next = stream.content[stream.pos];
  if (next == '') return {matches: false, stream};
  const matches = (next == chr);
  if (matches) stream.pos++;
  return {matches, stream};
};

const any = (stream, any_of) => {
  if (eof(stream)) return {matches: false, stream};
  const next = stream.content[stream.pos];
  const matches = any_of.includes(next);
  if (matches) stream.pos++;
  return {matches, stream};
};

const whileMatch = (stream, chr) => {
  let matches = true;
  while (!eof(stream) && matches) {
    ({matches, stream} = match(stream, chr));
  }
  return stream;
};

const whileAny = (stream, any_of) => {
  let matches;
  let content = [];
  while (!eof(stream)) {
    ({matches, stream} = any(stream, any_of));
    if (!matches) break;
    content.push(last(stream));
  }
  content = content.join('');
  return {content, stream};
};

const whileCondition = (stream, callable) => {
  let content = [];
  while (!eof(stream)) {
    const next = peek(stream);
    if (callable(next)) {
      ({consumed, stream} = consume(stream));
      content.push(consumed);
    } else {
      break;
    }
  }
  content = content.join('');
  return {content, stream};
};

const until = (stream, chr) => {
  let content = [];
  while (!eof(stream)) {
    ({consumed, stream} = consume(stream));
    if (consumed == chr) break;
    content.push(consumed);
  }
  content = content.join('');
  return {content, stream};
};

const matchStr = (stream, str) => {
  const checkpoint = stream.pos;
  for (const i in str) {
    const try_match = str[i];
    ({matches, stream} = match(stream, try_match));
    if (!matches) {
      stream.pos = checkpoint;
      return {matches: false, stream};
    }
  }
  return {matches: true, stream};
};

const matchAnyStr = (stream, any_of) => {
  for (const i in any_of) {
    const str = any_of[i];
    ({matches, stream} = matchStr(stream, str));
    if (matches) {
      return {matches: true, stream};
    }
  }
  return {matches: false, stream};
};

module.exports = {
  Stream,
  eof,
  peek,
  consume,
  last,
  match,
  any,
  whileMatch,
  whileAny,
  whileCondition,
  until,
  matchStr,
  matchAnyStr,
};
