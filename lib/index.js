
/*jshint es5: true */

var Schema
,   Null
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
            throw({ message: "Array of positional types are not yet supported." });
        }
        else {
            // there are constraints which we don't enforce here
            return [getType(ws.items)];
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
        if (ws.enum) (function (enm) {
            validators.push({
                    validator:  function (val) { return enm.indexOf(val) > -1; }
                ,   message:    "Boolean not in enumeration: " + enm.join(", ")
                });
        })(ws.enum);
        if (validators.length) ret.validate = validators;
        return ret;
    }
    else if (type === "null") {
        return { type: Null };
    }
    else if (isArray(type)) {
        // unions
        throw({ message: "Union types are not yet supported." });
    }
    else if (type === "link") {
        return { type: Schema.Types.ObjectId };
    }
    else if (type === "date") {
        return {
            type: String
        ,   validate:   [{
                validator:  function (val) {
                    return (/^\d{4}-\d\d-\d\d$/).test(val) && new Date(val).toString() !== "Invalid Date";
                }
            ,   message:    "Not a valid date."
            }]
        };
    }
    else if (type === "time") {
        return {
            type: String
        ,   validate:   [{
                validator:  function (val) {
                    return (/^\d\d:\d\d(:\d\d(\.\d{1,3})?)?$/).test(val) &&
                           new Date("1111-11-11T" + val).toString() !== "Invalid Date";
                }
            ,   message:    "Not a valid time."
            }]
        };
    }
    else if (type === "datetime-local") {
        return {
            type: String
        ,   validate:   [{
                validator:  function (val) {
                    return (/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d{1,3})?)?$/).test(val) &&
                           new Date(val).toString() !== "Invalid Date";
                }
            ,   message:    "Not a valid datetime-local."
            }]
        };
    }
    else {
        throw({ message: "Unknown type " + type });
    }
}

exports.convert = function (ws, mongoose) {
    Schema = mongoose.Schema;
    Null = require("./null-type")(mongoose);
    if (ws.type !== "object") throw({ message: "The schema root has to be of object type." });
    return Schema(getType(ws));
};
