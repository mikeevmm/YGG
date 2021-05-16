const USAGE = `Usage:
  $ ygg [options] <input file path> <output file path>`;

const HELP = `YGG (Yet-another Grammar Grammar)

Compile a YGG grammar into a generator file.

${USAGE}

Options:
  --overwrite=<overwrite>  Overwrite the output file if it exists (default: false).
  --encoding=<encoding>    Specify an encoding for the input file (default: utf-8).
  --help                   Display this text.
  --version                Show the current version.`;

function cli() {
  const arg = require('arg');
  const fs = require('fs');
  const ygg = require('../ygg');

  const args = arg({
    '--overwrite': Boolean,
    '--encoding': String,
    '--help': Boolean,
    '--version': Boolean,
    '-v': '--version',
    '-V': '--version',
    '-h': '--help',
  });

  if (args['--version']) {
    const version = require('root-require')('package.json').version;
    console.log(`YGG (Yet-another Grammar Grammar) ${version}`);
    return;
  }

  if (args['--help']) {
    console.log(HELP);
    return;
  }

  const arg_count = args._.length;
  if (arg_count != 2) {
    console.log(USAGE);
    return;
  }

  const [infile, outfile] = args._;
  if (!fs.existsSync(infile)) {
    console.log(`Input file '${infile}' does not exist.`);
    return;
  }
  if (!args['--overwrite'] && fs.existsSync(outfile)) {
    console.log(`Output file '${outfile}' already exists.`);
    return;
  }

  let encoding = 'utf-8';
  if (args['--encoding']) encoding = args['--encoding'];
  const grammar = fs.readFileSync(infile, encoding);

  try {
    ygg.compile(grammar, outfile);
  } catch(err) {
    // Stop YGG errors as these have been reported.
    if (!err.ygg) throw err;
  }
}

module.exports = {cli};