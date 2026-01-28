import { api } from './http';
import type { FileDTO } from '../features/types';

export function buildDownloadUrl(fileId: number): string {
  return `/api/files/${fileId}/download/`;
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
