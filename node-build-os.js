let npm = require("child_process"),
  os = require("os"),
  platform = os.platform();

let winCmds = {
  clean: "rimraf ./build",
  install: "npm ci",
};
let linCmds = {
  clean: "rm -rf ./build",
  install: "npm ci",
};

let cmds = platform === 'win32' ? winCmds : linCmds;

process.argv.map(function (val, index, array) {
  if (cmds.hasOwnProperty(val)) {
    console.log(`running ${val}:${cmds[val]}`)
    npm.exec(cmds[val], {"encoding": "utf-8"});
  }
})

