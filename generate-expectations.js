'use strict';

const fs = require('fs');
const path = require('path');
const promisify = require('util').promisify;

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);

const { parseScriptWithLocation, parseModuleWithLocation } = require('shift-parser');
const spec = require('shift-spec').default;

const stringify = require('./ordered-stringify.js');
const decorateWithLocations = require('./decorate-with-locations.js');


const outdir = 'expectations';
const passdir = './node_modules/test262-parser-tests/pass';


function getNodeKeys(node) {
  if ('type' in node && node.type in spec) {
    return ['type']
      .concat(spec[node.type].fields.map(({name}) => name), ['loc'])
      .filter((v, i, a) => a.indexOf(v) === i);
  }
  if ('start' in node && 'end' in node) {
    return ['start', 'end'];
  }
  const keys = Object.keys(node).sort();
  switch (keys.join(',')) {
    case 'end,start':
      return ['start', 'end'];
    case 'column,line,offset':
      return ['line', 'column', 'offset'];
    default:
      return keys;
  }
}

function getCommentKeys(node) {
  if ('type' in node) {
    return ['type', 'text', 'start', 'end'];
  }
  return ['line', 'column', 'offset'];
}

(async () => {
  try {
    await mkdir(outdir);
  } catch (e) {
    // pass
  }

  const writes = [];
  const passes = await readdir(passdir);
  for (const pass of passes) {
    const { tree, locations, comments } = (/module/.test(pass) ? parseModuleWithLocation : parseScriptWithLocation)(await readFile(passdir + '/' + pass, 'utf8'));
    const renderedTree = stringify(decorateWithLocations(tree, locations), null, '  ', getNodeKeys) + '\n';
    const renderedComments = stringify(comments, null, '  ', getCommentKeys) + '\n';

    writes.push(writeFile(outdir + '/' + pass + '-tree.json', renderedTree, 'utf8'));
    writes.push(writeFile(outdir + '/' + pass + '-comments.json', renderedComments, 'utf8'));
  }

  try {
    await Promise.all(writes);
  } catch(e) {
    console.error('Error writing');
    throw e;
  }
})();
