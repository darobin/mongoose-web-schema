
var util = require("util")
;

// implements the overwhelmingly useful Null type
// this validates with extreme prejudice that a value is, actually, null
// ZOMG I can't believe this is not in the core type library!!!

module.exports = function Null (mongoose) {
    var Schema = mongoose.Schema
    ,   SchemaType = mongoose.SchemaType
    ,   Types = mongoose.Types
    ,   mongo = mongoose.mongo;

    function Null (key, options) {
        SchemaType.call(this, key, options, "Null");
        this.validators.push([function (val) {
            return val === null || val === undefined || val === "";
        }, "null"]);
    }
    util.inherits(Null, SchemaType);

    Null.prototype.checkRequired = function (val) {
        return val === null;
    };

    // we accept undefined and the empty string
    Null.prototype.cast = function (val) {
        // return null;
        if (val === null) return null;
        if (val === undefined) return null;
        if (val === "") return null;
        if (val instanceof Null) return val;
        throw new SchemaType.CastError("Null", val, this.path);
    };

    function handleSingle (val) { return this.cast(val); }
    function handleArray (val) {
        var self = this;
        return val.map( function (m) { return self.cast(m); });
    }
    Null.prototype.$conditionalHandlers = {
        "$lt":  handleSingle
    ,   "$lte": handleSingle
    ,   "$gt":  handleSingle
    ,   "$gte": handleSingle
    ,   "$ne":  handleSingle
    ,   "$in":  handleArray
    ,   "$nin": handleArray
    ,   "$mod": handleArray
    ,   "$all": handleArray
    };

    Null.prototype.castForQuery = function ($conditional, value) {
        if (arguments.length === 2) {
            var handler = this.$conditionalHandlers[$conditional];
            if (!handler) throw new Error("Can't use " + $conditional + " with Null.");
            return handler.call(this, value);
        }
        else {
            return this.cast($conditional);
        }
    };
    Schema.Types.Null = Null;
    Types.Null = mongo.Null;
    return Null;
};
