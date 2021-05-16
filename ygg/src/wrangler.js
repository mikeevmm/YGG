/**
 * This module semi-compiles an AST into a javascript module, exposing a
 * `generate(input)` function.
 */

const {astize} = require('./ast');

function Wrangler() {
  return {
    source: '',
    defines: {},

    returnConstant: function(value) {
      return {type: 'Constant', value};
    },

    returnMangle: function(value) {
      return {type: 'Mangled', value};
    },

    getMangled: function() {
      // Fairly HACKy but it's unlikely to have colliding mangled names.
      return `_${Math.floor(Math.random() * 1000000000000000)}`;
    },

    registerDecl: function(declaration) {
      this.source += declaration + '\n';
    },

    foldLiteral: function(literal) {
      return this.returnConstant(literal.literal);
    },

    foldIdentifier: function(identifier) {
      if (identifier in this.defines) {
        return this.defines[identifier.identifier];
      } else {
        throw 'Trying to fold identifier before initialization.';
      }
    },

    foldDefine: function(define) {
      if (define.statement.type == 'Constant') {
        const folded = this.returnConstant(define.statement.literal);
        this.defines[define.identifier.identifier] = folded;
        return folded;
      } else {
        // Define the body, so that identifier can point at body
        const mangled_body = this.returnMangle(this.fold(define.statement));
        this.defines[define.identifier.identifier] = mangled_body;
        return mangled_body;
      }
    },

    foldChoose: function(choose) {
      // Define each of the choices
      const folded_choices = [];
      for (const i in choose.possibles.statements) {
        const possible = choose.possibles.statements[i];
        folded_choices.push(this.fold(possible));
      }

      // The body is a random choice of these
      const choice_mangled = this.getMangled();
      let declaration = `const ${choice_mangled} = (input) => { `
      declaration += 'const choices = [';
      for (const i in folded_choices) {
        const {type, value} = folded_choices[i];
        if (i > 0) {
          declaration += ', ';
        }
        if (type == 'Constant') {
          // Folded is a string
          declaration += `"${value}"`;
        } else {
          // Folded is a mangled name
          declaration += `${value}`;
        }
      }
      declaration += ']; ' +
          'const choice = choices[Math.floor(Math.random()*choices.length)]; ' +
          'if ((typeof choice) === \'string\') { return choice; } else { return choice(input); }' +
          '};';
      this.registerDecl(declaration);
      return this.returnMangle(choice_mangled);
    },

    foldOptional: function(optional) {
      // Define body
      const body = this.fold(optional.maybe);

      const mangled_name = this.getMangled();
      let declaration = `const ${
          mangled_name} = (input) => { if (Math.random() < 0.5) { return `;
      if (body.type === 'Constant') {
        declaration += `"${body.value}"`;
      } else {
        const mangled_body = body.value;
        declaration += `${mangled_body}(input)`;
      }
      declaration += '; } return "";};';
      this.registerDecl(declaration);
      return this.returnMangle(mangled_name);
    },

    foldStatements: function(statements) {
      if (statements.statements.length == 0) return this.returnConstant('');

      const folded_statements = [];
      for (const i in statements.statements) {
        const statement = statements.statements[i];
        const folded = this.fold(statement);
        if (folded.type === 'Constant' && folded_statements.length > 0 &&
            folded_statements[i - 1].type === 'Constant') {
          folded_statements[i - 1].value += folded.value;
        } else {
          folded_statements.push(folded);
        }
      }

      if (folded_statements.length == 1) {
        if (folded_statements[0].type === 'Constant') {
          return this.returnConstant(folded_statements[0].value);
        } else {
          return this.returnMangle(folded_statements[0].value);
        }
      }

      const mangled_name = this.getMangled();
      let declaration = `const ${mangled_name} = (input) => { return `;
      for (const i in folded_statements) {
        const folded = folded_statements[i];
        if (i > 0) declaration += ' + ';
        if (folded.type === 'Constant') {
          declaration += `"${folded.value}"`;
        } else {
          declaration += `${folded.value}(input)`;
        }
      }
      declaration += '; };';

      this.registerDecl(declaration);
      return this.returnMangle(mangled_name);
    },

    foldRegex: function(regex) {
      // Fold left and right expressions
      const folded_left = this.fold(regex.left);
      const folded_right = this.fold(regex.right);
      const mangled_name = this.getMangled();
      let declaration = `const ${mangled_name} = (input) => { if (/${
          regex.literal.literal}/.test(input)) { `;
      if (folded_left.type === 'Constant') {
        declaration += `return "${folded_left.value}"`;
      } else {
        declaration += `return ${folded_left.value}(input)`;
      }
      declaration += '; } else { ';
      if (folded_right.type === 'Constant') {
        declaration += `return "${folded_right.value}"`;
      } else {
        declaration += `return ${folded_right.value}(input)`;
      }
      declaration += '; }};';

      this.registerDecl(declaration);
      return this.returnMangle(mangled_name);
    },

    fold: function(node) {
      switch (node.type) {
        case 'Literal':
          return (this.foldLiteral)(node);
        case 'Identifier':
          return (this.foldIdentifier)(node);
        case 'Define':
          return (this.foldDefine)(node);
        case 'Choose':
          return (this.foldChoose)(node);
        case 'Optional':
          return (this.foldOptional)(node);
        case 'Statements':
          return (this.foldStatements)(node);
        case 'Regex':
          return (this.foldRegex)(node);
        default:
          throw new Error(`Unhandled node type '${node.type}'`);
      }
    },

    wrangle: function(grammar) {
      const root = astize(grammar);
      const folded_root = this.fold(root);

      if (folded_root.type === 'Constant') {
        this.registerDecl(
            `module.exports = { generate: () => "${folded_root.value}" };`);
      } else {
        this.registerDecl(
            `module.exports = { generate: ${folded_root.value} };`);
      }
    }
  };
};

module.exports = { Wrangler };
