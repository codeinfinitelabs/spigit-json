'use strict';

const Stream = require('stream');
const SpigitJson = require('../lib');
const Chai = require('chai');

const expect = Chai.expect;

describe('SpigitJson', () => {

    const timestamp = 'timestamp';

    const getPublisher = function () {

        const publisher = new Stream.Readable({ objectMode: true });
        publisher._read = () => {};

        return publisher;
    };

    it('does not allow unknown options', (done) => {

        expect(() => new SpigitJson({ bogus: 'option' })).to.throw('"bogus" is not allowed');
        done();
    });

    it('uses the space option', (done) => {

        const stream = new SpigitJson({ space: 2 });
        const logs = [];
    
        stream.on('data', (log) => {

            logs.push(log);
        });

        stream.on('end', () => {

            expect.fail('End should never be called');
        });

        const publisher = getPublisher();

        publisher.pipe(stream);

        const timestamp = 'timestamp';

        publisher.push({ level: 'debug', payload: { a: 1 }, timestamp });
        publisher.push({ level: 'info', payload: { b: 1 }, timestamp });
        publisher.push({ level: 'warn', payload: { c: 1 }, timestamp });
        publisher.push({ level: 'error', payload: { d: 1 }, timestamp });

        setTimeout(() => {
            expect(logs).to.deep.equal([
                '{\n  "level": "debug",\n  "payload": {\n    "a": 1\n  },\n  "timestamp": "timestamp"\n}\n',
                '{\n  "level": "info",\n  "payload": {\n    "b": 1\n  },\n  "timestamp": "timestamp"\n}\n',
                '{\n  "level": "warn",\n  "payload": {\n    "c": 1\n  },\n  "timestamp": "timestamp"\n}\n',
                '{\n  "level": "error",\n  "payload": {\n    "d": 1\n  },\n  "timestamp": "timestamp"\n}\n'
            ]);
            done();
        }, 100);
    });

    it('uses a custom replacer option', (done) => {

        const stream = new SpigitJson({ replacer: (key, value) => 'test' });
        const logs = [];
    
        stream.on('data', (log) => {

            logs.push(log);
        });

        stream.on('end', () => {

            expect.fail('End should never be called');
        });

        const publisher = getPublisher();

        publisher.pipe(stream);

        const timestamp = 'timestamp';

        publisher.push({ level: 'debug', payload: { a: 1 }, timestamp });

        setTimeout(() => {
            expect(logs).to.deep.equal([ '"test"\n' ]);
            done();
        }, 100);
    });

    it('converts to JSON', (done) => {

        const stream = new SpigitJson();
        const logs = [];
    
        stream.on('data', (log) => {

            logs.push(log);
        });

        stream.on('end', () => {

            expect.fail('End should never be called');
        });

        const publisher = getPublisher();

        publisher.pipe(stream);

        const timestamp = 'timestamp';

        publisher.push({ level: 'debug', payload: { a: 1 }, timestamp });
        publisher.push({ level: 'info', payload: { b: 1 }, timestamp });
        publisher.push({ level: 'warn', payload: { c: 1 }, timestamp });
        publisher.push({ level: 'error', payload: { d: 1 }, timestamp });

        setTimeout(() => {
            expect(logs).to.deep.equal([
                '{"level":"debug","payload":{"a":1},"timestamp":"timestamp"}\n',
                '{"level":"info","payload":{"b":1},"timestamp":"timestamp"}\n',
                '{"level":"warn","payload":{"c":1},"timestamp":"timestamp"}\n',
                '{"level":"error","payload":{"d":1},"timestamp":"timestamp"}\n'
            ]);
            done();
        }, 100);
    });

    it('handles error objects and converts JSON', (done) => {

        const stream = new SpigitJson({});
        const logs = [];
    
        stream.on('data', (log) => {

            logs.push(log);
        });

        stream.on('end', () => {

            expect.fail('End should never be called');
        });

        const publisher = getPublisher();

        publisher.pipe(stream);

        publisher.push({ level: 'error', payload: { error: new Error('boo boo') }, timestamp });

        setTimeout(() => {
            expect(logs).to.have.lengthOf(1);
            const obj = JSON.parse(logs[0]);
            expect(obj.payload.error.message).to.equal('boo boo');
            expect(obj.payload.error.name).to.equal('Error');
            expect(obj.payload.error.stack).to.exist;
            done();
        }, 100);
    });
});