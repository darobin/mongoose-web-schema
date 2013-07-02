/*global before, after, describe, it*/

var MWS = require("../lib")
,   expect = require("expect.js")
,   mongoose = require("mongoose")
,   fakeMongo = require("mongodb-fs")
,   portfinder = require("portfinder")
;


// set up objects and mocking
before(function (done) {
    portfinder.getPort(function (err, port) {
        if (err) throw(err);
        fakeMongo.init({
            port:   port
        ,   mocks:  {
                testdb: {}
            }
        });
        fakeMongo.start(function (err) {
            if (err) throw(err);
            mongoose.connect("mongodb://localhost:" + port + "/testdb", {}, function (err) {
                if (err) throw(err);
                done();
            });
        });
    });
});

after(function (done) {
    mongoose.disconnect(function (err) {
        if (err) throw(err);
        fakeMongo.stop(function (err) {
            if (err) throw(err);
            done();
        });
    });
});

describe("Converter", function () {
    it("should reject non-object root schema", function () {
        expect(function () { MWS.convert({ type: "string" }); }).to.throwException();
    });

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