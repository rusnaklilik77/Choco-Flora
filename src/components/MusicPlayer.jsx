import { useEffect, useRef, useState } from 'react'
import { getSongKind, toDirectAudioUrl, extractYouTubeId } from '../utils/driveTools'

// ---------------------------------------------------------------------
// Официальный YouTube IFrame Player API (https://www.youtube.com/iframe_api)
// ---------------------------------------------------------------------
// Раньше плеер управлялся "вслепую" — команды слались через postMessage
// напрямую в iframe, не зная, готов ли внутренний плеер их принять
// (отсюда задержки-подстраховки [300, 900, 1800] мс). Теперь вместо этого
// используется официальный JS API: он сам грузит скрипт, сам создаёт
// плеер и сообщает о готовности через колбэк onReady — команды посылаются
// только после него, без гаданий.
//
// Скрипт грузится один раз на всю страницу и переиспользуется между
// сменами темы/песни (и даже между несколькими экземплярами компонента).
let ytApiPromise = null
function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (ytApiPromise) return ytApiPromise

  ytApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady
    // YouTube вызывает этот глобальный колбэк ровно один раз, когда его
    // скрипт полностью загрузился и window.YT готов к использованию.
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') previousCallback()
      resolve(window.YT)
    }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })
  return ytApiPromise
}

