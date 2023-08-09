import { program as cli } from 'commander'

const baseUrl = 'http://sweepstake.services:85/'

const teamName = 'cornelius-beer-and-wine'

cli
  .name('wordle-solver')
  .description('Kata to solve Wordle')

cli.parse()

function createGame () {
}
