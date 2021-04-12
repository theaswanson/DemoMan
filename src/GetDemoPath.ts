import electron from "electron";
import cfg from "electron-cfg";
import log from "electron-log";

const { dialog } = electron.remote;

export function GetDemoPath(defaultPath = undefined) {
  const filePaths = dialog.showOpenDialogSync({
    title: "Select your demo folder",
    defaultPath,
    properties: ["openDirectory"],
  });

  // This happens when the user cancels the path selection
  if (filePaths === undefined) {
    return undefined;
  }
  return filePaths[0];
}

export function GetSetDemoPath(defaultPath = undefined) {
  const newPath = GetDemoPath(defaultPath);
  if (newPath === undefined) {
    log.info("Demo path selection canceled by user.");
    return false;
  }
  log.info(`Set new demo path "${newPath}"`);
  cfg.set("demo_path", newPath);
  return true;
}
