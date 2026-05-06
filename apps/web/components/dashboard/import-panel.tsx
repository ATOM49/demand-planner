"use client";

import type { SyntheticEvent } from "react";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "../ui/button";

const IMPORT_UPLOAD_FIELD_NAME = "file";

type ImportKind = "actuals" | "forecasts";

type ImportStatus = {
  tone: "idle" | "success" | "error";
  message: string;
};

type ImportResponse = {
  message?: string;
  rowsImported?: number;
  forecastPointsImported?: number;
  forecastRunsImported?: number;
};

function buildSuccessMessage(kind: ImportKind, result: ImportResponse) {
  if (kind === "actuals") {
    const rowsImported = String(result.rowsImported ?? 0);
    return `Imported ${rowsImported} actual rows. Dashboard is refreshing.`;
  }

  const forecastRunsImported = String(result.forecastRunsImported ?? 0);
  const forecastPointsImported = String(result.forecastPointsImported ?? 0);

  return `Imported ${forecastRunsImported} forecast runs and ${forecastPointsImported} points. Dashboard is refreshing.`;
}

function ImportUploader({
  kind,
  label,
  helper,
}: {
  kind: ImportKind;
  label: string;
  helper: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>({ tone: "idle", message: helper });
  const [isRefreshing, startRefresh] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setStatus({ tone: "error", message: "Choose a CSV file before importing." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ tone: "idle", message: `Uploading ${selectedFile.name}...` });

    const formData = new FormData();
    formData.set(IMPORT_UPLOAD_FIELD_NAME, selectedFile);

    try {
      const response = await fetch(`/api/imports/${kind}`, {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => ({ message: "Import failed." }))) as ImportResponse;

      if (!response.ok) {
        setStatus({ tone: "error", message: result.message ?? "Import failed." });
        return;
      }

      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setStatus({ tone: "success", message: buildSuccessMessage(kind, result) });
      startRefresh(() => {
        router.refresh();
      });
    } catch {
      setStatus({ tone: "error", message: "Import failed. Check the file and try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-4 rounded-4xl border border-border/80 bg-background/80 p-4 shadow-sm"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <strong>{label}</strong>
          <p className="text-sm text-muted-foreground">{helper}</p>
        </div>
        <input
          ref={inputRef}
          accept=".csv,text/csv"
          className="block w-full rounded-3xl border border-input bg-background px-4 py-3 text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            setSelectedFile(nextFile);
            setStatus({ tone: "idle", message: nextFile ? `Ready: ${nextFile.name}` : helper });
          }}
          type="file"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0 truncate text-sm text-muted-foreground">{selectedFile ? selectedFile.name : "No file selected"}</span>
        <Button disabled={!selectedFile || isSubmitting || isRefreshing} type="submit">
          {isSubmitting ? "Importing..." : `Import ${label}`}
        </Button>
      </div>

      <p
        className={
          status.tone === "error"
            ? "text-sm text-destructive"
            : status.tone === "success"
              ? "text-sm text-emerald-700"
              : "text-sm text-muted-foreground"
        }
      >
        {status.message}
      </p>
    </form>
  );
}

export function ImportPanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-4xl border border-border/70 bg-muted/20 p-4">
        <p className="text-sm font-medium text-foreground">Default local fixtures</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The seeded demo dataset comes from the repository <strong>/test_csvs</strong> folder. The default happy-path
          imports are <strong>aggregated_data_valid.csv</strong> for actuals and <strong>forecast_data_valid.csv</strong>
          for forecast runs.
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Uploading a file here stages it under <strong>data/imports</strong>, updates the local SQLite database, and
          recomputes alerts for the latest dashboard snapshot.
        </p>
      </div>
      <ImportUploader kind="actuals" label="Actuals CSV" helper="Use the aggregated actuals export format." />
      <ImportUploader kind="forecasts" label="Forecast CSV" helper="Use the forecast runs export format." />
      <p className="text-sm leading-6 text-muted-foreground">
        For scripted local imports, the API still accepts JSON source paths that point at files inside
        <strong> /test_csvs</strong>.
      </p>
    </div>
  );
}

export function ImportDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Import CSV data</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,52rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import CSV data</DialogTitle>
          <DialogDescription>
            Upload actuals or forecast files, stage them locally, and refresh the dashboard snapshot.
          </DialogDescription>
        </DialogHeader>
        <ImportPanel />
      </DialogContent>
    </Dialog>
  );
}
