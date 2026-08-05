"use client";

import { useRef, useState, useTransition } from "react";
import { adminApi } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type UploadStatus = "idle" | "requesting" | "uploading" | "syncing" | "done" | "error";

interface UploadedFile {
  name: string;
  size: number;
  s3Key: string;
  uploadedAt: string;
}

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
  "text/markdown": ".md",
};

const FOLDER_OPTIONS = [
  { label: "Admissions", value: "admissions" },
  { label: "Registration", value: "registration" },
  { label: "Tuition & Fees", value: "tuition" },
  { label: "Examinations", value: "examinations" },
  { label: "Academic Calendar", value: "calendar" },
  { label: "Graduation", value: "graduation" },
  { label: "Scholarships", value: "scholarships" },
  { label: "Campus Services", value: "campus-services" },
  { label: "General", value: "uploads" },
];

export function DocumentManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [folder, setFolder] = useState("uploads");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [pendingSync, setPendingSync] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setSuccessMsg("");

    const file = files[0]; // process one at a time

    // Validate type
    if (!ALLOWED_TYPES[file.type]) {
      setError(`Unsupported file type. Allowed: PDF, DOC, DOCX, TXT, MD`);
      return;
    }

    // Validate size — 50 MB max (Bedrock KB limit for a single document)
    if (file.size > 50 * 1024 * 1024) {
      setError("File is too large. Maximum size is 50 MB.");
      return;
    }

    startTransition(async () => {
      try {
        // Step 1 — get pre-signed URL from Lambda
        setStatus("requesting");
        setProgress(10);
        const { uploadUrl, s3Key } = await adminApi.getUploadUrl({
          fileName: file.name,
          contentType: file.type,
          folder,
        });

        // Step 2 — PUT file directly to S3 using the pre-signed URL
        // This bypasses Lambda entirely — file goes browser → S3 directly
        setStatus("uploading");
        setProgress(30);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(30 + Math.round((e.loaded / e.total) * 50));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`S3 upload failed: ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        setProgress(85);

        // Track the uploaded file locally
        const uploaded: UploadedFile = {
          name: file.name,
          size: file.size,
          s3Key,
          uploadedAt: new Date().toISOString(),
        };
        setUploadedFiles((prev) => [uploaded, ...prev]);
        setPendingSync(true);

        setStatus("done");
        setProgress(100);
        setSuccessMsg(`"${file.name}" uploaded successfully. Click "Sync Knowledge Base" to make it searchable.`);

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
      }
    });
  }

  async function handleSync() {
    setError("");
    setSuccessMsg("");
    startTransition(async () => {
      try {
        setStatus("syncing");
        const result = await adminApi.syncKnowledge();
        setPendingSync(false);
        setStatus("idle");
        setSuccessMsg(`Knowledge base sync started (job: ${result.jobId}). ${result.message}`);
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Sync failed. Try again in a moment.");
      }
    });
  }

  const isDragging = useRef(false);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Knowledge Base Documents
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Upload PDFs, Word docs, or text files. Bedrock indexes them automatically.
            </p>
          </div>
          {pendingSync && (
            <Button
              size="sm"
              onClick={handleSync}
              loading={status === "syncing"}
              className="shrink-0"
            >
              Sync Knowledge Base
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-5">
        {error && <Alert variant="error">{error}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}

        {/* Folder selector */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Category folder
          </label>
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {FOLDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={[
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors",
            dragOver
              ? "border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-950/30"
              : "border-slate-200 bg-slate-50 hover:border-primary-300 hover:bg-primary-50/50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-primary-700",
          ].join(" ")}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {status === "uploading" || status === "requesting" ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {status === "requesting" ? "Preparing upload…" : `Uploading… ${progress}%`}
              </p>
              {/* Progress bar */}
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                Drop a file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-slate-400">
                PDF, DOC, DOCX, TXT, MD — max 50 MB
              </p>
            </>
          )}
        </div>

        {/* Recently uploaded files in this session */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Uploaded this session
            </p>
            {uploadedFiles.map((f) => (
              <div
                key={f.s3Key}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                    {f.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(f.size / 1024).toFixed(0)} KB · {f.s3Key}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                  uploaded
                </span>
              </div>
            ))}
          </div>
        )}

        {/* How it works */}
        <details className="group">
          <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            How does this work?
          </summary>
          <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400 space-y-1">
            <p>1. Your file uploads directly to S3 (never through the Lambda).</p>
            <p>2. Click <strong>Sync Knowledge Base</strong> — Bedrock reads the file, splits it into 512-token chunks, and embeds each one using Titan V2.</p>
            <p>3. Vectors are stored in S3 Vectors — no OpenSearch, no minimum hourly cost.</p>
            <p>4. Students&apos; questions are now matched against your documents by meaning, not just keywords.</p>
            <p className="pt-1 text-slate-400">Indexing typically takes 1–5 minutes depending on file size.</p>
          </div>
        </details>
      </div>
    </div>
  );
}
