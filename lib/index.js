'use strict';

const Hoek = require('hoek');
const Joi = require('joi');
const Stream = require('stream');
const Stringify = require('fast-safe-stringify');


const internals = {};


class SpigitJson extends Stream.Transform {

    constructor(options) {

        super({ objectMode: true });
        this.options = internals.processOptions(options);
    }

    _transform(data, encoding, callback) {

        return callback(null, this._format(data));
    }

    _format(data) {

        return Stringify({
            level: data.level,
            payload: data.payload,
            timestamp: data.timestamp
        }, 
        this.options.replacer, 
        this.options.space) + '\n';
    }
};

internals.processOptions = function (options = {}) {

    const _options = Hoek.applyToDefaults({ replacer: internals.replacer }, options, true);
    const result = Joi.validate(_options, internals.schema);

    if (result.error) {
        throw result.error;
    }

    return result.value;
};

internals.replacer = function (key, value) {

    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack
        };
    }

    return value
};

internals.schema = Joi.object().keys({
    replacer: Joi.alternatives().try(Joi.func(), Joi.array().items(Joi.string(), Joi.number())).allow(null),
    space: Joi.alternatives().try(Joi.string(), Joi.number())
});

module.exports = SpigitJson;