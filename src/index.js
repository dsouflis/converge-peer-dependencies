var fs = require('fs');
const { intersect } = require('semver-intersect');
var groupBy = require('lodash.groupby');
var uniq = require('lodash.uniq');

const intersectOrFail = (all, versions) => {
  try {
    return [ intersect.apply(null, versions) ];
  } catch (e) {
    return [`ERR: ${e}`, all];
  }
}

function resolvePeerEntries(peerEntries, dependencies) {
  const allPeers = Object.fromEntries(peerEntries);
  const peerEntriesJustVersions = peerEntries
  .map(([n,ar]) => [n, ar.map(([_,v]) => v)]);
  const peersGrouped = peerEntriesJustVersions
  .map(([n, ar]) => [n, ar.filter(x => x !== "*")])
  .map(([n, ar]) => [n, dependencies[n] ? [dependencies[n], ...ar] : ar])
  .map(([n, ar]) => [
    n,
    uniq(ar)
  ]);
  return peersGrouped
  .map(([n, ar]) => [n, ...intersectOrFail(allPeers[n], ar)]);
}

function resolvePeerItems(items, dependencies) {
  const peers = items
  .filter(x => x.peerDependencies)
  .flatMap(x =>
      Object
      .entries(x.peerDependencies)
      .map(([n, v]) => [n, [x.name, v]])
  );
  const peerEntries = Object
  .entries(groupBy(peers, ([n, _]) => n))
  .map(([n, ar]) => [n, ar.map(([_, x]) => x)]);
  return resolvePeerEntries(peerEntries, dependencies);
}

const converge = (dir, options = { matcher: null}) => new Promise((resolve, reject) => {
  fs.readFile(`${dir}/package.json`, 'utf8', (err, data)=> {
    if(err) resolve(err);
    else {
      let packageJsonContents = JSON.parse(data);
      const dependencies = packageJsonContents.dependencies;
      const promises = Object.entries(dependencies).map(([name, version]) => new Promise((resolveInner, rejectInner) => {
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
          const items = options.matcher ? res.filter(x => options.matcher(x.name)) : res;
          const peersResolved = resolvePeerItems(items, dependencies);
          const errors = peersResolved.filter(([n, v]) => v.startsWith('ERR'));
          if (errors.length) {
            reject(errors);
          } else {
            const depChanged = {};
            const depAdded = {};
            peersResolved.forEach(([n, v]) => {
              const version = dependencies[n];
              if(version) {
                if(version !== v) {
                  dependencies[n] = v;
                  depChanged[n] = v;
                }
              } else {
                dependencies[n] = v;
                depAdded[n] = v;
              }
            });
            const newContents = JSON.stringify(packageJsonContents, null, 2);
            try {
              fs.writeFile(`${dir}/package.json`, newContents, () => {
                resolve({
                  depChanged,
                  depAdded
                });
              });
            } catch (e) {
              reject(e);
            }
          }
        });
      } catch (e) {
        reject(e);
      }
    }
  });
});

module.exports = {
  converge,
  resolvePeerItems,
};


