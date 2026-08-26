const DB_NAME = 'homepage'
const STORE = 'backgrounds'
const KEY = 'background'

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveImageBlob(blob) {
  const db = await openDB()
  const store = db.transaction(STORE, 'readwrite').objectStore(STORE)
  await requestToPromise(store.put(blob, KEY))
}

export async function loadImageBlob() {
  const db = await openDB()
  const store = db.transaction(STORE).objectStore(STORE)
  return requestToPromise(store.get(KEY))
}
