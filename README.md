
# Overview

The purpose of this library is to take a [Web Schema](https://github.com/darobin/web-schema)
and generate from it a Mongoose schema that's ready to turn into a model and use with MongoDB.

The conversion is not perfect in terms of validation but it is overall roughly good (if you want
strict validation, use the original schema directly — it's unlikely to present a performance
bottleneck). Also, proper round-tripping is expected.

The following Web Schema constructs are not yet supported (but will be):

* Union types
* Arrays with positional types

In order to match MongoDB's expectations, a schema's root must be of type "object". That should
match the vast majority of uses. In other cases, you can wrap what you have in an object with a
data field since Mongo supports nested documents (and nested schemata).

# Installing

The usual simple:

    npm install mongoose-web-schema

# API

The API is very simple:

```javascript
var MWS = require("mongoose-web-schema")
,   mongoose = require("mongoose")
,   webSchema = {
        type: "object"
    ,   properties: {
            name:    { type: "string", required: true, pattern: "^a{1,3}$" }
        }
    }
,   mongooseSchema = MWS.convert(webSchema, mongoose)
;
```
#### var mongooseSchema = MWS.convert(webSchema, mongoose)

This takes a Web Schema and the mongoose object you are using (this is required so that it can
register its own types) and returns a corresponding Mongoose Schema object. It throws on error.
