'use strict';

/*
Like JSON.stringify, but allows you to specify the order of keys per-object.

Limitations:
- does not handle boxed primitives well
- replacer cannot be an array (an inherent limitation - replacer-as-array serves a similar purpose to this function)
*/
module.exports = function orderedKeysStringify(value, replacer, space, getKeys) {
  if (typeof getKeys === 'undefined') {
    return JSON.stringify(value, replacer, space);
  }

  if (typeof getKeys !== 'function') {
    throw new TypeError('The getKeys argument to orderedKeysStringify must be undefined or a function');
  }

  if (Array.isArray(replacer)) {
    throw new TypeError('orderedKeysStringify does not support an array as the replacer');
  }

  if (typeof replacer !== 'function') {
    replacer = null;
  }

  // TODO support boxed primitives as space
  let gap = '';
  if (typeof space === 'number') {
    for (let i = 0; i < ct; ++i) {
      gap += ' ';
    }
  } else if (typeof space === 'string') {
    if (space.length > 10) {
      gap = space.substring(0, 10);
    } else {
      gap = space;
    }
  }

  const seen = new WeakSet;
  const colon = gap === '' ? ':' : ': ';
  const linebreak = gap === '' ? '' : '\n';

  return (function internalStringify(parent, key, node, currentIndent) {
    if (node != null) {
      const toJSON = node.toJSON;
      if (typeof toJSON === 'function') {
        node = toJSON.call(node, key);
      }
    }

    if (replacer) {
      node = replacer.call(parent, key, node);
    }

    if (typeof node !== 'object' || node === null) { // TODO also go this route for boxed primitives
      return JSON.stringify(node);
    }

    if (seen.has(node)) {
      throw new TypeError('Converting circular structure to JSON');
    }
    seen.add(node);

    if (Array.isArray(node)) {
      const out = [];
      for (let i = 0; i < node.length; ++i) {
        const v = node[i];
        out.push(linebreak + currentIndent + gap + (internalStringify(node, i, v, currentIndent + gap) || 'null'));
      }
      seen.delete(node);
      if (out.length === 0) {
        return '[]';
      }
      return '[' + out.join(',') + linebreak + currentIndent + ']';
    }

    const keys = getKeys(node);
    const out = [];
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (typeof key !== 'string') {
        throw new TypeError('getKeys returned a key which is not string');
      }
      const valStr = internalStringify(node, key, node[key], currentIndent + gap);
      if (valStr === void 0) {
        continue;
      }

      out.push(linebreak + currentIndent + gap + JSON.stringify(key) + colon + valStr);
    }
    seen.delete(node);
    if (out.length === 0) {
      return '{}';
    }
    return '{' + out.join(',') + linebreak + currentIndent + '}';
  })(null, '', value, '');
};
