
var mongoose = require("mongoose")
;

function isArray (obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
}

function processSchema (ws, mng) {
    var type = ws.type || "any";
    
    if (type === "any") {
        // Mixed?
    }
    else if (type === "object") {
        // work through properties
        // possibly recurse
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
        // check for enums
        // String
        // these might be separated to support document storage?
    }
    else if (type === "number") {
        // check for enums
        // Number
    }
    else if (type === "boolean") {
        // check for enums
        // Boolean
    }
    else if (type === "null") {
        // need a special Null type which we add
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
    var mng = {};
    processSchema(ws, mng);
    return new mongoose.Schema(mng);
};
