import { program as cli } from 'commander'
import fs from 'node:fs'

const baseUrl = 'http://sweepstake.services:85'
const teamName = 'cornelius-beer-and-wine'

const words = fs.readFileSync('./words.txt', 'utf-8')
  .split('\r\n')
  .filter(line => line.trim())

cli
  .name('wordle-solver')
  .description('Kata to solve Wordle')

// cli
//   .command('game')
//   .description('Create new game')

cli.parse()

const gameId = await createGame()

const knowledge = {
  perfect: Array(5).fill(null),
  partial: new Set(),
  eliminated: new Set(),
}

let goes = 0

for (const i of Array(20)) {
  console.log('Knowledge', knowledge)

  const candidates = getCandidates(knowledge)
  console.log('Candidates', candidates)

  if (candidates.length === 0) {
    console.log(`No words left 😶 after ${goes} goes`)
    break
  }

  const randomCandidate = randomWord(candidates)
  console.log(`Random candidate ${randomCandidate}`)

  const response = await guess(randomCandidate)
  goes = response.goes

  if (response.solved) {
    console.log(`Solved in ${goes} 🎉`)
    break
  }

  updateKnowledge(response.evaluation)
}

async function guess (word) {
  console.log(`Guessing ${word}`)
  const url = `${baseUrl}/play/${gameId}/guess/${word}`
  console.log('Request', url)
  const response = await fetch(url)
  return await response.json()
}

async function createGame () {
  const response = await fetch(`${baseUrl}/create/${teamName}`)
  const json = await response.json()
  return json.game_id
}

function getCandidates ({ perfect, partial, eliminated }) {
  return words.filter(word => {
    const chars = word.split('')

    const hasEliminatedChar = chars.some(c => eliminated.has(c))
    if (hasEliminatedChar) {
      return false
    }

    const matchesPerfects = perfect.every((c, i) => c === null || chars[i] === c)
    if (!matchesPerfects) {
      return false
    }

    const hasPartials = partial.size === 0 || chars.some(c => partial.has(c))
    return hasPartials
  })
}

function updateKnowledge (evaluation) {
  matchTypes(evaluation, 'Perfect').forEach(({ index, character }) => {
    knowledge.perfect[index] = character
  })

  matchTypes(evaluation, 'None').forEach(({ character }) => {
    knowledge.eliminated.add(character)
  })

  matchTypes(evaluation, 'Partial').forEach(({ character }) => {
    knowledge.partial.add(character)
  })
}

function matchTypes (evaluation, type) {
  return evaluation.filter(({ match_type }) => match_type === type)
}

function scoreBestWord () {
}

function getFrequencies (candidateWords) {
  const frequencyHash = {}

  candidateWords.forEach((word) => {
    word.forEach((letter) => {
      if (letter in frequencyHash) {
        frequencyHash[letter] = 1
      } else {
        frequencyHash[letter] += 1
      }
    })
  })

  return frequencyHash
}

function randomWord (words) {
  return words[
    Math.floor(Math.random() * words.length)
  ]
}
