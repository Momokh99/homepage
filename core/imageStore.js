const DB_NAME = 'homepage'
const STORE = 'backgrounds'
const KEY = 'background'

/** @type {Promise<IDBDatabase> | null} */
let dbPromise = null

/**
 * @param {IDBRequest} request
 * @returns {Promise<any>}
 */
function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE)
      }
      req.onsuccess = () => {
        req.result.onversionchange = () => {
          req.result.close()
          dbPromise = null
        }
        resolve(req.result)
      }
      req.onerror = () => {
        dbPromise = null
        reject(req.error)
      }
    })
  }
  return dbPromise
}

/**
 * @param {Blob} blob
 */
export async function saveImageBlob(blob) {
  const db = await openDB()
  const store = db.transaction(STORE, 'readwrite').objectStore(STORE)
  await requestToPromise(store.put(blob, KEY))
}

/** @returns {Promise<Blob | undefined>} */
export async function loadImageBlob() {
  const db = await openDB()
  const store = db.transaction(STORE).objectStore(STORE)
  return requestToPromise(store.get(KEY))
}