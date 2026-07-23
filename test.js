const fs = require('fs');

const constants = fs.readFileSync('./lib/constants.ts', 'utf-8');

// We can just execute the array strings to get the raw JSON
const cablesStr = constants.substring(constants.indexOf('export const CABLES'), constants.length);
// that's too complex to parse safely with regex, let's just use ts-node with --transpile-only
