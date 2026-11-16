export function createEmptyExperiment() {
  return {
    totalRolls: 0,
    onesCount: 0,
    history: [],
  }
}

export function rollDie(random = Math.random) {
  return Math.floor(random() * 6) + 1
}

export function recordRoll(experiment, face) {
  if (!Number.isInteger(face) || face < 1 || face > 6) {
    throw new RangeError('주사위 눈은 1부터 6 사이의 정수여야 합니다.')
  }

  const totalRolls = experiment.totalRolls + 1
  const onesCount = experiment.onesCount + (face === 1 ? 1 : 0)

  return {
    totalRolls,
    onesCount,
    history: [
      ...experiment.history,
      {
        trial: totalRolls,
        frequency: onesCount / totalRolls,
      },
    ],
  }
}

export function formatFrequency(value) {
  return `${(value * 100).toFixed(1)}%`
}

export function getRenderableHistory(history, maxPoints = 1000) {
  if (history.length <= maxPoints) return history

  const headCount = Math.min(200, Math.floor(maxPoints / 3))
  const head = history.slice(0, headCount)
  const tailSlots = maxPoints - headCount
  const tailLength = history.length - headCount
  const step = (tailLength - 1) / (tailSlots - 1)
  const tail = Array.from({ length: tailSlots }, (_, index) =>
    history[headCount + Math.round(index * step)],
  )

  return [...head, ...tail]
}
