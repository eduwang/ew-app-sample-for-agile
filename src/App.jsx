import { useCallback, useEffect, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import FrequencyChart from './FrequencyChart.jsx'
import {
  createEmptyExperiment,
  formatFrequency,
  recordRoll,
  rollDie,
} from './experiment.js'

const AUTO_INTERVAL_MS = 650

const PIP_POSITIONS = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
}

function ControlIcon({ name }) {
  const paths = {
    roll: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="9" cy="9" r="1" />
        <circle cx="15" cy="15" r="1" />
      </>
    ),
    play: <path d="M8 5.5 18 12 8 18.5Z" />,
    pause: (
      <>
        <path d="M9 6v12" />
        <path d="M15 6v12" />
      </>
    ),
    reset: (
      <>
        <path d="M5.5 8.5A8 8 0 1 1 4 13" />
        <path d="M5.5 4.5v4h4" />
      </>
    ),
  }

  return (
    <svg
      className="control-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function Die({ face, animationKey, hasRolled }) {
  const visiblePips = PIP_POSITIONS[face]

  return (
    <div
      key={animationKey}
      className={`die${animationKey > 0 ? ' die--rolling' : ''}`}
      role="img"
      aria-label={
        hasRolled
          ? `주사위 눈 ${face}`
          : '아직 굴리지 않은 주사위, 눈 1이 보입니다'
      }
    >
      {Array.from({ length: 9 }, (_, index) => {
        const position = index + 1
        return (
          <span
            className={`pip${visiblePips.includes(position) ? ' pip--visible' : ''}`}
            key={position}
            aria-hidden="true"
          />
        )
      })}
    </div>
  )
}

