// Cloudinary URL의 /upload/ 뒤에 축소 변환 파라미터를 끼워 넣어 원본 대신
// 미리 생성된 썸네일을 받아온다. 백엔드 업로드 시점에 동일한 변환을 eager로
// 미리 만들어두므로(CloudinaryImageUploader) 이 URL은 최초 요청부터 캐시에 적중한다.
const THUMBNAIL_TRANSFORM = 'w_160,h_160,c_fill,q_auto,f_auto'

export function cloudinaryThumbnail<T extends string | null | undefined>(url: T): T {
  if (!url) return url
  const marker = '/upload/'
  const index = url.indexOf(marker)
  if (index === -1) return url
  const insertAt = index + marker.length
  return (url.slice(0, insertAt) + THUMBNAIL_TRANSFORM + '/' + url.slice(insertAt)) as T
}
