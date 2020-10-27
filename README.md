# converge-peer-dependencies
Converge peer dependencies in package.json

## Description

This tool can be applied on a NodeJS (or Babelized) project,
after dependencies have been installed, to gather all 
peer dependencies of the dependencies in package.json,
converge them, if possible, among themselves and the other 
dependencies, and add them back to package.json. 

On success, it returns an object with existing dependencies
that changed and new dependencies that were added. 

```
{
  depChanged,
  depAdded
}
```

## Usage

```
const { converge } = require('converge-peer-dependencies');

converge('./dir/to/app').then(ret => {
  console.log(JSON.stringify(ret, null, 2));
})
.catch(e => {
  console.log(JSON.stringify(e));
});
```
