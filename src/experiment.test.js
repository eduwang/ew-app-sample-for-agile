import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createEmptyExperiment,
  getRenderableHistory,
  recordRoll,
  rollDie,
} from './experiment.js'

test('주사위 난수의 양 끝을 1과 6으로 바꾼다', () => {
  assert.equal(rollDie(() => 0), 1)
  assert.equal(rollDie(() => 0.999999), 6)
})

test('실제 결과를 누적해 상대도수를 계산한다', () => {
  const afterOne = recordRoll(createEmptyExperiment(), 1)
  const afterTwo = recordRoll(afterOne, 4)
  const afterThree = recordRoll(afterTwo, 1)

  assert.equal(afterThree.totalRolls, 3)
  assert.equal(afterThree.onesCount, 2)
  assert.deepEqual(
    afterThree.history.map((point) => point.frequency),
    [1, 0.5, 2 / 3],
  )
})

test('긴 그래프는 처음과 끝을 유지하며 렌더링 점을 줄인다', () => {
  const history = Array.from({ length: 2500 }, (_, index) => ({
    trial: index + 1,
    frequency: 1 / 6,
  }))
  const rendered = getRenderableHistory(history, 1000)

  assert.equal(rendered.length, 1000)
  assert.equal(rendered[0], history[0])
  assert.equal(rendered.at(-1), history.at(-1))
})
