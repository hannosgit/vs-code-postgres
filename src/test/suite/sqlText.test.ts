import * as assert from "assert";
import * as vscode from "vscode";
import { describe, it, afterEach } from "mocha";
import { getSqlToRun } from "../../query/sqlText";

describe("getSqlToRun", () => {
  let editor: vscode.TextEditor | undefined;

  async function openEditor(content: string): Promise<vscode.TextEditor> {
    const document = await vscode.workspace.openTextDocument({
      language: "sql",
      content
    });
    editor = await vscode.window.showTextDocument(document, { preview: false });
    return editor;
  }

  async function closeEditor(): Promise<void> {
    if (!editor) {
      return;
    }

    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    editor = undefined;
  }

  afterEach(async () => {
    await closeEditor();
  });

  it("returns trimmed selection when text is selected", async () => {
    const content = "  SELECT 1  ";
    const textEditor = await openEditor(content);

    const start = new vscode.Position(0, 0);
    const end = new vscode.Position(0, content.length);
    textEditor.selection = new vscode.Selection(start, end);

    const sql = getSqlToRun(textEditor);
    assert.strictEqual(sql, "SELECT 1");
  });

  it("returns the statement around the cursor", async () => {
    const content = "SELECT 1;\nSELECT 2;\nSELECT 3;";
    const textEditor = await openEditor(content);

    const cursor = new vscode.Position(1, 3);
    textEditor.selection = new vscode.Selection(cursor, cursor);

    const sql = getSqlToRun(textEditor);
    assert.strictEqual(sql, "SELECT 2");
  });

  it("returns null for empty documents", async () => {
    const textEditor = await openEditor("\n  \n");
    const cursor = new vscode.Position(0, 0);
    textEditor.selection = new vscode.Selection(cursor, cursor);

    const sql = getSqlToRun(textEditor);
    assert.strictEqual(sql, null);
  });
});
