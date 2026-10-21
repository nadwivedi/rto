import { useState } from 'react'
import apiDocMd from '../../../docs/VEHICLE_INFO_API.md?raw'
import apiDocTxt from '../../../docs/VEHICLE_INFO_API.txt?raw'

const FILE_NAME = 'RTO-Sarthi-Vehicle-Info-API'
const MESSAGE = 'RTO Sarthi Vehicle Info API documentation'
// .txt opens on any phone; .md suits developers who read Markdown
const FORMATS = {
  txt: { doc: apiDocTxt, type: 'text/plain' },
  md: { doc: apiDocMd, type: 'text/markdown' }
}

const download = (text, name, type) => {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Shares docs/VEHICLE_INFO_API.txt (or .md) as a file through the phone / PC share sheet (pick WhatsApp).
 * With `apiKey`, the customer's key is filled in for YOUR_API_KEY.
 * Where files can't be shared, the file is downloaded and WhatsApp opens to attach it.
 */
const ShareApiDocButton = ({ apiKey, className = '' }) => {
  const [note, setNote] = useState('')
  const [format, setFormat] = useState('txt')
  const { doc, type } = FORMATS[format]
  const text = apiKey ? doc.replaceAll('YOUR_API_KEY', apiKey) : doc
  const name = `${FILE_NAME}.${format}`

  const share = async () => {
    setNote('')
    // Some phones only share known file types, so a .md that can't be shared goes as .txt
    const files = [new File([text], name, { type }), new File([text], `${FILE_NAME}.txt`, { type: 'text/plain' })]
    const file = files.find((f) => navigator.canShare?.({ files: [f] }))
    if (file) {
      try {
        await navigator.share({ files: [file], title: MESSAGE, text: MESSAGE })
      } catch (err) {
        if (err.name !== 'AbortError') setNote('Could not share. Try Download.')
      }
      return
    }
    download(text, name, type)
    window.open(`https://wa.me/?text=${encodeURIComponent(`${MESSAGE} (file attached)`)}`, '_blank', 'noopener')
    setNote('File downloaded. Attach it in the WhatsApp chat.')
  }

  return (
    <span className='inline-flex flex-wrap items-center gap-1.5'>
      <span className='inline-flex rounded-lg border border-gray-300 p-0.5' role='group' aria-label='File type'>
        {Object.keys(FORMATS).map((f) => (
          <button
            key={f}
            type='button'
            onClick={() => setFormat(f)}
            aria-pressed={format === f}
            className={`px-2 py-1.5 text-[11px] font-bold uppercase rounded-md cursor-pointer ${
              format === f ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            .{f}
          </button>
        ))}
      </span>
      <button
        type='button'
        onClick={share}
        title={apiKey ? 'Share the API doc with this key filled in' : 'Share the API doc'}
        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer ${className}`}
      >
        <svg className='w-4 h-4' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
          <path d='M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 01-4.82-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.43 9.43 0 01-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47a9.4 9.4 0 016.7 2.78 9.4 9.4 0 012.77 6.7c0 5.22-4.25 9.46-9.47 9.46zm8.06-17.53A11.33 11.33 0 0012.04.63C5.76.63.65 5.74.65 12.02c0 2 .52 3.96 1.52 5.69L.55 23.62l6.05-1.59a11.36 11.36 0 005.44 1.38h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.34-8.05z' />
        </svg>
        Share API Doc
      </button>
      <button
        type='button'
        onClick={() => download(text, name, type)}
        className='px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
      >
        Download
      </button>
      {note && <span className='text-xs text-gray-500'>{note}</span>}
    </span>
  )
}

export default ShareApiDocButton
