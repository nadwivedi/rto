import { glassCard } from '../lib/styles'
import { glassCard as homeCard } from '../lib/homeStyles'

const YOUTUBE_VIDEO_ID = '4Ri70YEgQuU'

export default function VideoEmbed({
  videoId = YOUTUBE_VIDEO_ID,
  title = 'RTO Sarthi — product overview',
  compact = false,
  vertical = false,
}) {
  const watchUrl = vertical
    ? `https://www.youtube.com/shorts/${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`
  return (
    <div className={vertical ? 'mx-auto w-full max-w-xs text-center' : 'w-full'}>
      <div className={`${compact ? homeCard : glassCard} overflow-hidden p-0`}>
        <div className={`relative w-full ${vertical ? 'aspect-[9/16]' : 'aspect-video'}`}>
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
        className={`mt-2 inline-block ${compact ? 'text-xs' : 'text-sm'} font-semibold text-brand-800 hover:text-accent-600 hover:underline`}
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Watch on YouTube
      </a>
    </div>
  )
}
