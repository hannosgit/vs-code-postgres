import * as assert from "assert";
import * as vscode from "vscode";
import { describe, it } from "mocha";

describe("Postgres Explorer extension", () => {
  it("is registered", () => {
    const extension = vscode.extensions.getExtension("local.db-explorer");
    assert.ok(extension, "Extension not found");
  });

  it("can activate", async () => {
    const extension = vscode.extensions.getExtension("local.db-explorer");
    assert.ok(extension, "Extension not found");

    await extension.activate();
    assert.ok(extension.isActive, "Extension did not activate");
  });

  it("registers core commands", async () => {
    const extension = vscode.extensions.getExtension("local.db-explorer");
    assert.ok(extension, "Extension not found");

    await extension.activate();
    const commands = await vscode.commands.getCommands(true);

    const expected = [
      "postgres.connect",
      "postgres.disconnect",
      "postgres.refreshSchema",
      "postgres.runQuery",
      "postgres.openTable",
      "postgres.exportResults",
      "postgres.clearPassword"
    ];

    for (const command of expected) {
      assert.ok(commands.includes(command), `Missing command: ${command}`);
    }
  });
});