// Плеер фоновой музыки текущей темы. Ссылка на песню задаётся в админке,
// в редакторе темы (см. AdminThemesPanel.jsx) — YouTube-ролик или
// аудиофайл (например, с Google Диска).
//
// Как это работает (важно для надёжности воспроизведения):
// 1) Трек запускается СРАЗУ, как только страница готова — но приглушённым
//    (muted). Приглушённый автозапуск браузеры разрешают всегда, без
//    каких-либо действий посетителя — поэтому музыка гарантированно уже
//    "играет" с первой секунды.
// 2) Как только происходит самое первое взаимодействие со страницей —
//    касание, клик или нажатие клавиши где угодно (не обязательно по
//    специальной кнопке) — звук просто включается (unMute) у уже играющего
//    трека. Это разрешено браузерами и не требует повторной загрузки.
//    Слушатели интерактивности висят на странице ВСЕГДА, с самого первого
//    рендера — даже если тема/ссылка на песню ещё не успели загрузиться из
//    базы. Если посетитель тапнул раньше, чем пришли данные (или раньше,
//    чем YouTube-плеер прислал onReady), это запоминается в
//    hasInteractedRef и звук включается сразу, как только это становится
//    возможным — без необходимости тапать ещё раз.
// 3) Пока звук выключен, в углу экрана видна кнопка 🔇 — прямая подсказка
//    посетителю, что можно тапнуть и включить звук самому.
export default function MusicPlayer({ songUrl }) {
  const audioRef = useRef(null)
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const kindRef = useRef(null)
  const hasInteractedRef = useRef(false)
  const isPlayerReadyRef = useRef(false)
  const [unlocked, setUnlocked] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const kind = getSongKind(songUrl)
  const videoId = kind === 'youtube' ? extractYouTubeId(songUrl) : null
  const audioSrc = kind === 'audio' ? toDirectAudioUrl(songUrl) : ''

  kindRef.current = kind

  // Создаём (или пересоздаём при смене ролика/темы) настоящий YT.Player
  // через официальный API.
  //
  // ВАЖНО (это и была причина белого экрана при смене темы, требовавшего
  // перезагрузки страницы): YouTube IFrame API не заполняет переданный
  // элемент — он его ЦЕЛИКОМ ЗАМЕНЯЕТ на свой <iframe> прямо в DOM, в
  // обход React. Если отдать ему containerRef.current (узел, которым
  // управляет React), React продолжает думать, что этот <div> всё ещё
  // на месте — а физически там уже <iframe> от YouTube. При следующей
  // смене темы React пытается обновить/удалить свой (уже не существующий)
  // узел и падает с ошибкой вроде "Failed to execute 'removeChild' on
  // 'Node'" — без ErrorBoundary это роняет всё приложение в белый экран,
  // и помогает только F5.
  //
  // Исправление: React управляет только ВНЕШНИМ div (containerRef).
  // Внутрь него мы вручную (в обход React) вставляем ещё один, пустой
  // div и отдаём YouTube именно его — что бы YouTube с ним ни делал,
  // React об этом даже не узнает, потому что никогда не рендерил
  // содержимое containerRef через JSX.
  useEffect(() => {
    if (kind !== 'youtube' || !videoId || !containerRef.current) return
    let cancelled = false
    isPlayerReadyRef.current = false
    setLoadError(false)

    const mountNode = document.createElement('div')
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(mountNode)

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled) return
      playerRef.current = new YT.Player(mountNode, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          loop: 1,
          playlist: videoId,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          // Плеер готов принимать команды — раньше этот момент приходилось
          // угадывать через postMessage-задержки, теперь браузер сообщает
          // о нём сам.
          onReady: (event) => {
            isPlayerReadyRef.current = true
            event.target.playVideo()
            // Посетитель уже тапнул по странице раньше, чем плеер
            // подготовился (или это смена темы после того, как звук уже
            // был включён) — включаем звук сразу, без повторного тапа.
            if (hasInteractedRef.current) {
              event.target.unMute()
              event.target.playVideo()
              setUnlocked(true)
              setPlaying(true)
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) setPlaying(true)
            if (event.data === window.YT.PlayerState.PAUSED) setPlaying(false)
          },
          // Например, ролик недоступен/удалён/встраивание запрещено —
          // показываем ту же индикацию ошибки, что и для битой аудиоссылки.
          onError: () => {
            setLoadError(true)
          },
        },
      })
    })

    return () => {
      cancelled = true
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy()
      }
      playerRef.current = null
      isPlayerReadyRef.current = false
      // Чистим ВНЕШНИЙ div (им управляет React, ему можно). destroy() выше
      // уже убрал сам iframe — это просто подчищает mountNode на случай,
      // если промис выше ещё не успел создать плеер к моменту cleanup.
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, kind])

  const unlockSound = () => {
    if (!kindRef.current) return
    setUnlocked(true)
    setPlaying(true)
    if (kindRef.current === 'audio' && audioRef.current) {
      audioRef.current.muted = false
      audioRef.current.play().catch(() => {})
    }
    if (kindRef.current === 'youtube' && playerRef.current && isPlayerReadyRef.current) {
      playerRef.current.unMute()
      playerRef.current.playVideo()
    }
    // Если YouTube-плеер ещё не прислал onReady к этому моменту — ничего
    // страшного, hasInteractedRef уже установлен снаружи, и onReady сам
    // включит звук, как только плеер будет готов (см. выше).
  }

  // Самое первое взаимодействие посетителя со страницей — включает звук.
  //
  // ВАЖНО #1: браузер разрешает вызывать audio.play() / отправлять команду
  // "unMute" в YouTube-плеер только внутри НАСТОЯЩЕГО "user gesture" —
  // а таким считаются далеко не любые события. По спецификации и по факту
  // (Chrome, Safari, Android, iOS) это click, touchend и keydown.
  // "pointerdown" и "touchstart" НЕ считаются — потому что в момент
  // касания браузер ещё не знает, тап это или начало скролла, и решает
  // это только к touchend. Раньше здесь стояли именно pointerdown/touchstart
  // с флагом { once: true } — из-за этого происходило вот что: при касании
  // экрана срабатывал touchstart, попытка включить звук браузер тут же
  // отклонял (это не валидный gesture), ошибка тихо проглатывалась в
  // catch(() => {}), а слушатель (once: true) уже удалял себя и заодно ВСЕ
  // остальные — включая keydown. То есть настоящий touchend от того же
  // самого касания уже не мог сработать: слушателей больше не было. Именно
  // поэтому музыка не включалась вообще, хотя человек и тапал по экрану.
  //
  // ВАЖНО #2: слушатели вешаются один раз при монтировании ([] в конце) и
  // живут всё время, пока звук не включён — НЕ дожидаясь, пока подгрузится
  // songUrl из базы. kindRef проверяется в момент самого клика, а если в
  // этот момент песни ещё нет — интерес запоминается в hasInteractedRef,
  // и отдельный эффект ниже включит звук сразу же, как только songUrl
  // придёт с сервера, без повторного клика посетителя.
  useEffect(() => {
    const onFirstInteraction = () => {
      hasInteractedRef.current = true
      unlockSound()
    }
    const events = ['click', 'touchend', 'keydown']
    events.forEach((ev) => window.addEventListener(ev, onFirstInteraction, { capture: true, passive: true }))
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onFirstInteraction, { capture: true }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Песня появилась/сменилась ПОСЛЕ того, как посетитель уже тапнул по
  // странице (пока данные ещё грузились) — включаем звук сразу, без
  // ожидания повторного клика.
  useEffect(() => {
    if (kind && hasInteractedRef.current && !unlocked) {
      unlockSound()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind])

  // Смена активной темы сайта (аудиофайл) — переключаемся на песню новой
  // темы. Для YouTube это уже не нужно: смена videoId выше пересоздаёт
  // плеер и сам включает звук в onReady, если он уже был включён.
  useEffect(() => {
    if (kind === 'audio' && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
      setPlaying(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songUrl, kind])

  // Обрабатываем ошибку загрузки самого файла музыки — если ссылка на
  // Диске/хостинге ведёт не на прямой аудиофайл, а, например, на HTML-
  // страницу просмотра или "Google не может проверить файл на вирусы"
  // (типично для больших файлов на Google Диске), браузер выдаст ошибку
  // загрузки, а не молчание из-за автозапуска. Отличаем эти два случая
  // явно, чтобы не тратить время на пустые попытки "тапнуть ещё раз".
  useEffect(() => {
    setLoadError(false)
  }, [audioSrc])

  const handleAudioError = () => {
    if (kindRef.current === 'audio' && audioSrc) {
      console.error(
        '[choco-flora] Не удалось загрузить файл музыки темы. Ссылка ведёт не на прямой ' +
          'аудиофайл (например, это страница просмотра Google Диска, а не прямая ссылка, ' +
          'или Диск требует подтверждения для больших файлов). Проверьте ссылку в ' +
          'Админка → Темы → Песня:',
        audioSrc
      )
      setLoadError(true)
    }
  }

  if (!kind) return null

  return (
    <>
      {kind === 'audio' && audioSrc && (
        <audio
          key={audioSrc}
          ref={audioRef}
          src={audioSrc}
          loop
          preload="auto"
          autoPlay
          muted={!unlocked}
          onError={handleAudioError}
        />
      )}
      {kind === 'youtube' && videoId && (
        // Официальный YT.Player сам вставит внутрь свой iframe (см. эффект
        // выше) — руками ни src, ни дочерние элементы мы больше не задаём.
        <div ref={containerRef} className="yt-audio-frame" />
      )}
    </>
  )
}
