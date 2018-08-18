/* This code takes the original OT/rich-text type
and adds presence logic written by Greg Kubisa for
his fork of ShareDB. Thanks Greg! */

var Delta = require('quill-delta');

function create(initial) {
  return new Delta(initial);
}

function apply(snapshot, delta) {
  snapshot = new Delta(snapshot);
  delta = new Delta(delta);
  return snapshot.compose(delta);
}

function compose(delta1, delta2) {
  delta1 = new Delta(delta1);
  delta2 = new Delta(delta2);
  return delta1.compose(delta2);
}

function diff(delta1, delta2) {
  delta1 = new Delta(delta1);
  delta2 = new Delta(delta2);
  return delta1.diff(delta2);
}

function transform(delta1, delta2, side) {
  delta1 = new Delta(delta1);
  delta2 = new Delta(delta2);
  // Fuzzer specs is in opposite order of delta interface
  return delta2.transform(delta1, side === 'left');
}

function transformCursor(cursor, delta, isOwnOp) {
  return delta.transformPosition(cursor, !isOwnOp);
}

function normalize(delta) {
  return delta;   // quill-delta is already canonical
}

function serialize(delta) {
  return delta.ops;
}

function deserialize(ops) {
  return new Delta(ops);
}

function isValidPresence(presence) {
  if (
      presence == null ||
      typeof presence !== 'object' ||
      typeof presence.u !== 'string' ||
      typeof presence.c !== 'number' ||
      !isFinite(presence.c) ||
      Math.floor(presence.c) !== presence.c ||
      !Array.isArray(presence.s)
  ) {
      return false
  }

  const selections = presence.s

  for (let i = 0, l = selections.length; i < l; ++i) {
      const selection = selections[i]

      if (
          !Array.isArray(selection) ||
          selection.length !== 4 ||
          selection[0] !== (selection[0] | 0) ||
          selection[1] !== (selection[1] | 0) //||
          //selection[2] !== (selection[2] | 0)
      ) {
          return false
      }
  }
  return true
}

function createPresence(presence) {
  return isValidPresence(presence) ? presence : { u: '', c: 0, s: [] }
}

function transformPresence(presence, operation, isOwnOperation) {
  const user = presence.u
  const change = presence.c
  const selections = presence.s
  const newSelections = new Array(selections.length)
  if(!((typeof operation) == "Delta")) {
    operation = new Delta(operation);
  }
  for (let i = 0, l = selections.length; i < l; ++i) {
      const selection = selections[i]
      const id = selection[2]
      const cardType = selection[3];
      const newStart = transformCursor(selection[0], operation, isOwnOperation)
      const newEnd = selection[0] === selection[1] ? newStart :
          transformCursor(selection[1], operation, isOwnOperation)
      newSelections[i] = [ newStart, newEnd, id, cardType ]
  }

  return {
      u: user,
      c: change,
      s: newSelections
  } 
} 

function comparePresence(presence1, presence2) {
  if (presence1 === presence2) {
      return true
  }

  if (
      presence1 == null ||
      presence2 == null ||
      presence1.u !== presence2.u ||
      presence1.c !== presence2.c ||
      presence1.s.length !== presence2.s.length
  ) {
      return false
  }

  for (let i = 0, l = presence1.s.length; i < l; ++i) {
      if (presence1.s[i][0] !== presence2.s[i][0] || presence1.s[i][1] !== presence2.s[i][1] || presence1.s[i][2] !== presence2.s[i][2] || presence1.s[i][3] !== presence2.s[i][3]) {
          return false
      }
  }

  return true
}

module.exports = {
  Delta: Delta,
  type: {
    name: 'rich-text',
    uri: 'https://github.com/ottypes/rich-text/v1',
    create,
    apply,
    compose,
    diff,
    transform,
    transformCursor,
    normalize,
    serialize,
    deserialize,
    isValidPresence,
    createPresence,
    transformPresence,
    comparePresence
  }
};


