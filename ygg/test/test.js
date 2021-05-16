const {expect} = require('chai');

describe('Parser', function() {
  const parser = require('../src/parser');
  it('create a stream', function() {
    parser.Stream('Some text data.');
  });
  it('eof', function() {
    const empty = '';
    const stream = parser.Stream(empty);
    expect(parser.eof(stream)).to.be.true;
  });
  it('peek', function() {
    const char = 'x';
    const stream = parser.Stream(char);
    expect(parser.peek(stream)).to.be.equal(char);
  });
  it('consume', function() {
    const char = 'y';
    let stream = parser.Stream(char);
    ({consumed, stream} = parser.consume(stream));
    expect(consumed).to.be.equal(char);
  });
  it('last', function() {
    const char = 'z';
    let stream = parser.Stream(char);
    ({stream} = parser.consume(stream));
    expect(parser.last(stream)).to.be.equal(char[0]);
  });
  it('match', function() {
    const char = 'w';
    const not_char = 'x';
    let stream = parser.Stream(char);
    ({matches, stream} = parser.match(stream, not_char));
    expect(matches).to.be.false;
    ({matches, stream} = parser.match(stream, char));
    expect(matches).to.be.true;
  });
  it('any', function() {
    const char = 'u';
    const not_one_of = ['x', 'y', 'z'];
    let stream = parser.Stream(char);
    ({matches, stream} = parser.any(stream, not_one_of));
    expect(matches).to.be.false;
    const one_of = not_one_of.concat([char]);
    ({matches, stream} = parser.any(stream, one_of));
    expect(matches).to.be.true;
  });
  it('whileMatch', function() {
    const text = 'xxxxY';
    let stream = parser.Stream(text);
    stream = parser.whileMatch(stream, 'x');
    ({matches, stream} = parser.match(stream, 'Y'));
    expect(matches).to.be.true;
  });
  it('whileAny', function() {
    const do_match = ['x', 'y', 'z'];
    const stop_at = 'w';
    const text = do_match.concat([stop_at]).join('');
    let stream = parser.Stream(text);
    ({content, stream} = parser.whileAny(stream, do_match));
    expect(content).to.be.equal(do_match.join(''));
    ({matches, stream} = parser.match(stream, stop_at));
    expect(matches).to.be.true;
  });
  it('whileCondition', function() {
    const isNumber = (char) => /[0-9]/.test(char);
    const text = '01234x';
    let stream = parser.Stream(text);
    ({content, stream} = parser.whileCondition(stream, isNumber));
    expect(content).to.be.equal('01234');
    ({matches, stream} = parser.match(stream, 'x'));
    expect(matches).to.be.true;
  });
  it('until', function() {
    const n = 10;
    const text = 'x'.repeat(n).concat('yzx');
    let stream = parser.Stream(text);
    ({content, stream} = parser.until(stream, 'y'));
    expect(content).to.be.equal('x'.repeat(n));
    ({matches, stream} = parser.match(stream, 'z'));
    expect(matches).to.be.true;
  });
  it('matchStr', function() {
    const text = 'abcabcdef';
    let stream = parser.Stream(text);
    ({matches, stream} = parser.matchStr(stream, 'abc'));
    expect(matches).to.be.true;
    ({matches, stream} = parser.matchStr(stream, 'def'));
    expect(matches).to.be.false;
    ({matches, stream} = parser.matchStr(stream, 'abc'));
    expect(matches).to.be.true;
    ({matches, stream} = parser.matchStr(stream, 'def'));
    expect(matches).to.be.true;
  });
  it('matchAnyStr', function() {
    const text = 'abcabcdef';
    const any = ['abc', 'def'];
    let stream = parser.Stream(text);
    ({matches, stream} = parser.matchAnyStr(stream, any));
    expect(matches).to.be.true;
    ({matches, stream} = parser.matchAnyStr(stream, any));
    expect(matches).to.be.true;
    ({matches, stream} = parser.matchAnyStr(stream, any));
    expect(matches).to.be.true;
  });
});

