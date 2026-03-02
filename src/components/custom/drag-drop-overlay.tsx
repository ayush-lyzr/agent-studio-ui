import React, { useEffect, useRef } from 'react';
import { Upload, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DragDropOverlayProps {
  isDragging: boolean;
  isOverDropZone: boolean;
  error: string | null;
  acceptedTypes?: string[];
  maxFiles?: number;
  showSuccess?: boolean;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({
  isDragging,
  isOverDropZone,
  error,
  acceptedTypes = ['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.xlsx', '.xls'],
  maxFiles = 10,
  showSuccess = false,
}) => {
  const prevShowSuccess = useRef(false);
  const prevError = useRef<string | null>(null);

  useEffect(() => {
    if (showSuccess && !prevShowSuccess.current) {
      toast.success('Files uploaded', {
        description: 'Your files have been uploaded successfully.',
      });
    }
    prevShowSuccess.current = showSuccess;
  }, [showSuccess]);

  useEffect(() => {
    if (error && error !== prevError.current) {
      toast.error('Upload error', {
        description: error,
      });
      prevError.current = error;
    }
    if (!error) prevError.current = null;
  }, [error]);

  if (!isDragging) return null;

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300',
        isDragging ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300',
          isDragging ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        data-drop-zone="true"
        className={cn(
          'relative z-10 flex h-[400px] w-[500px] flex-col items-center justify-center rounded-2xl border-4 border-dashed bg-background/90 p-8 shadow-2xl transition-all duration-300',
          isDragging && !isOverDropZone && 'scale-95 border-primary/50',
          isOverDropZone && 'scale-105 border-solid border-primary bg-primary/10 shadow-primary/20',
          isDragging ? 'animate-in fade-in zoom-in-95' : 'animate-out fade-out zoom-out-95',
        )}
      >
        <div
          className={cn(
            'mb-6 transition-all duration-300',
            isOverDropZone && 'scale-110 animate-bounce',
          )}
        >
          {isOverDropZone ? (
            <FileUp className="h-20 w-20 text-primary" strokeWidth={1.5} />
          ) : (
            <Upload className="h-20 w-20 text-muted-foreground" strokeWidth={1.5} />
          )}
        </div>

        <h3
          className={cn(
            'mb-2 text-2xl font-bold transition-colors duration-300',
            isOverDropZone ? 'text-primary' : 'text-foreground',
          )}
        >
          {isOverDropZone ? 'Drop files here!' : 'Drop files to attach'}
        </h3>

        <p className="mb-6 text-center text-sm text-muted-foreground">
          Drag and drop your files anywhere on this page
        </p>

        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p className="font-medium">
            Supported: {acceptedTypes.map(t => t.toUpperCase().replace('.', '')).join(', ')}
          </p>
          <p>Maximum {maxFiles} files</p>
        </div>

        <div
          className={cn(
            'absolute -bottom-1 -left-1 -right-1 -top-1 rounded-2xl',
            isOverDropZone && 'animate-pulse bg-primary/5',
          )}
          style={{ zIndex: -1 }}
        />
      </div>
    </div>
  );
};
