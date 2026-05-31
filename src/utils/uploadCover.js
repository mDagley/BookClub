const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function uploadCoverImage(file, _id) {
  if (!file) throw new Error('No file provided')
  if (file.size > MAX_SIZE) throw new Error('Image must be under 5 MB')
  if (!file.type.startsWith('image/')) throw new Error('File must be an image')

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Upload failed')
  }
  const { url } = await res.json()
  return url
}