function App() {
  const hasShownWelcomeNotice = useRef(false)
  const [experiment, setExperiment] = useState(createEmptyExperiment)
  const [currentFace, setCurrentFace] = useState(1)
  const [animationKey, setAnimationKey] = useState(0)
  const [isAutoRolling, setIsAutoRolling] = useState(false)
  const [hasUsedAuto, setHasUsedAuto] = useState(false)

  useEffect(() => {
    if (hasShownWelcomeNotice.current) return
    hasShownWelcomeNotice.current = true

    Swal.fire({
      title: '사용하며 함께 개선하는 앱',
      text: '이 앱은 애자일 개발 과정을 배우기 위해 기본 기능부터 구현한 실습용 앱입니다. 직접 사용해 보며, 사용자의 입장에서 불편한 점과 추가로 필요한 기능을 찾아보세요.',
      confirmButtonText: '확인했어요',
      buttonsStyling: false,
      customClass: {
        popup: 'agile-notice',
        title: 'agile-notice__title',
        htmlContainer: 'agile-notice__body',
        confirmButton: 'agile-notice__confirm',
      },
    })
  }, [])

  const performRoll = useCallback(() => {
    const face = rollDie()
    setCurrentFace(face)
    setAnimationKey((key) => key + 1)
    setExperiment((current) => recordRoll(current, face))
  }, [])

  useEffect(() => {
    if (!isAutoRolling) return undefined

    const timerId = window.setInterval(performRoll, AUTO_INTERVAL_MS)
    return () => window.clearInterval(timerId)
  }, [isAutoRolling, performRoll])

  const toggleAutoRoll = () => {
    if (isAutoRolling) {
      setIsAutoRolling(false)
      return
    }

    performRoll()
    setHasUsedAuto(true)
    setIsAutoRolling(true)
  }

  const resetExperiment = () => {
    setIsAutoRolling(false)
    setHasUsedAuto(false)
    setExperiment(createEmptyExperiment())
    setCurrentFace(1)
    setAnimationKey(0)
  }

  const relativeFrequency = experiment.totalRolls
    ? experiment.onesCount / experiment.totalRolls
    : null

  const autoButtonLabel = isAutoRolling
    ? '일시정지'
    : hasUsedAuto
      ? '계속 굴리기'
      : '자동으로 굴리기'

  return (
    <div className="app-shell">
      <a className="skip-link" href="#experiment">
        실험으로 바로가기
      </a>

      <header className="lab-header container">
        <h1 className="lab-title">데굴데굴 주사위 실험실</h1>
        <p className="lab-intro">
          공정한 주사위를 여러 번 굴리며 ‘1’의 상대도수가 어떻게 달라지는지
          살펴보세요.
        </p>
      </header>

      <main id="experiment">
        <section className="experiment-zone" aria-labelledby="control-title">
          <div className="experiment-layout container">
            <div className="die-stage">
              <Die
                face={currentFace}
                animationKey={animationKey}
                hasRolled={experiment.totalRolls > 0}
              />
              <p className="die-result" aria-live="polite">
                {experiment.totalRolls > 0
                  ? `이번에는 ${currentFace}이 나왔어요.`
                  : '주사위를 굴리면 결과가 여기에 보여요.'}
              </p>
            </div>

            <div className="control-panel">
              <h2 id="control-title">주사위를 굴려 볼까요?</h2>
              <p>
                한 번씩 천천히 확인하거나, 자동 실험으로 변화를 이어서
                관찰할 수 있어요.
              </p>

              <div className="control-grid">
                <button
                  className="control-button control-button--primary"
                  type="button"
                  onClick={performRoll}
                  disabled={isAutoRolling}
                  aria-describedby="auto-status"
                >
                  <ControlIcon name="roll" />
                  한 번 굴리기
                </button>

                <button
                  className="control-button control-button--secondary"
                  type="button"
                  onClick={toggleAutoRoll}
                  aria-pressed={isAutoRolling}
                >
                  <ControlIcon name={isAutoRolling ? 'pause' : 'play'} />
                  {autoButtonLabel}
                </button>

                <button
                  className="control-button control-button--quiet"
                  type="button"
                  onClick={resetExperiment}
                >
                  <ControlIcon name="reset" />
                  처음부터
                </button>
              </div>

              <p className="auto-status" id="auto-status" aria-live="polite">
                {isAutoRolling
                  ? '0.65초마다 자동으로 굴리고 있어요. 한 번 굴리기는 잠시 쉬어요.'
                  : hasUsedAuto
                    ? '자동 실험을 잠시 멈췄어요. 이어서 굴릴 수 있어요.'
                    : '자동 실험은 0.65초마다 결과를 하나씩 더해요.'}
              </p>
            </div>
          </div>
        </section>

        <section className="results-section container" aria-labelledby="results-title">
          <div className="section-heading">
            <h2 id="results-title">쌓여 가는 실험 결과</h2>
            <p>표시할 때만 반올림하고, 계산에는 원래 값을 사용해요.</p>
          </div>

          <dl className="results-grid">
            <div className="result-card result-card--blue">
              <dt>총 시행 횟수</dt>
              <dd className="figure">{experiment.totalRolls.toLocaleString('ko-KR')}</dd>
              <p>지금까지 굴린 횟수</p>
            </div>
            <div className="result-card result-card--mint">
              <dt>1이 나온 횟수</dt>
              <dd className="figure">{experiment.onesCount.toLocaleString('ko-KR')}</dd>
              <p>눈이 1이었던 횟수</p>
            </div>
            <div className="result-card result-card--peach">
              <dt>1이 나온 상대도수</dt>
              <dd className="figure">
                {relativeFrequency === null ? '—' : formatFrequency(relativeFrequency)}
              </dd>
              <p>1이 나온 횟수 ÷ 총 시행 횟수</p>
            </div>
          </dl>
        </section>

        <section className="chart-section" aria-labelledby="chart-title">
          <div className="container">
            <div className="chart-card">
              <div className="section-heading section-heading--chart">
                <h2 id="chart-title">상대도수는 어디로 갈까요?</h2>
                <p>
                  선 위를 가리키거나 키보드 방향키를 눌러 각 시행을 확인해
                  보세요.
                </p>
              </div>

              <FrequencyChart history={experiment.history} />

              <div className="observation-prompts">
                <h3>그래프를 보며 생각해 봐요</h3>
                <p>“많이 굴릴수록 상대도수는 어떻게 변하나요?”</p>
                <p>“시행 횟수가 늘 때마다 반드시 16.7%에 더 가까워질까요?”</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lab-footer container">
        <p>
          이 그래프는 실제 난수 결과를 그대로 누적하며, 1/6에 가깝게
          보이도록 결과를 조정하지 않아요.
        </p>
        <p className="lab-footer__agile-note">
          <strong>사용하며 함께 개선하는 앱</strong>
          이 앱은 애자일 개발 실습용 첫 버전입니다. 직접 사용하며 불편한
          점과 필요한 기능을 찾아보세요.
        </p>
      </footer>
    </div>
  )
}

export default App
