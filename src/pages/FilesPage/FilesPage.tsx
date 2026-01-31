import {
  useState,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import './FilesPage.css';
import type { FileDTO } from '../../features/types';
import {
  normalizeNullableText,
  normalizeCommentForApi,
  formatBytes,
  formatDate,
  errorToMessage,
} from '../../utils/utils';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  buildDownloadUrl,
  downloadFile,
  patchRenameFile,
  patchCommentFile,
} from '../../api/files';
import saveBlob from '../../utils/DOM/saveBlob';
import {
  fetchFiles,
  uploadFile,
  removeFile,
  resetUploadState,
  markDownloaded,
  updateFileMeta
} from '../../features/files/filesSlice';
import {
  selectFilesError,
  selectFilesItems,
  selectFilesStatus
 } from '../../features/files/selectors';
import OwnerBadge from '../../components/OwnerBadge/OwnerBadge';
import FilesUploadModal from '../../components/FilesUploadModal/FilesUploadModal';
import FilesDeleteModal from '../../components/FilesDeleteModal/FilesDeleteModal';
import FilesEditModal from '../../components/FilesEditModal/FilesEditModal';

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

  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [editingFile, setEditingFile] = useState<FileDTO | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editComment, setEditComment] = useState<string>('');
  const [editBusy, setEditBusy] = useState<boolean>(false);
  const [editErrors, setEditErrors] = useState<string[]>([]);

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

  // Delete modal handlers
  const openDeleteModal = (fileId: number, fileName: string) => {
    setDeleteError(null);
    setDeleteTarget({ id: fileId, name: fileName });
    setIsDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteBusy) return;
    setIsDeleteOpen(false);
    setDeleteTarget(null);
    setDeleteError(null);
  };
  

  const handleDeleteConfirm = () => {
    if (!deleteTarget || deleteBusy) return;

    setDeleteBusy(true);
    setDeleteError(null);

    dispatch(removeFile({ fileId: deleteTarget.id }))
      .unwrap()
      .then(() => {
        setIsDeleteOpen(false);
        setDeleteTarget(null);
        setDeleteError(null);
      })
      .catch((e: unknown) => {
        const msg =
          typeof e === 'object' && e !== null && 'detail' in e && typeof (e as any).detail === 'string'
            ? (e as any).detail
            : 'Не удалось удалить файл. Попробуйте ещё раз позже.';
        setDeleteError(msg);
      })
      .finally(() => {
        setDeleteBusy(false);
      });
  };
  // END Delete modal handlers

  // Edit modal handlers
  const handleEditOpen = (f: FileDTO) => {
    setEditErrors([]);
    setEditingFile(f);
    setEditName(f.original_name ?? '');
    setEditComment(f.comment ?? '');
  };

  const handleEditClose = () => {
    if (editBusy) return;
    setEditingFile(null);
    setEditErrors([]);
  };

  const handleEditSubmit = () => {
    const f = editingFile;
    if (!f || editBusy) return;

    const initialName = f.original_name ?? '';
    const initialComment = f.comment ?? null;

    const newName = editName.trim();
    const newComment = normalizeCommentForApi(editComment);

    const nameChanged = newName !== initialName;
    const commentChanged = newComment !== initialComment;


    if (!nameChanged && !commentChanged) {
      handleEditClose();
      return;
    }

    setEditBusy(true);
    setEditErrors([]);

    const ops: Promise<void>[] = [];
    const errors: string[] = [];

    if (nameChanged) {
      ops.push(
        patchRenameFile(f.id, newName)
          .then((res) => {
            dispatch(updateFileMeta({ fileId: f.id, original_name: res.original_name }));
          })
          .catch((e: unknown) => {
            errors.push(errorToMessage(e, 'Не удалось переименовать файл.'));
          })
      );
    }

    if (commentChanged) {
      ops.push(
        patchCommentFile(f.id, newComment)
          .then((res) => {
            dispatch(updateFileMeta({ fileId: f.id, comment: res.comment }));
          })
          .catch((e: unknown) => {
            errors.push(errorToMessage(e, 'Не удалось обновить комментарий.'));
          })
      );
    }

    Promise.allSettled(ops)
      .then(() => {
        if (errors.length > 0) {
          setEditErrors(errors);
          return;
        }

        setEditingFile(null);
        setEditErrors([]);
      })
      .finally(() => {
        setEditBusy(false);
      });
  };
  // END Edit modal handlers

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

      <FilesDeleteModal
        isOpen={isDeleteOpen}
        fileName={deleteTarget?.name ?? ''}
        isBusy={deleteBusy}
        error={deleteError}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
      />

      <FilesEditModal
        isOpen={Boolean(editingFile)}
        name={editName}
        comment={editComment}
        isBusy={editBusy}
        errors={editErrors}
        onClose={handleEditClose}
        onNameChange={setEditName}
        onCommentChange={setEditComment}
        onSubmit={handleEditSubmit}
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

                          <button
                            className='files__iconBtn'
                            type='button'
                            title='Редактировать'
                            onClick={() => handleEditOpen(f)}
                          >
                            ✎
                          </button>

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

                          <button
                            className='files__iconBtn'
                            type='button'
                            title='Удалить'
                            onClick={() => openDeleteModal(f.id, f.original_name)}
                          >
                            ✕
                          </button>

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
