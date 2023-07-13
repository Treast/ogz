const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { cwd } = require('process');
const args = require('yargs').argv;

const config = {
  projects: [],
  ignoreFiles: [],
  format: 'zip',
};

const checkArguments = () => {
  return new Promise((resolve, reject) => {
    args._.map((project) => {
      const pathDirectoryToZip = path.resolve(__dirname, project);
      const dirName = pathDirectoryToZip.split(path.sep).pop();
      config.projects.push({
        pathDirectoryToZip,
        dirName,
      });
    });

    if (args.tar) {
      config.format = 'tar';
    }

    resolve();
  });
};

const buildFromConfigFile = () => {
  return new Promise((resolve, reject) => {
    let pathConfigFile = path.resolve(__dirname, '.stockrc');

    const localConfigFile = path.resolve(cwd(), '.stockrc');

    if (fs.existsSync(localConfigFile)) {
      pathConfigFile = localConfigFile;
    }

    const configFile = fs.readFileSync(pathConfigFile, 'utf-8');
    config.ignoreFiles = configFile.split('\r\n');

    resolve();
  });
};

const zipProjects = () => {
  const promises = config.projects.map((project) => {
    return gatherFiles(project);
  });

  return Promise.all(promises);
};

const gatherFiles = (project) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(cwd() + `/${project.dirName}.${config.format}`);
    const archive = archiver(config.format, {
      zlib: { level: 9 }, // Sets the compression level.
      gzipOptions: { level: 9 }, // Sets the compression level.
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

    archive.glob(project.pathDirectoryToZip, {
      pattern: '**/*',
      ignore: config.ignoreFiles,
      skip: config.ignoreFiles,
      cwd: project.pathDirectoryToZip,
      stat: true,
      mark: true,
      nocase: true,
    });
    archive.finalize();
  });
};

checkArguments()
  .then(buildFromConfigFile)
  .then(zipProjects)
  .then(() => {
    // console.log(config);
    console.log('Success');
  })
  .catch((err) => {
    throw new Error(err);
  });
