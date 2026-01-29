import {
  useState,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import './FilesPage.css';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { buildDownloadUrl, downloadFile } from '../../api/files';
import saveBlob from '../../utils/DOM/saveBlob';
import {
  fetchFiles,
  uploadFile,
  resetUploadState,
  markDownloaded
} from '../../features/files/filesSlice';
import {
  selectFilesError,
  selectFilesItems,
  selectFilesStatus
 } from '../../features/files/selectors';
import OwnerBadge from '../../components/OwnerBadge/OwnerBadge';
import FilesUploadModal from '../../components/FilesUploadModal/FilesUploadModal';

type TipState =
    {
      comment: string | null,
    }

type OwnerInfo = {
  id: number;
  username: string;
  full_name: string;
  email: string;
};

type LocationState = {
  owner?: OwnerInfo;
};

function normalizeNullableText(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  return v === '' ? null : v;
}

/** Convert bytes to human-readable format
 * @param bytes: number - bites count
 * @returns string of formatted bytes
 * @example
 * formatBytes(1024) // returns '1 KB'
*/
function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '-';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let i = 0;

  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }

  const rounded = i === 0 ? String(Math.round(value)) : value.toFixed(1);
  return `${rounded} ${units[i]}`;
}

/** Convert ISO date string to localized date string
 * @param iso: string | null - ISO date string or null
 * @returns string - formatted date or '—'
 * @example 
 * formatDate('2023-01-01T00:00:00Z') // returns localized date string
*/
function formatDate(iso: string | null): string {
  if (!iso) return '—';

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';

  return d.toLocaleString();
}

