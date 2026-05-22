import { glassCard } from '../lib/styles'

const YOUTUBE_VIDEO_ID = '4Ri70YEgQuU'
const YOUTUBE_WATCH_URL = 'https://youtu.be/4Ri70YEgQuU?si=ZH1f5uP5ZXMO6qfY'

export default function VideoEmbed({
  videoId = YOUTUBE_VIDEO_ID,
  title = 'RTO Sarthi — product overview',
}) {
  return (
    <div className="w-full">
      <div className={`${glassCard} overflow-hidden p-0`}>
        <div className="relative aspect-video w-full">
          <iframe
            className="absolute inset-0 h-full w-full border-0"
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
      <a
        className="mt-2 inline-block text-xs font-semibold text-brand-800 hover:text-accent-600 hover:underline"
        href={YOUTUBE_WATCH_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        Watch on YouTube
      </a>
    </div>
  )
}
