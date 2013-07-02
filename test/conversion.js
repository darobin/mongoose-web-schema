/*jshint es5: true */
/*global describe, it*/

var MWS = require("../lib")
,   expect = require("expect.js")
,   mongoose = require("mongoose")
;

describe("Converter", function () {
    it("should reject non-object root schema", function () {
        expect(function () { MWS.convert({ type: "string" }); }).to.throwException();
    });

    // exceptional cases
    it("should reject unknown types", function () {
        expect(function () {
                    MWS.convert({
                        type: "object"
                    ,   properties: {
                            name:   { type: "whatever" }
                        }
                    });
                }).to.throwException();
    });

    it("should not support arrays with positional types yet", function () {
        expect(function () {
                    MWS.convert({
                        type: "object"
                    ,   properties: {
                            name:   { type: "array", items: [{ type: "string" }, { type: "number" }] }
                        }
                    });
                }).to.throwException();
    });

    it("should not support union types yet", function () {
        expect(function () {
                    MWS.convert({
                        type: "object"
                    ,   properties: {
                            name:   { type: [{ type: "string" }, { type: "number" }] }
                        }
                    });
                }).to.throwException();
    });
    
    
    // booleans
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
        ,   BoolEnum = mongoose.model("BoolEnum", MWS.convert(sch))
        ;
        delete sch.properties.name.enum;
        var BoolAny = mongoose.model("BoolAny", MWS.convert(sch))
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
        for (var k in good) {
            if (good.hasOwnProperty(k)) {
                (function (k, inst) {
                    it(k, function (done) {
                        inst.validate(function (err) {
                            expect(err).to.not.be.ok();
                            done();
                        });
                    });
                })(k, good[k]);
            }
        }
        for (var k in bad) {
            if (bad.hasOwnProperty(k)) {
                (function (k, inst) {
                    it(k, function (done) {
                        inst.validate(function (err) {
                            expect(err).to.be.ok();
                            done();
                        });
                    });
                })(k, bad[k]);
            }
        }
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
//  - boolean is boolean
//      . constraints
//  - null is null
//  - link is objectid
//  - date, time, datetime-local is date