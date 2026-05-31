import { storage } from '../firebase.js'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function uploadCoverImage(file, id) {
  if (!file) throw new Error('No file provided')
  if (file.size > MAX_SIZE) throw new Error('Image must be under 5 MB')
  if (!file.type.startsWith('image/')) throw new Error('File must be an image')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `covers/${id}-${Date.now()}.${ext}`
  const ref = storageRef(storage, path)

  await uploadBytes(ref, file, { contentType: file.type })
  return getDownloadURL(ref)
}
