/**
 * Hand a blob to the browser as a download.
 *
 * The object URL is revoked immediately after the click because the browser has already taken
 * ownership of the data by then; leaving it alive would retain the whole file in memory.
 *
 * 将 blob 交给浏览器下载。点击后立即释放对象 URL：此时浏览器已接管数据，
 * 继续持有只会让整个文件常驻内存。
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  triggerUrlDownload(objectUrl, filename)
  URL.revokeObjectURL(objectUrl)
}

export function triggerUrlDownload(url: string, filename: string): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}
