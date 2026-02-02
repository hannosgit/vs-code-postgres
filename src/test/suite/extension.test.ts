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
});
