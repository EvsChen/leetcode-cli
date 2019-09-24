"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const cliCore = require('./core');
const cli = require('./cli');
const quiverNoteBookDir = '/Users/elvischen/Documents/Sync/Quiver.qvlibrary/1FC2DD42-ED1D-4AB4-B15E-34BE6FB377F0.qvnotebook/';
const noteDirs = fs.readdirSync(quiverNoteBookDir);
cli.runNext(main);
function main() {
    const promiseArr = noteDirs.map(noteDir => {
        const fullNotePath = quiverNoteBookDir + noteDir;
        const noteMetaPath = fullNotePath + '/' + 'meta.json';
        const noteContentPath = fullNotePath + '/' + 'content.json';
        if (!fs.existsSync(noteContentPath)) {
            return Promise.resolve({});
        }
        return parseNoteContent(noteContentPath);
    });
    Promise.all(promiseArr).then(problems => {
        const output = { problems };
        const outputName = 'lcNotes.json';
        const fullOutputName = process.cwd() + '/' + outputName;
        if (fs.existsSync(fullOutputName)) {
            fs.unlinkSync(fullOutputName);
        }
        fs.writeFileSync(fullOutputName, JSON.stringify(output));
    });
}
function storeBody(match, content, parsedBody) {
    if (/anki/i.test(match)) {
        // Anki solution
        parsedBody['anki'] = content;
        return;
    }
    if (/Optimized/.test(match)) {
        // Optimized solution
        parsedBody.optimizedSolution.push(parseSolution(content));
        return;
    }
    if (/solution/i.test(match)) {
        // My solution
        parsedBody.mySolution.push(parseSolution(content));
        return;
    }
    parsedBody[match] = content;
}
function parseSolution(content) {
    const timeMatch = content.match(/\*Time\*:/);
    const spaceMatch = content.match(/\*Space\*:/);
    const codeEnvMatch = content.match(/```/);
    const untilFirstWrap = (index, str) => {
        const firstInd = str.indexOf('\n', index);
        if (firstInd === -1) {
            return '';
        }
        return str.substring(index, firstInd).trim();
    };
    let time = '', space = '', code = '', language = '';
    if (timeMatch) {
        time = untilFirstWrap(timeMatch.index + timeMatch[0].length, content);
    }
    if (spaceMatch) {
        space = untilFirstWrap(spaceMatch.index + spaceMatch[0].length, content);
    }
    if (codeEnvMatch) {
        language = untilFirstWrap(codeEnvMatch.index + codeEnvMatch[0].length, content);
        const allCode = content.slice(codeEnvMatch.index).split('\n');
        // Remove first row
        allCode.shift();
        let i = allCode.length - 1;
        // Remove last row
        while (allCode[i].length === 0 || !allCode[i].startsWith("```")) {
            i--;
            allCode.pop();
        }
        allCode.pop();
        code = allCode.join('\n');
    }
    const solution = { time, space, code, language };
    return solution;
}
function parseNoteContent(noteContentPath) {
    const contentJson = fs.readFileSync(noteContentPath, {
        encoding: 'utf8',
        flag: 'r'
    });
    const { title, cells } = JSON.parse(contentJson);
    // Default parsing the first cell
    let body = cells[0].data;
    const parsedBody = {
        mySolution: [],
        optimizedSolution: [],
        anki: ''
    };
    // Parse body into sections
    let curMatch = body.match(/\*\*(.+)\*\*:/);
    while (curMatch) {
        const { 0: exact, 1: match, index } = curMatch;
        body = body.slice(index + exact.length);
        const nextMatch = body.match(/\*\*(.+)\*\*:/);
        if (nextMatch) {
            const { index: nextIndex } = nextMatch;
            storeBody(match, body.substring(0, nextIndex).trim(), parsedBody);
        }
        else {
            // Last match
            storeBody(match, body, parsedBody);
        }
        curMatch = nextMatch;
    }
    const titleArr = title.split('.');
    const index = parseInt(titleArr[0], 10);
    return new Promise((res, rej) => {
        cliCore.getProblem(index, (e, problem) => {
            const result = {
                index,
                title: titleArr[1].trim(),
                body: parsedBody,
                desc: ''
            };
            if (e) {
                console.log(title);
                console.error(`Problem ${index} not found!`);
                res(result);
            }
            result.desc = problem.desc;
            res(result);
        });
    });
}
//# sourceMappingURL=exporter.js.map