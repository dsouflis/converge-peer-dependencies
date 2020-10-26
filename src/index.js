var fs = require('fs');
const { intersect } = require('semver-intersect');
var groupBy = require('lodash.groupby');
var uniq = require('lodash.uniq');

const intersectOrFail = (...args) => {
  try {
    return intersect.apply(null, args);
  } catch (e) {
    return `ERR: ${e}`;
  }
}

const converge = dir => new Promise((resolve, reject) => {
  fs.readFile(`${dir}/package.json`, 'utf8', (err, data)=> {
    if(err) resolve(err);
    else {
      let packageJsonContents = JSON.parse(data);
      const promises = Object.entries(packageJsonContents.dependencies).map(([name, version]) => new Promise((resolveInner, rejectInner) => {
        fs.readFile(`${dir}/node_modules/${name}/package.json`, "utf8", function (err, packageData) {
          if (err) {
            resolveInner(err);
          } else {
            let innerPackageJsonContents = JSON.parse(packageData);
            resolveInner({ name, peerDependencies: innerPackageJsonContents.peerDependencies});
          }
        });
      }));
      try {
        Promise.all(promises).then(res => {
          const peers = res
          .filter(x => x.peerDependencies)
          .flatMap(x =>
              Object
              .entries(x.peerDependencies));
          const peersGrouped = Object
          .entries(groupBy(peers, ([n, _]) => n))
          .map(([n, ar]) => [n, ar.map(([_, x]) => x)])
          .map(([n, ar]) => [n, packageJsonContents.dependencies[n] ? [packageJsonContents.dependencies[n], ...ar] : ar])
          .map(([n, ar]) => [
              n,
            uniq(ar)
          ]);
          const peersResolved = peersGrouped
          .map(([n, ar]) => [n, intersectOrFail.apply(null, ar)])
          const errors = peersResolved.filter(([n, v]) => v.startsWith('ERR'));
          if (errors.length) {
            reject(errors);
          } else {
            resolve(peersResolved);
          }
        });
      } catch (e) {
        reject(e);
      }
    }
  });
});


converge('./dummyapp').then(ret => {
  console.log(JSON.stringify(ret, null, 2));
})
.catch(e => {
  console.log(JSON.stringify(e));
});
