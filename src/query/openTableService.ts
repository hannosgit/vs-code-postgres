import * as vscode from "vscode";
import { ConnectionManager } from "../connections/connectionManager";
import { runCancelableQuery } from "./queryRunner";
import { ResultsPanel } from "../webviews/resultsPanel";

const DEFAULT_ROW_LIMIT = 200;

type TableContext = { schemaName: string; tableName: string };

export class OpenTableService {
  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly extensionUri: vscode.Uri,
    private readonly rowLimit = DEFAULT_ROW_LIMIT
  ) {}

  async open(item?: unknown): Promise<void> {
    const table = this.toTableContext(item);
    if (!table) {
      void vscode.window.showWarningMessage("Select a table in the Postgres Schema view.");
      return;
    }

    const pool = this.connectionManager.getPool();
    if (!pool) {
      void vscode.window.showWarningMessage("Connect to a Postgres profile first.");
      return;
    }

    const limit = this.normalizeLimit(this.rowLimit);
    const sql = this.buildOpenTableSql(table.schemaName, table.tableName, limit);
    const panel = ResultsPanel.createOrShow(this.extensionUri);
    panel.showLoading(sql);
    panel.setCancelHandler(undefined);

    const { promise, cancel } = runCancelableQuery(pool, sql, limit);
    panel.setCancelHandler(cancel);

    const result = await promise;
    panel.setCancelHandler(undefined);
    panel.showResults(result);

    if (result.error && !result.cancelled) {
      void vscode.window.showErrorMessage(result.error.message);
    }
  }

  private toTableContext(value: unknown): TableContext | undefined {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    const maybe = value as { schemaName?: unknown; tableName?: unknown };
    if (typeof maybe.schemaName !== "string" || typeof maybe.tableName !== "string") {
      return undefined;
    }

    return { schemaName: maybe.schemaName, tableName: maybe.tableName };
  }

  private buildOpenTableSql(schemaName: string, tableName: string, limit: number): string {
    const qualified = `${this.quoteIdentifier(schemaName)}.${this.quoteIdentifier(tableName)}`;
    return `SELECT * FROM ${qualified} LIMIT ${limit};`;
  }

  private normalizeLimit(limit: number): number {
    if (!Number.isFinite(limit) || limit <= 0) {
      return DEFAULT_ROW_LIMIT;
    }
    return Math.floor(limit);
  }

  private quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, "\"\"")}"`;
  }
}
