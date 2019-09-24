interface NoteContent {
  index: number
  title: string
  desc: string
  body: NoteBody
}

interface Problem {
  desc: string
}

interface NoteBody {
  mySolution: Solution[]
  optimizedSolution: Solution[],
  anki: string
}

interface Solution {
  time: string
  space: string
  language: string
  code: string
}

interface Cell {
  type: string
  data: string
}