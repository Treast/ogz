# ogz

**ogz** is a command line that allows you to simply and quickly archive your projects without modules and useless folders (`node_modules`, `.idea`, `vendor` etc...).

## ✨ Features

- Recursively archive projects
- Choose between ZIP and TAR format

## 💻 Usage

### With NPM

    npx ogz ./my-folder

### With PNPM

    pnpx ogz ./my-folder

## 🗒️ Examples

### Create a simple ZIP archive

`npx ogz ./my-folder`

### Create a simple TAR archive

`npx ogz --format=tar ./my-folder`

### Create multiple archives

`npx ogz ./my-folder-a ./my-folder-b`

### Create archives recursively

`npx ogz -r ./my-folder`

## ⚙️ Options

| Option      | Alias | Default | Description                                                                |
| ----------- | ----- | ------- | -------------------------------------------------------------------------- |
| --recursive | -r    | `false` | Run the program recursively, archiving subfolders of the specified folders |
| --format    | -f    | `zip`   | Choose between ZIP or TAR archiving format                                 |

## 💡 I would like XXX but it's not yet available?

[Go to the issues](https://github.com/Treast/ogz/issues) and submit your idea. If it's relevant, I might add it 🫶.

## ⚠️Warning

Please note that this plugin is provided as is, without any express or implied warranty of operation. By using this library, you agree to do so at your own risk. I am not responsible for any direct or indirect damage resulting from the use of this library, including loss of data, operating errors, service interruptions, or any other consequence related to the use of this library.
