import * as Assert from "assert";

import test from "arrange-act-assert";

import { getMap } from "./getMap";

test.describe("getMap", test => {
    test.describe("single id", test => {
        test("should get id", {
            ARRANGE() {
                return getMap<{id:number}, string>({
                    id: item => item.id
                });
            },
            ACT(map) {
                return map.getId({ id: 123 }, 0);
            },
            ASSERT(res) {
                Assert.strictEqual(res, 123);
            }
        });
        test("should equal ids", {
            ARRANGE() {
                return getMap<{id:number}, string>({
                    id: item => item.id
                });
            },
            ACT(map) {
                return map.equalsId(
                    map.getId({ id: 123 }, 0),
                    map.getId({ id: 123 }, 0)
                );
            },
            ASSERT(res) {
                Assert.strictEqual(res, true);
            }
        });
        test("should not equal ids", {
            ARRANGE() {
                return getMap<{id:number}, string>({
                    id: item => item.id
                });
            },
            ACT(map) {
                return map.equalsId(
                    map.getId({ id: 123 }, 0),
                    map.getId({ id: 124 }, 0)
                );
            },
            ASSERT(res) {
                Assert.strictEqual(res, false);
            }
        });
        test("should set item", {
            ARRANGE() {
                return getMap<{id:number}, string>({
                    id: item => item.id
                });
            },
            ACT(map) {
                map.setChild(123, "123");
            },
            ASSERT(_, map) {
                Assert.strictEqual(map.getChild(123), "123");
            }
        });
        test("should set multiple items", {
            ARRANGE() {
                return getMap<{id:number}, string>({
                    id: item => item.id
                });
            },
            ACT(map) {
                map.setChild(123, "123");
                map.setChild(124, "124");
            },
            ASSERTS: {
                "should get first item"(_, map) {
                    Assert.strictEqual(map.getChild(123), "123");
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild(124), "124");
                }
            }
        });
        test("should delete item", {
            ARRANGE() {
                const map = getMap<{id:number}, string>({
                    id: item => item.id
                });
                map.setChild(123, "123");
                return map;
            },
            ACT(map) {
                map.deleteChild(123);
            },
            ASSERT(_, map) {
                Assert.strictEqual(map.getChild(123), undefined);
            }
        });
        test("should delete single item having multiple items", {
            ARRANGE() {
                const map = getMap<{id:number}, string>({
                    id: item => item.id
                });
                map.setChild(123, "123");
                map.setChild(124, "124");
                return map;
            },
            ACT(map) {
                map.deleteChild(123);
            },
            ASSERTS: {
                "should not get first item"(_, map) {
                    Assert.strictEqual(map.getChild(123), undefined);
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild(124), "124");
                }
            }
        });
    });
    test.describe("no id nor ids", test => {
        test("should get id", {
            ARRANGE() {
                return getMap<number, string>({});
            },
            ACT(map) {
                return map.getId(123, 0);
            },
            ASSERT(res) {
                Assert.deepStrictEqual(res, { item: 123, i: 0 });
            }
        });
        test("should equal ids", {
            ARRANGE() {
                return getMap<number, string>({});
            },
            ACT(map) {
                return map.equalsId(
                    map.getId(123, 0),
                    map.getId(123, 0)
                );
            },
            ASSERT(res) {
                Assert.strictEqual(res, true);
            }
        });
        test("should not equal ids", {
            ARRANGE() {
                return getMap<number, string>({});
            },
            ACT(map) {
                return map.equalsId(
                    map.getId(123, 0),
                    map.getId(124, 0)
                );
            },
            ASSERT(res) {
                Assert.strictEqual(res, false);
            }
        });
        test("should set item", {
            ARRANGE() {
                return getMap<number, string>({});
            },
            ACT(map) {
                map.setChild({ item: 123, i: 0 }, "123");
            },
            ASSERT(_, map) {
                Assert.strictEqual(map.getChild({ item: 123, i: 0 }), "123");
            }
        });
        test("should set multiple items", {
            ARRANGE() {
                return getMap<number, string>({});
            },
            ACT(map) {
                map.setChild({ item: 123, i: 0 }, "123");
                map.setChild({ item: 124, i: 1 }, "124");
            },
            ASSERTS: {
                "should get first item"(_, map) {
                    Assert.strictEqual(map.getChild({ item: 123, i: 0 }), "123");
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild({ item: 124, i: 1 }), "124");
                }
            }
        });
        test("should set multiple items with same base id", {
            ARRANGE() {
                return getMap<number, string>({});
            },
            ACT(map) {
                map.setChild({ item: 123, i: 0 }, "123_0");
                map.setChild({ item: 123, i: 1 }, "123_1");
            },
            ASSERTS: {
                "should get first item"(_, map) {
                    Assert.strictEqual(map.getChild({ item: 123, i: 0 }), "123_0");
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild({ item: 123, i: 1 }), "123_1");
                }
            }
        });
        test("should delete item", {
            ARRANGE() {
                const map = getMap<number, string>({});
                map.setChild({ item: 123, i: 0 }, "123");
                return map;
            },
            ACT(map) {
                map.deleteChild({ item: 123, i: 0 });
            },
            ASSERT(_, map) {
                Assert.strictEqual(map.getChild({ item: 123, i: 0 }), undefined);
            }
        });
        test("should delete single item having multiple items", {
            ARRANGE() {
                const map = getMap<number, string>({});
                map.setChild({ item: 123, i: 0 }, "123");
                map.setChild({ item: 124, i: 1 }, "124");
                return map;
            },
            ACT(map) {
                map.deleteChild({ item: 123, i: 0 });
            },
            ASSERTS: {
                "should not get first item"(_, map) {
                    Assert.strictEqual(map.getChild({ item: 123, i: 0 }), undefined);
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild({ item: 124, i: 1 }), "124");
                }
            }
        });
        test("should delete single item having multiple items with same base id", {
            ARRANGE() {
                const map = getMap<number, string>({});
                map.setChild({ item: 123, i: 0 }, "123_0");
                map.setChild({ item: 123, i: 1 }, "123_1");
                return map;
            },
            ACT(map) {
                map.deleteChild({ item: 123, i: 0 });
            },
            ASSERTS: {
                "should not get first item"(_, map) {
                    Assert.strictEqual(map.getChild({ item: 123, i: 0 }), undefined);
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild({ item: 123, i: 1 }), "123_1");
                }
            }
        });
    });
    test.describe("ids array single item", test => {
        test("should get id", {
            ARRANGE() {
                return getMap<number, string>({
                    ids: item => [item]
                });
            },
            ACT(map) {
                return map.getId(123, 0);
            },
            ASSERT(res) {
                Assert.deepStrictEqual(res, [123]);
            }
        });
        test("should equal ids", {
            ARRANGE() {
                return getMap<number, string>({
                    ids: item => [item]
                });
            },
            ACT(map) {
                return map.equalsId(
                    map.getId(123, 0),
                    map.getId(123, 0)
                );
            },
            ASSERT(res) {
                Assert.strictEqual(res, true);
            }
        });
        test("should not equal ids", {
            ARRANGE() {
                return getMap<number, string>({
                    ids: item => [item]
                });
            },
            ACT(map) {
                return map.equalsId(
                    map.getId(123, 0),
                    map.getId(124, 0)
                );
            },
            ASSERT(res) {
                Assert.strictEqual(res, false);
            }
        });
        test("should set item", {
            ARRANGE() {
                return getMap<number, string>({
                    ids: item => [item]
                });
            },
            ACT(map) {
                map.setChild([123], "123");
            },
            ASSERT(_, map) {
                Assert.strictEqual(map.getChild([123]), "123");
            }
        });
        test("should set multiple items", {
            ARRANGE() {
                return getMap<number, string>({
                    ids: item => [item]
                });
            },
            ACT(map) {
                map.setChild([123], "123");
                map.setChild([124], "124");
            },
            ASSERTS: {
                "should get first item"(_, map) {
                    Assert.strictEqual(map.getChild([123]), "123");
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild([124]), "124");
                }
            }
        });
        test("should delete item", {
            ARRANGE() {
                const map = getMap<number, string>({
                    ids: item => [item]
                });
                map.setChild([123], "123");
                return map;
            },
            ACT(map) {
                map.deleteChild([123]);
            },
            ASSERT(_, map) {
                Assert.strictEqual(map.getChild([123]), undefined);
            }
        });
        test("should delete single item having multiple items", {
            ARRANGE() {
                const map = getMap<number, string>({
                    ids: item => [item]
                });
                map.setChild([123], "123");
                map.setChild([124], "124");
                return map;
            },
            ACT(map) {
                map.deleteChild([123]);
            },
            ASSERTS: {
                "should not get first item"(_, map) {
                    Assert.strictEqual(map.getChild([123]), undefined);
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild([124]), "124");
                }
            }
        });
    });
    test.describe("ids array double item", test => {
        test("should get id", {
            ARRANGE() {
                return getMap<[number, number], string>({
                    ids: item => [item[0], item[1]]
                });
            },
            ACT(map) {
                return map.getId([123, 0], 0);
            },
            ASSERT(res) {
                Assert.deepStrictEqual(res, [123, 0]);
            }
        });
        test("should set item", {
            ARRANGE() {
                return getMap<[number, number], string>({
                    ids: item => [item[0], item[1]]
                })
            },
            ACT(map) {
                map.setChild([123, 0], "123");
            },
            ASSERT(_, map) {
                Assert.strictEqual(map.getChild([123, 0]), "123");
            }
        });
        test("should set multiple items", {
            ARRANGE() {
                return getMap<[number, number], string>({
                    ids: item => [item[0], item[1]]
                })
            },
            ACT(map) {
                map.setChild([123, 0], "123");
                map.setChild([124, 1], "124");
            },
            ASSERTS: {
                "should get first item"(_, map) {
                    Assert.strictEqual(map.getChild([123, 0]), "123");
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild([124, 1]), "124");
                }
            }
        });
        test("should set multiple items with same base id", {
            ARRANGE() {
                return getMap<[number, number], string>({
                    ids: item => [item[0], item[1]]
                })
            },
            ACT(map) {
                map.setChild([123, 0], "123_0");
                map.setChild([123, 1], "123_1");
            },
            ASSERTS: {
                "should get first item"(_, map) {
                    Assert.strictEqual(map.getChild([123, 0]), "123_0");
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild([123, 1]), "123_1");
                }
            }
        });
        test("should delete item", {
            ARRANGE() {
                const map = getMap<[number, number], string>({
                    ids: item => [item[0], item[1]]
                })
                map.setChild([123, 0], "123");
                return map;
            },
            ACT(map) {
                map.deleteChild([123, 0]);
            },
            ASSERT(_, map) {
                Assert.strictEqual(map.getChild([123, 0]), undefined);
            }
        });
        test("should delete single item having multiple items", {
            ARRANGE() {
                const map = getMap<[number, number], string>({
                    ids: item => [item[0], item[1]]
                })
                map.setChild([123, 0], "123");
                map.setChild([124, 1], "124");
                return map;
            },
            ACT(map) {
                map.deleteChild([123, 0]);
            },
            ASSERTS: {
                "should not get first item"(_, map) {
                    Assert.strictEqual(map.getChild([123, 0]), undefined);
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild([124, 1]), "124");
                }
            }
        });
        test("should delete single item having multiple items with same base id", {
            ARRANGE() {
                const map = getMap<[number, number], string>({
                    ids: item => [item[0], item[1]]
                })
                map.setChild([123, 0], "123_0");
                map.setChild([123, 1], "123_1");
                return map;
            },
            ACT(map) {
                map.deleteChild([123, 0]);
            },
            ASSERTS: {
                "should not get first item"(_, map) {
                    Assert.strictEqual(map.getChild([123, 0]), undefined);
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild([123, 1]), "123_1");
                }
            }
        });
    });
    test.describe("ids array triple item", test => {
        test("should get id", {
            ARRANGE() {
                return getMap<[number, number, number], string>({
                    ids: item => [item[0], item[1], item[2]]
                });
            },
            ACT(map) {
                return map.getId([123, 0, 1], 0);
            },
            ASSERT(res) {
                Assert.deepStrictEqual(res, [123, 0, 1]);
            }
        });
        test("should set item", {
            ARRANGE() {
                return getMap<[number, number, number], string>({
                    ids: item => [item[0], item[1], item[2]]
                })
            },
            ACT(map) {
                map.setChild([123, 0, 1], "123");
            },
            ASSERT(_, map) {
                Assert.strictEqual(map.getChild([123, 0, 1]), "123");
            }
        });
        test("should set multiple items", {
            ARRANGE() {
                return getMap<[number, number, number], string>({
                    ids: item => [item[0], item[1]]
                })
            },
            ACT(map) {
                map.setChild([123, 0, 0], "123");
                map.setChild([124, 1, 0], "124");
            },
            ASSERTS: {
                "should get first item"(_, map) {
                    Assert.strictEqual(map.getChild([123, 0, 0]), "123");
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild([124, 1, 0]), "124");
                }
            }
        });
        test("should set multiple items with same base id", {
            ARRANGE() {
                return getMap<[number, number, number], string>({
                    ids: item => [item[0], item[1], item[2]]
                })
            },
            ACT(map) {
                map.setChild([123, 0, 0], "123_0");
                map.setChild([123, 1, 0], "123_1");
            },
            ASSERTS: {
                "should get first item"(_, map) {
                    Assert.strictEqual(map.getChild([123, 0, 0]), "123_0");
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild([123, 1, 0]), "123_1");
                }
            }
        });
        test("should delete item", {
            ARRANGE() {
                const map = getMap<[number, number, number], string>({
                    ids: item => [item[0], item[1], item[2]]
                })
                map.setChild([123, 0, 1], "123");
                return map;
            },
            ACT(map) {
                map.deleteChild([123, 0, 1]);
            },
            ASSERT(_, map) {
                Assert.strictEqual(map.getChild([123, 0, 1]), undefined);
            }
        });
        test("should delete single item having multiple items", {
            ARRANGE() {
                const map = getMap<[number, number, number], string>({
                    ids: item => [item[0], item[1], item[2]]
                })
                map.setChild([123, 0, 1], "123");
                map.setChild([124, 1, 1], "124");
                return map;
            },
            ACT(map) {
                map.deleteChild([123, 0, 1]);
            },
            ASSERTS: {
                "should not get first item"(_, map) {
                    Assert.strictEqual(map.getChild([123, 0, 1]), undefined);
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild([124, 1, 1]), "124");
                }
            }
        });
        test("should delete single item having multiple items with same base id", {
            ARRANGE() {
                const map = getMap<[number, number, number], string>({
                    ids: item => [item[0], item[1], item[2]]
                })
                map.setChild([123, 0, 0], "123_0");
                map.setChild([123, 1, 0], "123_1");
                return map;
            },
            ACT(map) {
                map.deleteChild([123, 0, 0]);
            },
            ASSERTS: {
                "should not get first item"(_, map) {
                    Assert.strictEqual(map.getChild([123, 0, 0]), undefined);
                },
                "should get second item"(_, map) {
                    Assert.strictEqual(map.getChild([123, 1, 0]), "123_1");
                }
            }
        });
    });
});