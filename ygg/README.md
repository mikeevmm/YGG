# Yet-another Grammar Grammar (YGG)

YGG is a [generative grammar][0] metasyntax interpreter and compiler, made with bots in mind.

## Example

``` 

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
```

generates

``` 

Hello there Jones, it's lovely to meet you. I've heard much about you.
Hello there Michael, it's wonderful to meet you. I've heard much about you.
Hello there James, it's very nice to meet you. Care to join me for dinner?
...
```

## Quick Start

### For command line usage:

``` bash
npm install --global @miguelmurca/ygg
ygg --help
```

after compiling to a file (for example `mine.js`),

``` javascript
const {
    generate
} = require('./mine.js');
console.log(generate('Some input'));
```

### For programmatic usage:

``` bash
npm install @miguelmurca/ygg
```

and then

``` javascript
const ygg = require('@miguelmurca/ygg');
const GRAMMAR = `( "Hello world!" )`; // Your grammar here
const interpreter = ygg.interpret(GRAMMAR);
console.log(interpreter('Some input.'));
```

## What?

`ygg` plays 3 separate roles.

First, it's a definition of a metasyntax notation (like, for example, [BNF][2]). What this means is that it defines a way for you to define generative grammars (i.e., acceptable sentences). You can find more information about this under [syntax](#syntax).

Secondly, `ygg` is a command-line utility for "compiling" files defining grammars into javascript files that expose a generating function. This means you can pass in a file with your grammar to `ygg` on the command line, and produce a javascript file you can use to make, e.g., your Telegram bot. See the [CLI](#cli) section for more information.

Finally, `ygg` is an npm package, which you can call upon programmatically. You can parse and/or compile grammars on the fly with it. See the [npm package](#npm-package) section for more information.

## Why?

I often make joke bots in Telegram or Twitter. Every so often, or whenever someone messages them, they tweet out or reply with a dynamically generated sentence which has something to do with whatever the bot's about.

It's not hard to write code to generate these texts, but it can be hard to iterate over the code, and keep it readable. I wrote `ygg` to reduce the amount of boilerplate code I have to write for each bot, and to ease the iteration process.

## Syntax

`ygg` uses a [Polish notation][2]-like syntax:

* `? <optional expression>` is reduced to either the expression or nothings (with equal likelihood); 
* `| (<option 1> <option 2> ...)` is reduced to one of the options (with equal likelihood); 
* `= <identifier> <expression>` attributes expression to the identifier, and reduces to nothing; 
* `& "<regex>" <expression> <expression>` reduces to first/second expression if regex matches/doesn't match the input; 
* `<identifier>` reduces to value of the identifier (which can be made up of numbers and letters); 
* `( <expression> <expression> ... )` is reduced to the concatenated expressions; 
* `"<literal expression>"` is reduced to the text itself, which can be delimited by `"` or `'`.

A `ygg` grammar specification, then, is just one big grouped expression, reducing to a string:

``` 

( ... )
```

## CLI

Supposing `grammar.ygg` is a text file containing the grammar, 

``` bash
ygg grammar.ygg generator.js
```

will produce a javascript file named `generator.js` . This file exposes a single function, `generate` , which takes in the user input as a string argument, and returns a string in the defined grammar.

## `npm` Package

`ygg` can be used as a module to do things on the fly. For this, the `ygg` package exposes two functions, `compile` and `interpret` .

``` javascript
compile(grammar: String, output_file: String) -> undefined
```

`compile` exposes the CLI behaviour; given a string of a grammar, it will write the compiled generator into the specified output file (specified by its name).

``` javascript
interpret(grammar: String) -> ((String) => String)
```

`interpret` will take in the grammar as a string and return a function that generates members of the grammar for the provided input.

## License

This tool is licensed under an MIT license.
See LICENSE for details.

## Support

💕 If you liked `ygg` , consider [buying me a coffee](https://www.paypal.me/miguelmurca/2.50).

[0]: https://en.wikipedia.org/wiki/Generative_grammar
[1]: https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form
[2]: https://en.wikipedia.org/wiki/Polish_notation