describe('Well-formed Input', function() {
  const ygg = require('../ygg');
  it('Simple string', function() {
    const interpreter = ygg.interpret('("Hello world!")');
    interpreter('');
  });
  it('Concatenation', function() {
    const interpreter = ygg.interpret('("Hello " "world!")');
    expect(interpreter('')).to.be.equal('Hello world!')
  });
  it('Assignment', function() {
    const interpreter = ygg.interpret('(= hello "Hello world!")');
    expect(interpreter('')).to.be.equal('');
  });
  it('Identifier use', function() {
    const interpreter = ygg.interpret('(= hello "hewwo" hello " world!")');
    expect(interpreter('Yes')).to.equal('hewwo world!');
  });
  it('Nested expressions', function() {
    const interpreter =
        ygg.interpret('("Hello " ("there " ("General Grievous.")))');
    expect(interpreter('')).to.be.equal('Hello there General Grievous.');
  });
  it('Choose', function() {
    const interpreter =
        ygg.interpret('("Hello " |("Michael" "James" "Jones"))');
    expect(interpreter('')).to.match(/Hello (?:Michael|James|Jones)/);
  });
  it('Optional', function() {
    const interpreter = ygg.interpret('("Hewwo " (? "owo"))');
    for (let i = 0; i < 10; i++)
      expect(interpreter('')).to.match(/Hewwo (?:owo)?/);
  });
  it('Regex match', function() {
    const interpreter = ygg.interpret('(& "[Yy](?:es)?" "yes" "no")');
    expect(interpreter('Yes')).to.equal('yes');
    expect(interpreter('yes')).to.equal('yes');
    expect(interpreter('y')).to.equal('yes');
    expect(interpreter('No')).to.equal('no');
    expect(interpreter('')).to.equal('no');
    expect(interpreter('Proteus')).to.equal('no');
  });
  it('Ignore whitespace', function() {
    const interpreter = ygg.interpret(`
    ("Hello"         \t " this"
    " is whitespace.")`);
    expect(interpreter('')).to.equal('Hello this is whitespace.');
  });
  it('Complicated example', function() {
    const interpreter = ygg.interpret(`
      (
        = name |("James" "Jones" "Michael")
        "Hello there " name ", it's "
        |("lovely" "very nice" "wonderful")
        " to meet you. "
        |(
          ("Care to join me " |("for a drink" "for dinner") "?")
          "I've heard much about you."
        )
      )
    `);

    // Using the `parser` module to check the output, so if that fails
    // so does this.
    const parser = require('../src/parser');

    for (let i = 0; i < 10; ++i) {
      const text = interpreter('');
      let stream = parser.Stream(text);
      ({matches, stream} = parser.matchStr(stream, 'Hello there '));
      if (!matches) throw text;
      ({matches, stream} =
           parser.matchAnyStr(stream, ['James', 'Jones', 'Michael']));
      if (!matches) throw text;
      ({matches, stream} = parser.matchStr(stream, ', it\'s '));
      if (!matches) throw text;
      ({matches, stream} =
           parser.matchAnyStr(stream, ['lovely', 'very nice', 'wonderful']));
      if (!matches) throw text;
      ({matches, stream} = parser.matchStr(stream, ' to meet you. '));
      if (parser.peek(stream) === 'C') {
        ({matches, stream} = parser.matchStr(stream, 'Care to join me '));
        if (!matches) throw text;
        ({matches, stream} =
             parser.matchAnyStr(stream, ['for a drink', 'for dinner']));
        if (!matches) throw text;
        ({matches, stream} = parser.matchStr(stream, '?'));
        if (!matches) throw text;
      } else if (parser.peek(stream) === 'I') {
        ({matches, stream} =
             parser.matchStr(stream, 'I\'ve heard much about you.'));
        if (!matches) throw text;
      } else {
        throw text;
      }
    }
  });
});

describe('Malformed Input', function() {
  const ygg = require('../ygg');
  it('No global statement', function() {
    expect(() => ygg.interpret('"Hello!"')).to.throw();
  });
  it('Undefined identifier', function() {
    expect(() => {
      const interpreter = ygg.interpret('(literal)');
      interpreter('');
    }).to.throw();
  });
  it('Invalid regex', function() {
    expect(() => {
      const interpreter = ygg.interpret('(& "(" "Yes" "No")');
      interpreter('');
    }).to.throw();
  });
  it('Expect literal start', function() {
    expect(() => {
      const interpreter = ygg.interpret('(& id "yes" "no")');
      interpreter('');
    }).to.throw();
  });
  it('Unclosed literal', function() {
    expect(() => {
      const interpreter = ygg.interpret('(")');
      interpreter('');
    }).to.throw();
  });
  it('Expect identifier', function() {
    expect(() => {
      const interpreter = ygg.interpret('(= "bad assign" "yes" "no")');
      interpreter('');
    }).to.throw();
  });
  it('Expect operator/statements', function() {
    expect(() => {
      const interpreter = ygg.interpret('(. "bad operator")');
      interpreter('');
    }).to.throw();
  });
  it('Unclosed statements', function() {
    expect(() => {
      const interpreter = ygg.interpret('(()');
      interpreter('');
    }).to.throw();
  });
});