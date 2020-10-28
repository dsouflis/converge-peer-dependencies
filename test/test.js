let expect = require('chai').expect;
const describe = require("mocha").describe;
let { resolvePeerEntries } = require('../src/index');

describe('converge-peer-dependencies', () => {
  describe('#resolve-success', () => {
    let test = (name, entries, dependencies, expected) => {
      it(`should succeed for: ${name}`, function () {
        let res = resolvePeerEntries(entries, dependencies);
        expect(res).to.eql(expected);
      });
    };
    test("Exact versions in dependencies", [
        ["package1", ["^1.0.0"]]
      ],{
        "package1": "1.0.1"
      },[
          ["package1", "1.0.1"]
      ]);
    test("Exact versions in peer dependencies", [
        ["package1", ["1.0.1"]]
      ],{
        "package1": "^1.0.0"
      },[
          ["package1", "1.0.1"]
      ]);
    test("Exact versions with gt ranges", [
        ["package1", ["1.0.1"]]
      ],{
        "package1": ">1.0.0"
      },[
          ["package1", "1.0.1"]
      ]);
    test("Exact versions with many ranges", [
      ["package1", ["^1.0.0", "^1.0.1"]]
    ],{
      "package1": "1.0.1"
    },[
      ["package1", "1.0.1"]
    ]);
    test("Many compatible ranges", [
      ["package1", ["^1.0.0", "^1.0.1"]]
    ],{
      "package1": "^1.0.2"
    },[
      ["package1", "^1.0.2"]
    ]);
    test("Many compatible ranges with upper limit", [
      ["package1", ["^1.0.0", "^1.0.1", "<1.1.0"]]
    ],{
      "package1": "^1.0.2"
    },[
      ["package1", "~1.0.2"]
    ]);
    test("Many compatible ranges with upper and lower limit", [
      ["package1", [">1.0.0 <2.0.0", "^1.0.1", "<1.2.0"]]
    ],{
      "package1": ">1.0.2"
    },[
      ["package1", ">1.0.2 <1.2.0"]
    ]);
  })
  describe('#resolve-failure', () => {
    let test = (name, entries, dependencies, expected) => {
      it(`should fail for: ${name}`, function () {
        let peersResolved = resolvePeerEntries(entries, dependencies);
        const errored = peersResolved.filter(([n, v]) => v.startsWith('ERR')).flatMap(([n,_]) => n);
        expect(errored).to.eql(expected);
      });
    };
    test("Exact versions outside ranges", [
        ["package1", ["^1.5.0", ">1.5.5"]]
      ],{
        "package1": "1.0.1"
      },[
      "package1"
      ]);
    test("Incompatible ranges", [
        ["package1", ["<1.5.0", ">1.5.5"]]
      ],{
        "package1": "1.5.1"
      },[
      "package1"
      ]);
  });
});
