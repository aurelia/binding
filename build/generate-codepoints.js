/**
 * Usage: from the console run "node build/generate-unicode.js"
 */

function compress(codes) {
  // turn number sequences into ranges
  const results = [];
  let index = 0;
  for (const code of codes) {
    if (index === 0) {
      index = 2;
      results.push(code, code + 1);
    } else if (code === results[index - 1]) {
      results[index - 1] = code + 1;
    } else {
      if (results[index - 2] === results[index - 1] - 1) {
        results[index - 1] = 0;
      }
      index += 2;
      results.push(code, code + 1);
    }
  }
  if (results[index - 2] === results[index - 1] - 1) {
    results[index - 1] = 0;
  }
  return results;
}

function getCodePoints(values, intersect, max, min) {
  let results = [];
  // first get the codepoint lists from the unicode lib
  for (const value of values.filter(x => x.length > 1)) {
    results.push(...require(`unicode-10.0.0/${value}/code-points`));
  }

  // filter them by a provided set
  if (intersect) {
    intersect = require(`unicode-10.0.0/${intersect}/code-points`);
    results = results.filter(x => intersect.indexOf(x) > -1);
  }

  // we're staying within the 16 bit range
  results = results.filter(x => x < max);
  if (min) {
    results = results.filter(x => x > min);
  }

  // add any single characters afterwards
  for (const value of values.filter(v => v.length === 1)) {
    results.push(value.codePointAt());
  }

  // remove duplicates and sort
  return Array.from(new Set(results)).sort((a, b) => a === b ? 0 : a - b);
}

function print(name, raw, compressed) {
  let array;
  let header;
  if (compressed) {
    header = `${name} (compressed): "${raw.map(c => String.fromCodePoint(c)).join('')}"`;
    array = compressed.map(c => c > 0 ? `0x${c.toString(16).toUpperCase()}` : 0).join(', ');
  } else {
    header = `${name} (raw):`;
    array = raw.map(c => c > 0 ? `/*${String.fromCodePoint(c)}*/0x${c.toString(16).toUpperCase()}` : 0).join(', ');
  }
  console.log(`\n${header}\n/*${name}*/[${array}]`);
}

const raw = {
  // The only difference between the two lists below is digits 0-9, so we'll simply
  // use IdentifierStart and in the parser make sure to add the digit code points (48-58)
  IdentifierStart: getCodePoints(['_', '$', 'Binary_Property/ASCII', 'Script/Latin'], 'Binary_Property/ID_Start', 0xFFFF),
  IdentifierPart: getCodePoints(['_', '$', 'Binary_Property/ASCII', 'Script/Latin'], 'Binary_Property/ID_Continue', 0xFFFF),
  Skippable: getCodePoints(['Binary_Property/White_Space', 'General_Category/Control'], null, 0xFF),
  ClosePunctuation: getCodePoints(['General_Category/Close_Punctuation'], null, 0x7F),
  OpenPunctuation: getCodePoints(['General_Category/Open_Punctuation'], null, 0x7F),
  Punctuation: getCodePoints(['General_Category/Punctuation'], null, 0x7F),
  MathSymbol: getCodePoints(['General_Category/Math_Symbol'], null, 0x7F),
  Symbol: getCodePoints(['General_Category/Symbol'], null, 0x7F),
  DecimalNumber: getCodePoints(['General_Category/Decimal_Number'], null, 0x7F)
};

// and copy-paste the array from the console
for (const prop in raw) {
  print(`${prop}`, raw[prop], null);
}
for (const prop in raw) {
  const compressed = compress(raw[prop]);
  print(`${prop}`, raw[prop], compressed);
}

