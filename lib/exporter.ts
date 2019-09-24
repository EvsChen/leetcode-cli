import * as fs from 'fs';

const cliCore = require('./core');
const cli = require('./cli');

const quiverNoteBookDir: string =
  '/Users/elvischen/Documents/Sync/Quiver.qvlibrary/1FC2DD42-ED1D-4AB4-B15E-34BE6FB377F0.qvnotebook/';

const noteDirs: string[] = fs.readdirSync(quiverNoteBookDir);

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

function storeBody(match: string, content: string, parsedBody: NoteBody) {
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

function parseSolution(content: string) : Solution {
  const timeMatch = content.match(/\*Time\*:/);
  const spaceMatch = content.match(/\*Space\*:/);
  const codeEnvMatch = content.match(/```/);
  const untilFirstWrap = (index: number, str: string) => {
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
  const solution : Solution = { time, space, code, language };
  return solution;
}

function parseNoteContent(noteContentPath: string) : Promise<NoteContent> {
  const contentJson = fs.readFileSync(noteContentPath, {
    encoding: 'utf8',
    flag: 'r'
  });
  const { title, cells } : { title: string, cells: Cell[] }
    = JSON.parse(contentJson);
  // Default parsing the first cell
  let body = cells[0].data;
  const parsedBody : NoteBody = {
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
    } else {
      // Last match
      storeBody(match, body, parsedBody);
    }
    curMatch = nextMatch;
  }
  const titleArr = title.split('.');
  const index = parseInt(titleArr[0], 10);

  return new Promise((res, rej) => {
    cliCore.getProblem(index, (e, problem: Problem) => {
      const result : NoteContent = {
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
