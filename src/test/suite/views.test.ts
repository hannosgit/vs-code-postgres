import * as assert from "assert";
import * as vscode from "vscode";
import { afterEach, beforeEach, describe, it } from "mocha";
import { ConnectionManager, ConnectionProfile } from "../../connections/connectionManager";
import { ConnectionsTreeDataProvider } from "../../views/connectionsTree";
import { SchemaTreeDataProvider } from "../../views/schemaTree";

const target = vscode.workspace.workspaceFolders
  ? vscode.ConfigurationTarget.Workspace
  : vscode.ConfigurationTarget.Global;

function createSecretStorage(): vscode.SecretStorage {
  const emitter = new vscode.EventEmitter<vscode.SecretStorageChangeEvent>();
  return {
    onDidChange: emitter.event,
    get: async () => undefined,
    store: async () => { },
    delete: async () => { }
  } as unknown as vscode.SecretStorage;
}

async function setProfiles(profiles?: ConnectionProfile[]): Promise<void> {
  const config = vscode.workspace.getConfiguration("dbExplorer");
  await config.update("profiles", profiles, target);
}

function readLabel(item: vscode.TreeItem): string {
  if (typeof item.label === "string") {
    return item.label;
  }
  return item.label?.label ?? "";
}

describe("ConnectionsTreeDataProvider", () => {
  const secrets = createSecretStorage();
  let previousProfiles: ConnectionProfile[] | undefined;

  beforeEach(async () => {
    const config = vscode.workspace.getConfiguration("dbExplorer");
    previousProfiles = config.get<ConnectionProfile[]>("profiles");
    await setProfiles([]);
  });

  afterEach(async () => {
    await setProfiles(previousProfiles);
  });

  it("shows placeholder items when no profiles exist", async () => {
    const manager = new ConnectionManager(secrets);
    const provider = new ConnectionsTreeDataProvider(manager);

    const children = await provider.getChildren();
    assert.ok(children);
    if (!children) {
      throw new Error("Expected tree items.");
    }
    assert.strictEqual(children.length, 2);
    assert.strictEqual(readLabel(children[0]), "No profiles configured");
    assert.strictEqual(readLabel(children[1]), "Add profiles in settings.json");
  });

  it("lists configured connection profiles", async () => {
    const profiles: ConnectionProfile[] = [
      {
        id: "local",
        label: "Local Postgres",
        host: "localhost",
        port: 5432,
        database: "postgres",
        user: "postgres"
      },
      {
        id: "staging",
        label: "Staging",
        host: "db.example",
        port: 5432,
        database: "app",
        user: "app_user"
      }
    ];

    await setProfiles(profiles);

    const manager = new ConnectionManager(secrets);
    const provider = new ConnectionsTreeDataProvider(manager);

    const children = await provider.getChildren();
    assert.ok(children);
    if (!children) {
      throw new Error("Expected tree items.");
    }
    assert.strictEqual(children.length, profiles.length);
    assert.strictEqual(readLabel(children[0]), "Local Postgres");
    assert.strictEqual(
      children[0].description,
      "postgres@localhost:5432/postgres"
    );
  });
});

describe("SchemaTreeDataProvider", () => {
  const secrets = createSecretStorage();

  it("shows placeholders when no active connection exists", async () => {
    const manager = new ConnectionManager(secrets);
    const provider = new SchemaTreeDataProvider(manager);

    const children = await provider.getChildren();
    assert.ok(children);
    if (!children) {
      throw new Error("Expected tree items.");
    }
    assert.strictEqual(children.length, 2);
    assert.strictEqual(readLabel(children[0]), "No active connection");
    assert.strictEqual(readLabel(children[1]), "Connect to load schema");
  });
});
