/*jshint es5: true */
/*global describe, it*/

var MWS = require("../lib")
,   expect = require("expect.js")
,   mongoose = require("mongoose")
;

// the hack with inst._saveError below is because casting errors show up when calling #save()
// but not when calling #validate() for some reason. So we peek inside the object.

function checkGood (good) {
    for (var k in good) {
        if (good.hasOwnProperty(k)) {
            (function (k, inst) {
                it(k, function (done) {
                    inst.validate(function (err) {
                        expect(err || inst._saveError).to.not.be.ok();
                        done();
                    });
                });
            })(k, good[k]);
        }
    }
}

function checkBad (bad) {
    for (var k in bad) {
        if (bad.hasOwnProperty(k)) {
            (function (k, inst) {
                it(k, function (done) {
                    inst.validate(function (err) {
                        expect(err || inst._saveError).to.be.ok();
                        done();
                    });
                });
            })(k, bad[k]);
        }
    }
}

describe("Converter", function () {
    it("should reject non-object root schema", function () {
        expect(function () { MWS.convert({ type: "string" }, mongoose); }).to.throwException();
    });

    // exceptional cases
    it("should reject unknown types", function () {
        expect(function () {
                    MWS.convert({
                        type: "object"
                    ,   properties: {
                            name:   { type: "whatever" }
                        }
                    }, mongoose);
                }).to.throwException();
    });

    it("should not support arrays with positional types yet", function () {
        expect(function () {
                    MWS.convert({
                        type: "object"
                    ,   properties: {
                            name:   { type: "array", items: [{ type: "string" }, { type: "number" }] }
                        }
                    }, mongoose);
                }).to.throwException();
    });

    it("should not support union types yet", function () {
        expect(function () {
                    MWS.convert({
                        type: "object"
                    ,   properties: {
                            name:   { type: [{ type: "string" }, { type: "number" }] }
                        }
                    }, mongoose);
                }).to.throwException();
    });
    
    
    // booleans
    // note that in Mongoose booleans support casting whereas that doesn't work in a WS
    describe("for Booleans", function () {
        var sch = {
                type:   "object"
            ,   properties: {
                    name:   {
                        type:   "boolean"
                    ,   enum:   [false]
                    }
                }
            }
        ,   BoolEnum = mongoose.model("BoolEnum", MWS.convert(sch, mongoose))
        ;
        delete sch.properties.name.enum;
        var BoolAny = mongoose.model("BoolAny", MWS.convert(sch, mongoose))
        ,   good = {
                "should accept the correct enum":       new BoolEnum({ name: false })
            ,   "should accept true for any boolean":   new BoolAny({ name: true })
            ,   "should accept false for any boolean":  new BoolAny({ name: false })
            }
        ,   bad = {
                "should reject the wrong enum":                 new BoolEnum({ name: true })
            ,   "should reject non boolean for enum":           new BoolEnum({ name: "lala" })
            }
        ;
        checkGood(good);
        checkBad(bad);
    });

    // nulls
    describe("for nulls", function () {
        var sch = {
                type:   "object"
            ,   properties: {
                    name:   {
                        type:   "null"
                    }
                }
            }
        ,   NullModel = mongoose.model("NullModel", MWS.convert(sch, mongoose))
        ,   good = {
                "should accept null":               new NullModel({ name: null })
            ,   "should accept the empty string":   new NullModel({ name: "" })
            ,   "should accept undefined":          new NullModel({ name: undefined })
            }
        ,   bad = {
                "should reject non-null":   new NullModel({ name: "something" })
            ,   "should reject zero":       new NullModel({ name: 0 })
            ,   "should reject false":      new NullModel({ name: false })
            }
        ;
        checkGood(good);
        checkBad(bad);
    });

    // strings
    describe("for strings", function () {
        var sch = {
                type:   "object"
            ,   properties: {
                    str: { type: "string",  enum: ["a", "b"] }
                ,   txt: { type: "text",    enum: ["a", "b"] }
                ,   htm: { type: "html",    enum: ["a", "b"] }
                }
            }
        ,   StringsEnum = mongoose.model("StringsEnum", MWS.convert(sch, mongoose))
        ;
        sch.properties = {
            str: { type: "string",  pattern: "^a{3,5}$" }
        ,   txt: { type: "text",    pattern: "^a{3,5}$" }
        ,   htm: { type: "html",    pattern: "^a{3,5}$" }
        };
        var StringsPattern = mongoose.model("StringsPattern", MWS.convert(sch, mongoose));
        sch.properties = {
            str: { type: "string",  minLength: 3, maxLength: 5 }
        ,   txt: { type: "text",    minLength: 3, maxLength: 5 }
        ,   htm: { type: "html",    minLength: 3, maxLength: 5 }
        };
        var StringsLength = mongoose.model("StringsLength", MWS.convert(sch, mongoose));
        sch.properties = {
            str: { type: "string" }
        ,   txt: { type: "text" }
        ,   htm: { type: "html" }
        };
        var StringsSimple = mongoose.model("StringsSimple", MWS.convert(sch, mongoose))
        ,   good = {
                "should accept enum 'a'":       new StringsEnum({ str: "a", txt: "a", htm: "a" })
            ,   "should accept enum 'b'":       new StringsEnum({ str: "b", txt: "b", htm: "b" })
            ,   "should accept pattern":        new StringsPattern({ str: "aaa", txt: "aaaa", htm: "aaaaa" })
            ,   "should accept length strings": new StringsLength({ str: "aaa", txt: "aaaa", htm: "aaaaa" })
            ,   "should accept simple string":  new StringsSimple({ str: "aaa", txt: "aaaa", htm: "aaaaa" })
            }
        ,   bad = {
                "should reject enum 'c'":           new StringsEnum({ str: "c", txt: "c", htm: "c" })
            ,   "should reject non string in enum": new StringsEnum({ str: 5, txt: 5, htm: 5 })
            ,   "should reject pattern":            new StringsPattern({ str: "bbb", txt: "a", htm: "c" })
            ,   "should reject unanchored pattern": new StringsPattern({ str: "baaa", txt: "aaab", htm: "baaab" })
            ,   "should reject short strings":      new StringsLength({ str: "aa", txt: "aa", htm: "aa" })
            ,   "should reject long strings":       new StringsLength({ str: "aaaaaa", txt: "aaaaaa", htm: "aaaaaa" })
            ,   "should reject non simple string":  new StringsEnum({ str: 5, txt: 5, htm: 5 })
            }
        ;
        checkGood(good);
        checkBad(bad);
    });

    // numbers
    describe("for numbers", function () {
        var sch = {
                type:   "object"
            ,   properties: {
                    name: { type: "number", minimum: 3, maximum: 5 }
                }
            }
        ,   NumberMinMax = mongoose.model("NumberMinMax", MWS.convert(sch, mongoose))
        ;
        sch.properties.name = { type: "number", minimumExclusive: 3, maximumExclusive: 5 };
        var NumberExclusive = mongoose.model("NumberExclusive", MWS.convert(sch, mongoose));
        sch.properties.name = { type: "number" };
        var NumberSimple = mongoose.model("NumberSimple", MWS.convert(sch, mongoose))
        ,   good = {
                "should accept minmax 3":       new NumberMinMax({ name: 3 })
            ,   "should accept minmax 5":       new NumberMinMax({ name: 5 })
            ,   "should accept mmexcl 4":       new NumberExclusive({ name: 4 })
            ,   "should accept simple number":  new NumberSimple({ name: 44 })
            }
        ,   bad = {
                "should reject minmax 2":       new NumberMinMax({ name: 2 })
            ,   "should reject minmax 6":       new NumberMinMax({ name: 6 })
            ,   "should reject mmexcl 3":       new NumberExclusive({ name: 3 })
            ,   "should reject mmexcl 5":       new NumberExclusive({ name: 5 })
            ,   "should reject non number":     new NumberSimple({ name: "aaa" })
            }
        ;
        checkGood(good);
        checkBad(bad);
    });

    // any
    describe("for any", function () {
        var sch = {
                type: "object"
            ,   properties: {
                    name:   { type: "any" }
                }
            }
        ,   AnyExplicit = mongoose.model("AnyExplicit", MWS.convert(sch, mongoose))
        ;
        sch.properties.name = {};
        var AnyDefaulted = mongoose.model("AnyDefaulted", MWS.convert(sch, mongoose))
        ,   good = {
                "should accept any object (explicit)":  new AnyExplicit({ name: { blah: 3, foo: [{ bar: "zrub"}] } })
            ,   "should accept any object (implicit)":  new AnyDefaulted({ name: { blah: 3, foo: [{ bar: "zrub"}] } })
            ,   "should accept array":  new AnyExplicit({ name: []})
            ,   "should accept string": new AnyExplicit({ name: "foo" })
            ,   "should accept null":   new AnyExplicit({ name: null })
            }
        ,   bad = {}
        ;
        checkGood(good);
        checkBad(bad);
    });

    // arrays
    describe("for arrays", function () {
        var sch = {
                type: "object"
            ,   properties: {
                    name:   {
                        type:   "array"
                    ,   items:  {
                            type:   "object"
                        ,   properties: {
                                count:  { type: "number", maximum: 10 }
                            }
                        }
                    }
                }
            }
        ,   ArrayModel = mongoose.model("ArrayModel", MWS.convert(sch, mongoose))
        ,   good = {
                "should accept an empty array":     new ArrayModel({ name: [] })
            ,   "should accept a correct array":    new ArrayModel({ name: [{ count: 2 }, { count: 7 }] })
            }
        ,   bad = {
                "should reject string":             new ArrayModel({ name: "foo" })
            ,   "should reject incorrect array":    new ArrayModel({ name: [{ count: 42 }]})
            }
        ;
        checkGood(good);
        checkBad(bad);
    });

    // links
    describe("for links", function () {
        var sch = {
                type: "object"
            ,   properties: {
                    name:   { type: "link" }
                }
            }
        ,   LinkModel = mongoose.model("LinkModel", MWS.convert(sch, mongoose))
        ,   Test = mongoose.model("Test", new mongoose.Schema({ simple: "object"}) )
        ,   good = {
                "should accept an object id":   new LinkModel({ name: new mongoose.Types.ObjectId })
            ,   "should accept a model object": new LinkModel({ name: new Test() })
            }
        ,   bad = {
                "should reject string": new LinkModel({ name: "foo" })
            ,   "should reject number": new LinkModel({ name: 98 })
            }
        ;
        checkGood(good);
        checkBad(bad);
    });

    // dates, times
    describe("for dates and times", function () {
        var sch = {
                type: "object"
            ,   properties: {
                    name:   { type: "date" }
                }
            }
        ,   DateModel = mongoose.model("DateModel", MWS.convert(sch, mongoose))
        ;
        sch.properties.name.type = "time";
        var Time = mongoose.model("Time", MWS.convert(sch, mongoose));
        sch.properties.name.type = "datetime-local";
        var DateTimeLocal = mongoose.model("DateTimeLocal", MWS.convert(sch, mongoose))
        ,   good = {
                "should accept date":                       new DateModel({ name: "1977-03-15" })
            ,   "should accept basic time":                 new Time({ name: "20:17" })
            ,   "should accept time and seconds":           new Time({ name: "20:17:42" })
            ,   "should accept time and milliseconds":      new Time({ name: "20:17:42.123" })
            ,   "should accept basic datetime":             new DateTimeLocal({ name: "1977-03-15T20:17" })
            ,   "should accept datetime and seconds":       new DateTimeLocal({ name: "1977-03-15T20:17:42" })
            ,   "should accept datetime and milliseconds":  new DateTimeLocal({ name: "1977-03-15T20:17:42.1" })
            }
        ,   bad = {
                "should reject bad string date":        new DateModel({ name: "13-07-04" })
            ,   "should reject impossible date":        new DateModel({ name: "2013-02-32" })
            ,   "should reject bad string time":        new Time({ name: "2:14" })
            ,   "should reject bad string time (2)":    new Time({ name: "12:13:24.1234" })
            ,   "should reject impossible time":        new Time({ name: "24:12" })
            ,   "should reject bad string datetime":    new DateTimeLocal({ name: "1977-03-15T20:1" })
            ,   "should reject impossible datetime":    new DateTimeLocal({ name: "1977-13-15T20:17" })
            }
        ;
        checkGood(good);
        checkBad(bad);
    });

    // objects
    describe("for objects", function () {
        var sch = {
                type: "object"
            ,   properties: {
                    name:    { type: "string", required: true }
                }
            }
        ,   Required = mongoose.model("Required", MWS.convert(sch, mongoose))
        ,   good = {
                "should accept with string":    new Required({ name: "there" })
            }
        ,   bad = {
                "should reject missing":    new Required({ other: "there" })
            }
        ;
        checkGood(good);
        checkBad(bad);
    });

});
