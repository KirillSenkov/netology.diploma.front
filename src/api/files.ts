import { api } from './http';

export async function getFiles(userId?: number): Promise<FileDTO[]> {
  const { data } = await api.get<FileDTO[]>('/files/', {
    params: userId ? { user_id: userId } : undefined,
  });

  return data;
}

export function buildDownloadUrl(fileId: number): string {
  return `/api/files/${fileId}/download/`;
}