export default function FilesPage() {
  const dispatch = useAppDispatch();

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const state = (location.state ?? null) as LocationState | null;

  const userIdRaw = searchParams.get('userId');
  const userId = userIdRaw ? Number(userIdRaw) : null;

  const isOwnList = userId === null;
  const owner = state?.owner ?? null;


  const items = useAppSelector(selectFilesItems);
  const status = useAppSelector(selectFilesStatus);
  const error = useAppSelector(selectFilesError);

  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadComment, setUploadComment] = useState<string>('');

  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const uploadStatus = useAppSelector((state) => state.files.uploadStatus);
  const uploadError = useAppSelector((state) => state.files.uploadError);
  

  const [tip, setTip] = useState<TipState>({ comment: null });

  const hoveredAnchorRef = useRef<HTMLElement | null>(null);
  const commentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (userId === null) {
      dispatch(fetchFiles());
      return;
    }

    if (Number.isFinite(userId)) {
      dispatch(fetchFiles({ userId }));
    }
  }, [dispatch, userId]);

  const openOrDownload = (fileId: number) => {
    const url = buildDownloadUrl(fileId, 'preview');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const tipFallback = useMemo(() => {
    if (status === 'loading') return 'Список загружается...';
    if (status === 'failed') return 'Ошибка загрузки списка';
    return 'Чтобы увидеть подсказку, наведите курсор на элемент списка';
  }, [status]);

  const clearTip = () => {
    hoveredAnchorRef.current = null;
    setTip({ comment: null });
  };

  // Comment tip handlers
  const handleMouseOverCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    const rawTarget = e.target;
    if (!(rawTarget instanceof Element)) return;

    if (commentRef.current && commentRef.current.contains(rawTarget)) return;

    const anchor = rawTarget.closest('[data-file-name-anchor]');
    if (!(anchor instanceof HTMLElement)) {
      if (hoveredAnchorRef.current) clearTip();
      return;
    }

    if (hoveredAnchorRef.current === anchor) return;

    hoveredAnchorRef.current = anchor;

    const comment = normalizeNullableText(anchor.dataset.comment ?? null);
    setTip({ comment: comment });
  };

  const handleMouseLeave = () => {
    if (hoveredAnchorRef.current) clearTip();
  };

  const handleFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const rawTarget = e.target;
    if (!(rawTarget instanceof Element)) return;

    const anchor = rawTarget.closest('[data-file-name-anchor]');
    if (!(anchor instanceof HTMLElement)) return;

    hoveredAnchorRef.current = anchor;

    const comment = normalizeNullableText(anchor.dataset.comment ?? null);
    setTip({ comment: comment });
  };

  const handleBlurCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    const current = e.currentTarget as HTMLElement;

    if (next && current.contains(next)) return;

    if (hoveredAnchorRef.current) clearTip();
  };

  const forwardCommentClickToAnchor = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const anchor = hoveredAnchorRef.current;
    if (!anchor) return;

    anchor.click();
  };
  // END Comment tip handlers

  // Upload modal handlers
  const openUploadModal = () => {
    setUploadingFile(null);
    setUploadComment('');
    dispatch(resetUploadState());
    setIsUploadOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadOpen(false);
  };

  const handleUploadSubmit = () => {
    if (!uploadingFile) return;

    const comment = normalizeNullableText(uploadComment);

    dispatch(
      uploadFile({
        file: uploadingFile,
        comment,
      })
    )
    .unwrap()
    .then(() => {
      setIsUploadOpen(false);
      setUploadingFile(null);
      setUploadComment('');
      dispatch(resetUploadState());
    })
    .catch(() => {});
  };
  // END Upload modal handlers

  // Download handler
  const handleDownload = (fileId: number, originalName: string) => {
    if (downloadingId !== null) return;

    setDownloadError(null);
    setDownloadingId(fileId);

    downloadFile(fileId)
      .then((blob) => {
        saveBlob(blob, originalName);

        dispatch(
          markDownloaded({
            fileId,
            iso: new Date().toISOString(),
          })
        );
      })
      .catch(() => {
        setDownloadError('Не удалось скачать файл. Попробуйте ещё раз позже.');
      })
      .finally(() => {
        setDownloadingId(null);
      });
  }

  return (
    <div className='files'>
      <div className='files__topBar'>
        <h1 className='files__title'>Файлы</h1>
        {downloadError ? (
          <div className='files__downloadError' role='alert'>
            {downloadError}
          </div>
        ) : null}

        <div className='files__topRight'>
          {isOwnList ? (
            <button className='files__uploadBtn' type='button' onClick={openUploadModal}>
              Загрузить
            </button>
          ) : (
            <OwnerBadge owner={owner} userId={userId} />
          )}
        </div>
      </div>

      <FilesUploadModal
        isOpen={isUploadOpen}
        file={uploadingFile}
        comment={uploadComment}
        status={uploadStatus}
        error={uploadError}
        onClose={closeUploadModal}
        onFileChange={setUploadingFile}
        onCommentChange={setUploadComment}
        onSubmit={handleUploadSubmit}
      />

      {status === 'failed' && error && <div className='files__error'>{error}</div>}

      {status !== 'failed' && (
        <div
          className='files__box'
          onMouseOverCapture={handleMouseOverCapture}
          onMouseLeave={handleMouseLeave}
          onFocusCapture={handleFocusCapture}
          onBlurCapture={handleBlurCapture}
        >
          <div className='files__tipZone' role='note'>
            <div className={`filesTip ${tip ? '' : 'filesTip--empty'}`}>
              {tip?.comment && (
                <div
                  className='filesTip__comment'
                  ref={commentRef}
                  onClick={forwardCommentClickToAnchor}
                >
                  <div className='filesTip__commentTitle'>Комментарий:</div>
                  <div className='filesTip__commentText'>{tip.comment}</div>
                </div>
              )}

              <div className='filesTip__label'>
                {tip ? 'Наведите на элемент списка для получения подсказки' : tipFallback}
              </div>
            </div>
          </div>

          <div className='files__xScroll'>
            <div className='files__scrollInner'>
              <div className='files__scroll'>
                <div className='files__header filesGrid'>
                  <div className='files__h files__hNum'>#</div>
                  <div className='files__h'>Имя</div>
                  <div className='files__h'>Размер</div>
                  <div className='files__h'>Загрузка</div>
                  <div className='files__h'>Скачивание</div>
                  <div className='files__h files__hActions'>Действия</div>
                </div>

                {status === 'loading' && <div className='files__hint'>Загружаем список…</div>}

                {status === 'succeeded' && (
                  <ol className='files__list'>
                    {items.map((f, idx) => (
                      <li className='files__row filesGrid' key={f.id}>
                        <div className='files__num'>{idx + 1}</div>

                        <button
                          className='files__name'
                          type='button'
                          onClick={() => openOrDownload(f.id)}
                          data-file-name-anchor='1'
                          data-comment={f.comment ?? ''}
                          title='Открыть/Скачать'
                        >
                          <span className='files__nameText'>{f.original_name}</span>
                        </button>

                        <div className='files__meta'>{formatBytes(f.size_bytes)}</div>
                        <div className='files__meta'>{formatDate(f.uploaded)}</div>
                        <div className='files__meta'>{formatDate(f.last_downloaded)}</div>

                        <div className='files__actions'>
                          <button className='files__iconBtn' type='button' title='Редактировать'>✎</button>
                          <button className='files__iconBtn' type='button' title='Публичная ссылка'>⛓</button>
                          <button
                            className='files__iconBtn files__iconBtn--download'
                            type='button'
                            title={downloadingId === f.id ? 'Скачивание…' : 'Скачать'}
                            onClick={() => handleDownload(f.id, f.original_name)}
                            disabled={downloadingId === f.id}
                          >
                            ⬇
                          </button>
                          <button className='files__iconBtn' type='button' title='Удалить'>✕</button>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {status === 'succeeded' && items.length === 0 && <div className='files__hint'>Пока файлов нет.</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
