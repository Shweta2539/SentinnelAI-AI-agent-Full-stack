import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileText, UploadCloud, X } from "lucide-react";
import { ACCEPTED_LOG_EXTENSIONS, MAX_UPLOAD_SIZE_MB } from "../../utils/constants";

interface FileDropzoneProps {
  file: File | null;
  onFileSelected: (file: File | null) => void;
  disabled?: boolean;
  error?: string | null;
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}

export function FileDropzone({ file, onFileSelected, disabled, error }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback(
    (candidate: File | undefined | null) => {
      if (!candidate) return;

      const ext = getExtension(candidate.name);
      if (!ACCEPTED_LOG_EXTENSIONS.includes(ext)) {
        onFileSelected(null);
        return;
      }
      if (candidate.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        onFileSelected(null);
        return;
      }
      onFileSelected(candidate);
    },
    [onFileSelected]
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    validateAndSet(e.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={[
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
          isDragging ? "border-signal bg-signal/5" : "border-border-light bg-base-800/30",
          disabled ? "cursor-not-allowed opacity-60" : "hover:border-signal/60",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_LOG_EXTENSIONS.join(",")}
          disabled={disabled}
          onChange={(e) => validateAndSet(e.target.files?.[0])}
        />

        <motion.div
          animate={{ y: isDragging ? -4 : 0 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal"
        >
          <UploadCloud className="h-5 w-5" />
        </motion.div>

        <p className="mt-4 text-sm font-medium text-ink">
          Drag & drop a log file, or click to browse
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          Accepted: {ACCEPTED_LOG_EXTENSIONS.join(", ")} · Max {MAX_UPLOAD_SIZE_MB}MB
        </p>
      </div>

      {error && <p className="mt-2 text-xs text-alert-critical">{error}</p>}

      {file && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center justify-between rounded-lg border border-border-light bg-base-800/60 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-signal" />
            <div>
              <p className="text-sm font-medium text-ink">{file.name}</p>
              <p className="text-xs text-ink-faint">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileSelected(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-md p-1.5 text-ink-muted hover:bg-base-700 hover:text-ink"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
