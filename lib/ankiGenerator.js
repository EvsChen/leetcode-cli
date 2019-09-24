"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const noteJsonPath = '/Users/elvischen/leetcode-cli/lcNotes.json';
if (!fs.existsSync(noteJsonPath)) {
    console.error('Notes json not exist');
    process.exit(1);
}
const noteJson = fs.readFileSync(noteJsonPath, { encoding: 'utf8', flag: 'r' });
const notes = JSON.parse(noteJson);
const problems = notes.problems;
let result = '';
function escapeForHtml(desc) {
    const problemLines = desc
        .replace(/\r/g, '')
        .replace(/\t/g, '&nbsp;&nbsp;')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\$([^$]+)\$/g, '\\($1\\)')
        .split('\n');
    let i = 0;
    while (i < problemLines.length) {
        if (problemLines[i].length === 0 &&
            i + 1 < problemLines.length &&
            problemLines[i + 1].length === 0) {
            problemLines.splice(i + 1, 1);
            continue;
        }
        i++;
    }
    return problemLines.map(val => `<div>${val}</div>`).join('');
}
for (const problem of problems) {
    const { body, index, title, desc } = problem;
    if (!index || !body) {
        continue;
    }
    const { anki } = body;
    if (!anki) {
        continue;
    }
    result += `${index} \t <div>${index}. ${title}</div>${escapeForHtml(desc)} \t ${escapeForHtml(anki)}`;
    result += '\n';
}
const outputName = 'ankiCards.txt';
const outputFullPath = process.cwd() + '/' + outputName;
if (fs.existsSync(outputFullPath)) {
    fs.unlinkSync(outputFullPath);
}
fs.writeFileSync(outputFullPath, result);
//# sourceMappingURL=ankiGenerator.js.map