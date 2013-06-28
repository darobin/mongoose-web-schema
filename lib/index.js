
/*jshint es5: true */

var mongoose = require("mongoose")
,   Schema = mongoose.Schema
,   Null = require("./null-type")
;

function isArray (obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
}

function getType (ws) {
    var type = ws.type || "any";
    
    if (type === "any") {
        return { type: Schema.Types.Mixed };
    }
    else if (type === "object") {
        var obj = {};
        for (var k in ws.properties) {
            if (!ws.properties.hasOwnProperty(k)) continue;
            obj[k] = getType(ws.properties[k]);
            if (ws.properties[k].required) obj[k].required = true;
        }
        return obj;
    }
    else if (type === "array") {
        if (isArray(ws.items)) {
            // array of types
        }
        else {
            // handle the array type
            // possibly recurse
        }
    }
    else if (type === "string" || type === "text" || type === "html") {
        var ret = { type: String }
        ,   validators = []
        ;
        if (ws.enum) ret.enum = ws.enum;
        if (ws.pattern) ret.match = new RegExp(ws.pattern);
        if ("maxLength" in ws) validators.push({
                validator:  function (val) { return val.length <= ws.maxLength; }
            ,   message:    "String longer than " + ws.maxLength
            });
        if ("minLength" in ws) validators.push({
                validator:  function (val) { return val.length >= ws.minLength; }
            ,   message:    "String shorter than " + ws.minLength
            });
        if (validators.length) ret.validate = validators;
        return ret;
    }
    else if (type === "number") {
        var ret = { type: Number }
        ,   validators = []
        ;
        if (ws.enum) validators.push({
                validator:  function (val) { return ws.enum.indexOf(val) > -1; }
            ,   message:    "Number not in enumeration: " + ws.enum.join(", ")
            });
        if ("maximum" in ws) ret.max = ws.maximum;
        if ("minimum" in ws) ret.min = ws.minimum;
        if ("maximumExclusive" in ws) validators.push({
                validator:  function (val) { return val < ws.maximumExclusive; }
            ,   message:    "Number not strictly less than: " + ws.maximumExclusive
            });
        if ("minimumExclusive" in ws) validators.push({
                validator:  function (val) { return val > ws.minimumExclusive; }
            ,   message:    "Number not strictly more than: " + ws.minimumExclusive
            });
        if (validators.length) ret.validate = validators;
        return ret;
    }
    else if (type === "boolean") {
        var ret = { type: Boolean }
        ,   validators = []
        ;
        if (ws.enum) validators.push({
                validator:  function (val) { return ws.enum.indexOf(val) > -1; }
            ,   message:    "Boolean not in enumeration: " + ws.enum.join(", ")
            });
        if (validators.length) ret.validate = validators;
        return ret;
    }
    else if (type === "null") {
        return { type: Null };
    }
    else if (isArray(type)) {
        // unions
        // check for enums
        // possibly recurse
    }
    else if (type === "link") {
        // this is a link between objects, need to handle it
        // unless it's external?
    }
}

exports.convert = function (ws) {
    if (ws.type !== "object") throw({ message: "The schema root has to be of object type." });
    return new Schema(getType(ws));
};
