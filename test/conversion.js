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

});

// TEST:
//  - any is mixed
//  - object with properties
//  - array
//      . ws.items is subdocuments
//  - string, text, html is string
//      . constraints
//  - number is number
//      . constraints
//  - null is null
//  - link is objectid
//  - date, time, datetime-local is date