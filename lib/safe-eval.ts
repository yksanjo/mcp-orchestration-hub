/**
 * safe-eval.ts
 *
 * A tiny, dependency-free safe expression evaluator for workflow condition
 * nodes. It REPLACES the previous `eval(resolvedCondition)` call, which allowed
 * arbitrary server-side code execution via user-authored condition strings.
 *
 * Supported grammar (only what the condition feature needs):
 *   - literals: numbers (1, 3.14, -2), strings ('a', "b"), true, false, null
 *   - comparison: == != === !== > < >= <=
 *   - logical: && || ! (with short-circuit)
 *   - grouping: ( ... )
 *
 * It does NOT use eval, new Function, property access, function calls, or any
 * identifier other than the boolean/null keywords. Variable references in the
 * original condition are resolved to JSON literals BEFORE this runs (see
 * evaluateCondition), so the parser only ever sees literal values.
 */

type Token =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'bool'; value: boolean }
  | { type: 'null' }
  | { type: 'op'; value: string }
  | { type: 'paren'; value: '(' | ')' };

const MULTI_CHAR_OPS = ['===', '!==', '==', '!=', '>=', '<=', '&&', '||'];
const SINGLE_CHAR_OPS = ['>', '<', '!'];

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }

    // parentheses
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
      continue;
    }

    // strings (single or double quoted, with backslash escapes)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let str = '';
      i++;
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          const next = input[i + 1];
          if (next === 'n') str += '\n';
          else if (next === 't') str += '\t';
          else if (next === 'r') str += '\r';
          else str += next;
          i += 2;
        } else {
          str += input[i];
          i++;
        }
      }
      if (i >= input.length) {
        throw new Error('Unterminated string literal');
      }
      i++; // closing quote
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // numbers (including a leading unary minus when used as a literal sign;
    // the grammar has no binary minus, so '-' followed by a digit is always
    // a sign — JSON.stringify of a resolved variable can produce e.g. "-2")
    const isNegativeSign =
      ch === '-' && i + 1 < input.length && input[i + 1] >= '0' && input[i + 1] <= '9';
    if ((ch >= '0' && ch <= '9') || isNegativeSign) {
      let num = '';
      if (isNegativeSign) {
        num = '-';
        i++;
      }
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i];
        i++;
      }
      const parsed = Number(num);
      if (Number.isNaN(parsed)) {
        throw new Error(`Invalid number literal: ${num}`);
      }
      tokens.push({ type: 'number', value: parsed });
      continue;
    }

    // multi-char operators
    const three = input.slice(i, i + 3);
    const two = input.slice(i, i + 2);
    const multi = MULTI_CHAR_OPS.find(
      (op) => (op.length === 3 && three === op) || (op.length === 2 && two === op)
    );
    if (multi) {
      tokens.push({ type: 'op', value: multi });
      i += multi.length;
      continue;
    }

    // single-char operators
    if (SINGLE_CHAR_OPS.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }

    // keywords: true / false / null
    if (/[a-zA-Z]/.test(ch)) {
      let word = '';
      while (i < input.length && /[a-zA-Z]/.test(input[i])) {
        word += input[i];
        i++;
      }
      if (word === 'true') tokens.push({ type: 'bool', value: true });
      else if (word === 'false') tokens.push({ type: 'bool', value: false });
      else if (word === 'null') tokens.push({ type: 'null' });
      else throw new Error(`Unexpected identifier: ${word}`);
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }

  return tokens;
}

type Value = number | string | boolean | null;

/**
 * Recursive-descent parser/evaluator with precedence:
 *   || (lowest) -> && -> equality -> comparison -> unary ! -> primary
 */
class Parser {
  private pos = 0;
  private tokens: Token[];

  // No TS parameter property here: keep the file erasable-syntax-only so
  // Node's strip-only TypeScript mode can run it directly (node --test).
  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Value {
    const result = this.parseOr();
    if (this.pos < this.tokens.length) {
      throw new Error('Unexpected trailing tokens in expression');
    }
    return result;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private isOp(value: string): boolean {
    const t = this.peek();
    return !!t && t.type === 'op' && t.value === value;
  }

  private parseOr(): Value {
    let left = this.parseAnd();
    while (this.isOp('||')) {
      this.pos++;
      // short-circuit: still parse RHS to keep position consistent
      const right = this.parseAnd();
      left = truthy(left) ? left : right;
    }
    return left;
  }

  private parseAnd(): Value {
    let left = this.parseEquality();
    while (this.isOp('&&')) {
      this.pos++;
      const right = this.parseEquality();
      left = truthy(left) ? right : left;
    }
    return left;
  }

  private parseEquality(): Value {
    let left = this.parseComparison();
    while (this.isOp('==') || this.isOp('===') || this.isOp('!=') || this.isOp('!==')) {
      const op = (this.peek() as { value: string }).value;
      this.pos++;
      const right = this.parseComparison();
      const eq = looseEqual(left, right);
      left = op === '==' || op === '===' ? eq : !eq;
    }
    return left;
  }

  private parseComparison(): Value {
    let left = this.parseUnary();
    while (this.isOp('>') || this.isOp('<') || this.isOp('>=') || this.isOp('<=')) {
      const op = (this.peek() as { value: string }).value;
      this.pos++;
      const right = this.parseUnary();
      left = compare(op, left, right);
    }
    return left;
  }

  private parseUnary(): Value {
    if (this.isOp('!')) {
      this.pos++;
      return !truthy(this.parseUnary());
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Value {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end of expression');

    if (t.type === 'paren' && t.value === '(') {
      this.pos++;
      const inner = this.parseOr();
      const close = this.peek();
      if (!close || close.type !== 'paren' || close.value !== ')') {
        throw new Error('Expected closing parenthesis');
      }
      this.pos++;
      return inner;
    }

    if (t.type === 'number') {
      this.pos++;
      return t.value;
    }
    if (t.type === 'string') {
      this.pos++;
      return t.value;
    }
    if (t.type === 'bool') {
      this.pos++;
      return t.value;
    }
    if (t.type === 'null') {
      this.pos++;
      return null;
    }

    throw new Error(`Unexpected token: ${JSON.stringify(t)}`);
  }
}

function truthy(v: Value): boolean {
  return !!v;
}

function looseEqual(a: Value, b: Value): boolean {
  // Mirror JS == semantics just enough for number/string/bool/null comparisons.
  if (a === null || b === null) return a === b;
  if (typeof a === typeof b) return a === b;
  // cross-type number/string/bool: coerce to number when possible
  return Number(a) === Number(b);
}

function compare(op: string, a: Value, b: Value): boolean {
  // Numeric comparison if both coerce to numbers; otherwise lexicographic string.
  const an = typeof a === 'number';
  const bn = typeof b === 'number';
  let x: number | string;
  let y: number | string;
  if (an && bn) {
    x = a as number;
    y = b as number;
  } else {
    x = String(a);
    y = String(b);
  }
  switch (op) {
    case '>':
      return x > y;
    case '<':
      return x < y;
    case '>=':
      return x >= y;
    case '<=':
      return x <= y;
    default:
      throw new Error(`Unknown comparison operator: ${op}`);
  }
}

/**
 * Safely evaluate a boolean condition expression. Returns the JS-truthiness of
 * the result. Throws on malformed input (callers should treat a throw as false).
 */
export function safeEvaluateCondition(expression: string): boolean {
  const tokens = tokenize(expression);
  if (tokens.length === 0) {
    // An empty condition is treated as false.
    return false;
  }
  const result = new Parser(tokens).parse();
  return truthy(result);
}
