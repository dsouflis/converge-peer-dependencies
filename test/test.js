let expect = require('chai').expect;
const describe = require("mocha").describe;
let {resolvePeerItems} = require('../src/index');

describe('converge-peer-dependencies', () => {
  describe('#resolve-success', () => {
    let test = (name, entries, dependencies, expected) => {
      it(`should succeed for: ${name}`, function () {
        let res = resolvePeerItems(entries, dependencies);
        expect(res).to.eql(expected);
      });
    };
    test("Exact versions in dependencies", [
      {
        name: 'foo',
        peerDependencies: {
          package1: "^1.0.0"
        },
      }
    ], {
      "package1": "1.0.1"
    }, [
      ["package1", "1.0.1"]
    ]);
    test("Exact versions in peer dependencies", [
      {
        name: 'foo',
        peerDependencies: {
          "package1": "1.0.1"
        }
      },
    ], {
      "package1": "^1.0.0"
    }, [
      ["package1", "1.0.1"]
    ]);
    test("Exact versions with gt ranges", [
      {
        name: 'foo',
        peerDependencies: {
          "package1": "1.0.1"
        }
      },
    ], {
      "package1": ">1.0.0"
    }, [
      ["package1", "1.0.1"]
    ]);
    test("Exact versions with many ranges", [
      {
        name: 'foo',
        peerDependencies: {
          "package1": "^1.0.0"
        }
      },
      {
        name: 'bar',
        peerDependencies: {
          "package1": "^1.0.1"
        }
      },
    ], {
      "package1": "1.0.1"
    }, [
      ["package1", "1.0.1"]
    ]);
    test("Many compatible ranges", [
      {
        name: 'foo',
        peerDependencies: {
          "package1": "^1.0.0"
        }
      },
      {
        name: 'bar',
        peerDependencies: {
          "package1": "^1.0.1"
        }
      },
    ], {
      "package1": "^1.0.2"
    }, [
      ["package1", "^1.0.2"]
    ]);
    test("Many compatible ranges with upper limit", [
      {
        name: 'foo',
        peerDependencies: {
          "package1": "^1.0.0"
        }
      },
      {
        name: 'bar',
        peerDependencies: {
          "package1": "^1.0.1"
        }
      },
      {
        name: 'baz',
        peerDependencies: {
          "package1": "<1.1.0"
        }
      },
    ], {
      "package1": "^1.0.2"
    }, [
      ["package1", "~1.0.2"]
    ]);
    test("Many compatible ranges with upper and lower limit", [
      {
        name: 'foo',
        peerDependencies: {
          "package1": ">1.0.0 <2.0.0"
        }
      },
      {
        name: 'bar',
        peerDependencies: {
          "package1": "^1.0.1"
        }
      },
      {
        name: 'baz',
        peerDependencies: {
          "package1": "<1.2.0"
        }
      },
    ], {
      "package1": ">1.0.2"
    }, [
      ["package1", ">1.0.2 <1.2.0"]
    ]);
  })
  describe('#resolve-failure', () => {
    let test = (name, entries, dependencies, expected) => {
      it(`should fail for: ${name}`, function () {
        let peersResolved = resolvePeerItems(entries, dependencies);
        const errored = peersResolved.filter(([n, v]) => v.startsWith('ERR')).flatMap(([n, _]) => n);
        expect(errored).to.eql(expected);
      });
    };
    test("Exact versions outside ranges", [
      {
        name: 'foo',
        peerDependencies: {
          "package1": "^1.5.0"
        }
      },
      {
        name: 'bar',
        peerDependencies: {
          "package1": ">1.5.5"
        }
      },
    ], {
      "package1": "1.0.1"
    }, [
      "package1"
    ]);
    test("Incompatible ranges", [
      {
        name: 'foo',
        peerDependencies: {
          "package1": "<1.5.0"
        }
      },
      {
        name: 'bar',
        peerDependencies: {
          "package1": ">1.5.5"
        }
      },
    ], {
      "package1": "1.5.1"
    }, [
      "package1"
    ]);
  });
});
