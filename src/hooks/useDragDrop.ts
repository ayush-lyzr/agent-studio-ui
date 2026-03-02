import { useState, useEffect, useCallback, useRef } from 'react';

interface UseDragDropOptions {
  onFilesDropped: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

interface UseDragDropReturn {
  isDragging: boolean;
  isOverDropZone: boolean;
  dragCounter: number;
  error: string | null;
  clearError: () => void;
}

export const useDragDrop = ({
  onFilesDropped,
  acceptedTypes = ['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.xlsx', '.xls'],
  maxFiles = 10,
  maxSizeMB = 10,
  disabled = false,
}: UseDragDropOptions): UseDragDropReturn => {
  const [isDragging, setIsDragging] = useState(false);
  const [isOverDropZone, setIsOverDropZone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const validateFile = useCallback((file: File): string | null => {
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const fileSizeMB = file.size / (1024 * 1024);

    if (!acceptedTypes.some(type => fileExtension === type.toLowerCase())) {
      return `Invalid file type. Accepted: ${acceptedTypes.join(', ')}`;
    }

    if (fileSizeMB > maxSizeMB) {
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null;
  }, [acceptedTypes, maxSizeMB]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    dragCounter.current += 1;

    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    dragCounter.current -= 1;

    if (dragCounter.current === 0) {
      setIsDragging(false);
      setIsOverDropZone(false);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }

    const target = e.target as HTMLElement;
    if (target.closest('[data-drop-zone="true"]')) {
      setIsOverDropZone(true);
    } else {
      setIsOverDropZone(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    setIsDragging(false);
    setIsOverDropZone(false);
    dragCounter.current = 0;

    const files = Array.from(e.dataTransfer?.files || []);

    if (files.length === 0) {
      setError('No files detected');
      return;
    }

    if (files.length > maxFiles) {
      setError(`Too many files. Maximum ${maxFiles} files allowed`);
      return;
    }

    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    if (validFiles.length > 0) {
      onFilesDropped(validFiles);
    }
  }, [disabled, maxFiles, validateFile, onFilesDropped]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (disabled) return;

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop, disabled]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    isDragging,
    isOverDropZone,
    dragCounter: dragCounter.current,
    error,
    clearError,
  };
};
