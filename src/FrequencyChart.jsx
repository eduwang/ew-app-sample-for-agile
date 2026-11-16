import { useCallback, useMemo, useState } from 'react'
import { formatFrequency, getRenderableHistory } from './experiment.js'

const CHART = {
  width: 1000,
  height: 470,
  left: 92,
  right: 34,
  top: 28,
  bottom: 78,
}

const Y_TICKS = [0, 25, 50, 75, 100]
const THEORY_PERCENT = 100 / 6

function FrequencyChart({ history }) {
  const [activeTrial, setActiveTrial] = useState(null)
  const totalTrials = history.length
  const plotWidth = CHART.width - CHART.left - CHART.right
  const plotHeight = CHART.height - CHART.top - CHART.bottom

  const xForTrial = useCallback(
    (trial) => CHART.left + (trial / Math.max(totalTrials, 1)) * plotWidth,
    [plotWidth, totalTrials],
  )
  const yForPercent = useCallback(
    (percent) => CHART.top + ((100 - percent) / 100) * plotHeight,
    [plotHeight],
  )

  const renderableHistory = useMemo(
    () => getRenderableHistory(history),
    [history],
  )

  const observedPath = useMemo(
    () =>
      renderableHistory
        .map((point, index) => {
          const command = index === 0 ? 'M' : 'L'
          return `${command}${xForTrial(point.trial).toFixed(2)},${yForPercent(
            point.frequency * 100,
          ).toFixed(2)}`
        })
        .join(' '),
    [renderableHistory, xForTrial, yForPercent],
  )

  const xTicks = useMemo(() => {
    if (!totalTrials) return [0]
    if (totalTrials < 4) return [0, totalTrials]
    return [...new Set([0, Math.round(totalTrials / 2), totalTrials])]
  }, [totalTrials])

  const activePoint = activeTrial ? history[activeTrial - 1] : null
  const lastPoint = history[totalTrials - 1]

  const setTrialFromPointer = (event) => {
    if (!totalTrials) return
    const rect = event.currentTarget.getBoundingClientRect()
    const chartX = ((event.clientX - rect.left) / rect.width) * CHART.width
    const ratio = Math.min(
      1,
      Math.max(0, (chartX - CHART.left) / plotWidth),
    )
    const trial = Math.min(
      totalTrials,
      Math.max(1, Math.round(ratio * totalTrials)),
    )
    setActiveTrial(trial)
  }

  const handleKeyDown = (event) => {
    if (!totalTrials) return
    const currentTrial = activeTrial ?? totalTrials

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setActiveTrial(Math.max(1, currentTrial - 1))
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setActiveTrial(Math.min(totalTrials, currentTrial + 1))
    }
    if (event.key === 'Home') {
      event.preventDefault()
      setActiveTrial(1)
    }
    if (event.key === 'End') {
      event.preventDefault()
      setActiveTrial(totalTrials)
    }
  }

  return (
    <div className="frequency-chart">
      <div className="chart-legend" aria-label="그래프 범례">
        <span className="legend-item">
          <span className="legend-line legend-line--observed" aria-hidden="true" />
          관측한 상대도수
        </span>
        <span className="legend-item">
          <span className="legend-line legend-line--theory" aria-hidden="true" />
          이론적 확률 1/6 (약 16.7%)
        </span>
      </div>

      <div
        className="chart-scroll"
        role="region"
        aria-label="상대도수 그래프. 작은 화면에서는 좌우로 스크롤할 수 있습니다."
      >
        <div className="chart-surface">
          <svg
            className="chart-svg"
            viewBox={`0 0 ${CHART.width} ${CHART.height}`}
            role="img"
            aria-label={
              totalTrials
                ? `${totalTrials}회 시행까지 1이 나온 상대도수 변화 그래프`
                : '아직 시행 기록이 없는 상대도수 그래프'
            }
            tabIndex="0"
            onFocus={() => totalTrials && setActiveTrial(totalTrials)}
            onBlur={() => setActiveTrial(null)}
            onKeyDown={handleKeyDown}
            onPointerMove={setTrialFromPointer}
            onPointerLeave={() => setActiveTrial(null)}
          >
            {Y_TICKS.map((tick) => {
              const y = yForPercent(tick)
              return (
                <g key={tick}>
                  <line
                    className="chart-grid-line"
                    x1={CHART.left}
                    x2={CHART.width - CHART.right}
                    y1={y}
                    y2={y}
                  />
                  <text
                    className="chart-tick-label"
                    x={CHART.left - 16}
                    y={y + 6}
                    textAnchor="end"
                  >
                    {tick}%
                  </text>
                </g>
              )
            })}

            {xTicks.map((tick) => {
              const x =
                tick === 0 ? CHART.left : xForTrial(Math.max(1, tick))
              return (
                <text
                  className="chart-tick-label"
                  key={tick}
                  x={x}
                  y={CHART.height - CHART.bottom + 34}
                  textAnchor={tick === 0 ? 'start' : tick === totalTrials ? 'end' : 'middle'}
                >
                  {tick.toLocaleString('ko-KR')}
                </text>
              )
            })}

            <line
              className="chart-axis-line"
              x1={CHART.left}
              x2={CHART.left}
              y1={CHART.top}
              y2={CHART.height - CHART.bottom}
            />
            <line
              className="chart-axis-line"
              x1={CHART.left}
              x2={CHART.width - CHART.right}
              y1={CHART.height - CHART.bottom}
              y2={CHART.height - CHART.bottom}
            />

            <line
              className="chart-theory-line"
              x1={CHART.left}
              x2={CHART.width - CHART.right}
              y1={yForPercent(THEORY_PERCENT)}
              y2={yForPercent(THEORY_PERCENT)}
            />
            <text
              className="chart-theory-label"
              x={CHART.width - CHART.right}
              y={yForPercent(THEORY_PERCENT) - 10}
              textAnchor="end"
            >
              1/6 (약 16.7%)
            </text>

            {observedPath && (
              <path className="chart-observed-line" d={observedPath} />
            )}

            {lastPoint && (
              <circle
                className="chart-end-point"
                cx={xForTrial(lastPoint.trial)}
                cy={yForPercent(lastPoint.frequency * 100)}
                r="6"
              />
            )}

            {activePoint && (
              <circle
                className="chart-active-point"
                cx={xForTrial(activePoint.trial)}
                cy={yForPercent(activePoint.frequency * 100)}
                r="10"
              />
            )}

            {!totalTrials && (
              <text
                className="chart-empty-text"
                x={CHART.left + plotWidth / 2}
                y={CHART.top + plotHeight / 2}
                textAnchor="middle"
              >
                주사위를 굴리면 첫 점이 나타나요.
              </text>
            )}

            <text
              className="chart-axis-title"
              x={CHART.left + plotWidth / 2}
              y={CHART.height - 16}
              textAnchor="middle"
            >
              시행 횟수
            </text>
            <text
              className="chart-axis-title"
              x="22"
              y={CHART.top + plotHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90 22 ${CHART.top + plotHeight / 2})`}
            >
              1이 나온 상대도수(%)
            </text>
          </svg>

          {activePoint && (
            <div
              className="chart-tooltip"
              style={{
                left: `${(xForTrial(activePoint.trial) / CHART.width) * 100}%`,
                top: `${(yForPercent(activePoint.frequency * 100) / CHART.height) * 100}%`,
              }}
              role="status"
            >
              <strong>{activePoint.trial.toLocaleString('ko-KR')}회 시행</strong>
              <span>{formatFrequency(activePoint.frequency)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FrequencyChart
