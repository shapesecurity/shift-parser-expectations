'use strict';

module.exports = function decorateWithLocations(tree, locations) {
  if (typeof tree !== 'object' || tree === null) {
    return tree;
  }
  if (Array.isArray(tree)) {
    return tree.map(n => decorateWithLocations(n, locations));
  }
  const copy = {};
  for (let [k, v] of Object.entries(tree)) {
    copy[k] = decorateWithLocations(v, locations);
  }
  if (locations.has(tree)) {
    copy.loc = locations.get(tree);
  }
  return copy;
};
