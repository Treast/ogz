import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { cwd } from 'process';
import ora from 'ora';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = yargs(hideBin(process.argv))
  .options({
    recursive: {
      alias: 'r',
      boolean: true,
      describe: 'Run the program recursively, archiving subfolders of the specified folders',
    },
    format: {
      alias: 'f',
      describe: 'Choose between ZIP or TAR archiving format',
      default: 'zip',
    },
  })
  .parse();

const config = {
  projects: [],
  ignoreFiles: [],
  format: 'zip',
  spinner: null,
};

const checkArguments = () => {
  return new Promise((resolve, reject) => {
    let directories = args._;
    config.spinner = ora('Computing folders').start();

    if (args.r || args.recursive) {
      directories = directories
        .map((directory) => {
          const directoryPath = path.resolve(cwd(), directory);
          return fs
            .readdirSync(directoryPath, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dir) => path.resolve(directoryPath, dir.name));
        })
        .flat();
    }

    directories.map((project) => {
      const pathDirectoryToZip = path.resolve(cwd(), project);
      const dirName = pathDirectoryToZip.split(path.sep).pop();
      config.projects.push({
        pathDirectoryToZip,
        dirName,
      });
    });

    if (args.f === 'tar' || args.format === 'tar') {
      config.format = 'tar';
    }

    resolve();
  });
};

const buildFromConfigFile = () => {
  return new Promise((resolve, reject) => {
    config.spinner.succeed();
    config.spinner = ora('Loading configuration file').start();

    let pathConfigFile = path.resolve(__dirname, '.ogzrc');

    const localConfigFile = path.resolve(cwd(), '.ogzrc');

    if (fs.existsSync(localConfigFile)) {
      pathConfigFile = localConfigFile;
    }

    const configFile = fs.readFileSync(pathConfigFile, 'utf-8');
    config.ignoreFiles = configFile.split('\r\n');

    resolve();
  });
};

const zipProjects = () => {
  config.spinner.succeed();
  const promises = config.projects.map((project) => {
    return gatherFiles(project);
  });

  return Promise.all(promises);
};

const units = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
const convertUnits = (bytes) => {
  let l = 0,
    n = parseInt(bytes, 10) || 0;

  while (n >= 1024 && ++l) {
    n = n / 1024;
  }

  return n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l];
};

const gatherFiles = (project) => {
  return new Promise((resolve, reject) => {
    project.spinner = ora(`Archiving ${project.dirName}.${config.format}`).start();
    const output = fs.createWriteStream(cwd() + `/${project.dirName}.${config.format}`);
    const archive = archiver(config.format, {
      zlib: { level: 9 }, // Sets the compression level.
      gzipOptions: { level: 9 }, // Sets the compression level.
    });

    output.on('close', function () {
      project.spinner.succeed(`Archiving ${project.dirName}.${config.format} (${convertUnits(archive.pointer())} bytes)`);
      resolve();
    });

    output.on('end', function () {
      resolve();
    });

    archive.on('error', function (err) {
      project.spinner.fail();
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
    // console.log('Success');
    config.spinner = ora('Finished !').start().succeed();
  })
  .catch((err) => {
    throw new Error(err);
  });
