const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const args = require('yargs').argv;

const config = {
  dirName: null,
  pathDirectoryToZip: null,
  ignoreFiles: [],
  format: 'zip',
};

const checkArguments = () => {
  return new Promise((resolve, reject) => {
    if (args._.length !== 1) {
      reject('You can only specify 1 directory.');
    }

    const directoryToZip = args._[0];
    config.pathDirectoryToZip = path.resolve(__dirname, directoryToZip);

    const dirName = config.pathDirectoryToZip.split(path.sep).pop();
    config.dirName = dirName;

    if (args.tar) {
      config.format = 'tar';
    }

    resolve();
  });
};

const buildFromConfigFile = () => {
  return new Promise((resolve, reject) => {
    const pathConfigFile = path.resolve(__dirname, '.stockrc');
    const configFile = fs.readFileSync(pathConfigFile, 'utf-8');
    config.ignoreFiles = configFile.split('\r\n');

    resolve();
  });
};

const gatherFiles = () => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(__dirname + `/${config.dirName}.${config.format}`);
    const archive = archiver(config.format, {
      zlib: { level: 10 }, // Sets the compression level.
      gzipOptions: { level: 10 }, // Sets the compression level.
    });

    output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
      resolve();
    });
    output.on('end', function () {
      console.log('Data has been drained');
      resolve();
    });
    archive.on('error', function (err) {
      reject(err);
    });
    archive.pipe(output);

    archive.glob(config.pathDirectoryToZip, {
      pattern: '**/*',
      ignore: config.ignoreFiles,
      skip: config.ignoreFiles,
      cwd: config.pathDirectoryToZip,
      stat: true,
      mark: true,
      nocase: true,
    });
    archive.finalize();
  });
};

checkArguments()
  .then(buildFromConfigFile)
  .then(gatherFiles)
  .then(() => {
    // console.log(config);
    console.log('Success');
  })
  .catch((err) => {
    throw new Error(err);
  });
