import { api } from './http';
import type { DownloadMode } from './types';
import type { FileDTO, } from '../features/types';


/** Builds a download URL for a file.
 * @param fileId Requested file ID
 * @param mode Download mode, either 'download' or 'preview'. Default is 'download'.
 * @returns Download URL string.
 * Response of the Django-server is FileResponse(... as_attachment = True ...) 
 * if mode is 'preview'. Else, it is served as inline content.
 */
export function buildDownloadUrl(fileId: number, mode: DownloadMode = 'download'): string {
  const base = `/files/${fileId}/download/`;
  if (mode === 'preview') return `/api${base}?mode=preview`;
  return base;
}

export async function getFiles(userId?: number): Promise<FileDTO[]> {
  const { data } = await api.get<FileDTO[]>('/files/', {
    params: userId ? { user_id: userId } : undefined,
  });

  return data;
}

export async function postFile(file: File, comment: string | null): Promise<FileDTO> {
  const form = new FormData();
  form.append('file', file);

  if (comment !== null) {
    form.append('comment', comment);
  }

  const res = await api.post<FileDTO>('/files/upload/', form);
  return res.data;
}

// Downloads a file as a Blob.
export async function downloadFile(fileId: number): Promise<Blob> {
  const res = await api.get(buildDownloadUrl(fileId), {
    responseType: 'blob',
  });

  return res.data as Blob;
}
