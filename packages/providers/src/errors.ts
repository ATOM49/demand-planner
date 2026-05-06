export type CsvRowIssue = {
  fileName: string;
  rowNumber: number;
  itemId?: string;
  field: string;
  reason: string;
};

export class CsvValidationError extends Error {
  public readonly issues: CsvRowIssue[];

  public constructor(message: string, issues: CsvRowIssue[]) {
    super(message);
    this.name = "CsvValidationError";
    this.issues = issues;
  }
}
