/**
 * Data fetched at build time for a prerendered page (blog list and blog posts).
 * At build time src/prerender.jsx sets it before rendering; in the browser it is read from the
 * <script id="prerender-data"> tag in <head>, so the first render matches the prerendered HTML.
 */
let serverData = null

export function setServerData(data) {
  serverData = data
}

let clientData
function readClientData() {
  if (clientData === undefined) {
    try {
      clientData = JSON.parse(document.getElementById('prerender-data')?.textContent || 'null')
    } catch {
      clientData = null
    }
  }
  return clientData
}

/** The build-time data for this path, or null if the page wasn't prerendered with data */
export function getInitialData(pathname) {
  const data = typeof document === 'undefined' ? serverData : readClientData()
  return data && data.url === pathname ? data : null
}
