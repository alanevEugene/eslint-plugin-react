/**
 * @fileoverview Prevent missing parentheses around multilines JSX
 * @author Yannick Croissant
 */
'use strict';

const has = require('has');

// ------------------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------------------

const DEFAULTS = {
  declaration: true,
  assignment: true,
  return: true,
  arrow: true,
  condition: false,
  logical: false,
  prop: false
};

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  meta: {
    docs: {
      description: 'Prevent missing parentheses around multilines JSX',
      category: 'Stylistic Issues',
      recommended: false
    },
    fixable: 'code',

    schema: [{
      type: 'object',
      properties: {
        declaration: {
          type: 'boolean'
        },
        assignment: {
          type: 'boolean'
        },
        return: {
          type: 'boolean'
        },
        arrow: {
          type: 'boolean'
        },
        condition: {
          type: 'boolean'
        },
        logical: {
          type: 'boolean'
        },
        prop: {
          type: 'boolean'
        }
      },
      additionalProperties: false
    }]
  },

  create: function(context) {
    const sourceCode = context.getSourceCode();

    function isParenthesised(node) {
      const previousToken = sourceCode.getTokenBefore(node);
      const nextToken = sourceCode.getTokenAfter(node);

      return previousToken && nextToken &&
        previousToken.value === '(' && previousToken.range[1] <= node.range[0] &&
        nextToken.value === ')' && nextToken.range[0] >= node.range[1];
    }

    function isMultilines(node) {
      return node.loc.start.line !== node.loc.end.line;
    }

    function check(node) {
      if (!node || node.type !== 'JSXElement') {
        return;
      }

      if (!isParenthesised(node) && isMultilines(node)) {
        context.report({
          node: node,
          message: 'Missing parentheses around multilines JSX',
          fix: function(fixer) {
            return fixer.replaceText(node, `(${sourceCode.getText(node)})`);
          }
        });
      }
    }

    function isEnabled(type) {
      const userOptions = context.options[0] || {};
      if (has(userOptions, type)) {
        return userOptions[type];
      }
      return DEFAULTS[type];
    }

    // --------------------------------------------------------------------------
    // Public
    // --------------------------------------------------------------------------

    return {

      VariableDeclarator: function(node) {
        if (!isEnabled('declaration')) {
          return;
        }
        if (!isEnabled('condition') && node.init && node.init.type === 'ConditionalExpression') {
          check(node.init.consequent);
          check(node.init.alternate);
          return;
        }
        check(node.init);
      },

      AssignmentExpression: function(node) {
        if (!isEnabled('assignment')) {
          return;
        }
        if (!isEnabled('condition') && node.right.type === 'ConditionalExpression') {
          check(node.right.consequent);
          check(node.right.alternate);
          return;
        }
        check(node.right);
      },

      ReturnStatement: function(node) {
        if (isEnabled('return')) {
          check(node.argument);
        }
      },

      'ArrowFunctionExpression:exit': function (node) {
        const arrowBody = node.body;

        if (isEnabled('arrow') && arrowBody.type !== 'BlockStatement') {
          check(arrowBody);
        }
      },

      ConditionalExpression: function(node) {
        if (isEnabled('condition')) {
          check(node.consequent);
          check(node.alternate);
        }
      },

      LogicalExpression: function(node) {
        if (isEnabled('logical')) {
          check(node.right);
        }
      },

      JSXAttribute: function (node) {
        if (isEnabled('prop') && node.value && node.value.type === 'JSXExpressionContainer') {
          check(node.value.expression);
        }
      }
    };
  }
};
