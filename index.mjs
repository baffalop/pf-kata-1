import { program as cli } from 'commander'
import fs from 'node:fs'

const baseUrl = 'http://sweepstake.services:85'
const teamName = 'cornelius-wine'

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

for (const gameI of Array(1)) {
  console.log(`Game ${gameI}`)

  const gameId = await createGame()

  let goes = 0
  const guesses = []

  const knowledge = {
    perfect: Array(5).fill(null),
    partial: new Set(),
    eliminated: new Set(),
  }

  for (const i of Array(20)) {
    console.log('Knowledge', knowledge)

    const candidates = getCandidates(knowledge)
    console.log('Candidates', candidates)

    if (candidates.length === 0) {
      console.log(`No words left 😶 after ${goes} goes`)
      console.log('Guesses', guesses)
      break
    }

    const bestWord = selectBestWord(candidates)
    console.log('Best word', bestWord)

    const guess = bestWord.word

    guesses.push(guess)
    const response = await makeGuess(gameId, guess)
    goes = response.goes

    if (response.solved) {
      console.log('Guesses', guesses)
      console.log(`Solved in ${goes} 🎉`)
      break
    }

    updateKnowledge(knowledge, response.evaluation)
  }
}

async function makeGuess (gameId, word) {
  console.log(`Guessing ${word}`)
  const url = `${baseUrl}/play/${gameId}/guess/${word}`
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

function updateKnowledge (knowledge, evaluation) {
  matchTypes(evaluation, 'Perfect').forEach(({ index, character }) => {
    knowledge.perfect[index] = character
  })

  matchTypes(evaluation, 'Partial').forEach(({ character }) => {
    knowledge.partial.add(character)
  })

  matchTypes(evaluation, 'None').forEach(({ character }) => {
    if (knowledge.partial.has(character) || knowledge.perfect.includes(character)) {
      return
    }

    knowledge.eliminated.add(character)
  })
}

function matchTypes (evaluation, type) {
  return evaluation.filter(({ match_type }) => match_type === type)
}

function selectBestWord (candidates) {
  const frequencies = getFrequency(candidates)

  return candidates.reduce((best, word) => {
    const score = word.split('').map(c => frequencies[c]).reduce((prev, next) => prev + next)

    return best.score < score ? { word, score } : best
  }, { word: null, score: 0 })
}

function getFrequency (candidateWords) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  const frequencyHash = {}

  alphabet.split('').forEach((letter) => {
    frequencyHash[letter] = 0
  })

  candidateWords.forEach((word) => {
    word.split('').forEach((letter) => {
      frequencyHash[letter] += 1
    })
  })

  return frequencyHash
}

function randomWord (words) {
  return words[
    Math.floor(Math.random() * words.length)
  ]
}
