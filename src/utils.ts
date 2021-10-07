import { window, workspace } from 'vscode';
import { promises as fsp, existsSync } from 'fs';
import { homedir } from 'os';
async function prepareFile() {
    const filePath = getFilePath();

    if (!existsSync(filePath)) {
        await createNewNote(filePath);
    }
}
function getFilePath() {
    const configFilePath = (workspace
        .getConfiguration()
        .get("cbt.filePath") as string)
        .replace("~/", homedir().concat("/"));
    console.log(`configFilePath: ${configFilePath}`)
    if (configFilePath) {
        return configFilePath;
    } else {
        return homedir + "/cbt.md";
    }
}

async function createNewNote(filePath: string) {
    try {
        await fsp.writeFile(filePath, "");
    } catch (error) {
        console.error(error);
        return window.showErrorMessage(
            `Cannot edit File in "${filePath}". Make sure the directory is present.`
        );
    }
}

async function appendToFileAtLine(filePath: string, content: string, lineNumber: number) {
    try {
        const result = await fsp.readFile(filePath, "utf8");

        let lines = result.toString().split("\n");
        lines.splice(lineNumber, 0, content);
        content = lines.join("\n");

        await fsp.writeFile(filePath, content);
    } catch (error: any) {
        if (error && error.code !== "ENOENT") {
            console.error(error);
            window.showErrorMessage("Cannot edit File.");
        }
    }
}


export { prepareFile,getFilePath,appendToFileAtLine }