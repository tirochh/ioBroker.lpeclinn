'use strict';

/*
 * Created with @iobroker/create-adapter v2.4.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
// const fs = require("fs");
const { Telnet } = require('telnet-client');


class Lpeclinn extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'lpeclinn',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));

        this.connection = new Telnet();
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here

        // Reset the connection indicator during startup
        this.setState('info.connection', false, true);

        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        this.log.info('config option1: ' + this.config.option1);
        this.log.info('config option2: ' + this.config.option2);

        // Init Telnet
        const params = {
            host: '192.168.1.102',
            port: 23,
            timeout: 10000,
            negotiationMandatory: false
        };

        try {
            await this.connection.connect(params);
        } catch (error) {
            // handle the throw (timeout)
            this.log.error('No connection');
            return;
        }
        this.setState('info.connection', true, true);
        // const log = this.log;
        const onLinnEvent = this.onLinnEvent;
        this.connection.shell((error, stream) => {
            // @ts-ignore
            stream.on('data', (data) => {
                const events = data.toString().split(/\r?\n/);
                events.forEach(event => {
                    onLinnEvent.bind(this)(event);
                });

            });
            this.log.info('Subscribe Ds/Volume 2');
            // @ts-ignore
            stream.write('Subscribe Ds/Volume 2\n');

            this.log.info('Subscribe Ds/Product 2');
            // @ts-ignore
            stream.write('Subscribe Ds/Product 2\n');

            this.log.info('Subscribe Ds/Radio 1');
            // @ts-ignore
            stream.write('Subscribe Ds/Radio 1\n');

            this.stream = stream;

        });

        /*
        For every state in the system there has to be also an object of type state
        Here a simple template for a boolean variable named "testVariable"
        Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
        */
        // await this.setObjectNotExistsAsync('testVariable', {
        //     type: 'state',
        //     common: {
        //         name: 'testVariable',
        //         type: 'boolean',
        //         role: 'indicator',
        //         read: true,
        //         write: true,
        //     },
        //     native: {},
        // });

        // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
        this.subscribeStates('device.volume');
        this.subscribeStates('device.mute');
        this.subscribeStates('device.standby');
        this.subscribeStates('device.sourceIndex');
        this.subscribeStates('device.radio');

        // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
        // this.subscribeStates('lights.*');
        // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
        // this.subscribeStates('*');

        /*
            setState examples
            you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
        */
        // the variable testVariable is set to true as command (ack=false)
        // await this.setStateAsync('testVariable', true);

        // same thing, but the value is flagged "ack"
        // ack should be always set to true if the value is received from or acknowledged from the target system
        // await this.setStateAsync('testVariable', { val: true, ack: true });

        // same thing, but the state is deleted after 30s (getState will return null afterwards)
        // await this.setStateAsync('testVariable', { val: true, ack: true, expire: 30 });

        // examples for the checkPassword/checkGroup functions
        // let result = await this.checkPasswordAsync('admin', 'iobroker');
        // this.log.info('check user admin pw iobroker: ' + result);

        // result = await this.checkGroupAsync('admin', 'admin');
        // this.log.info('check group user admin group admin: ' + result);
    }

    async setLinnEventToIOBroker(events, linnName, ioBrokerName) {
        const iv = events.findIndex(i => i == linnName);
        if (iv > 0) {
            this.log.info(`Set ${linnName}:   ${events[iv + 1]}`);
            await this.setStateAsync(ioBrokerName, { val: events[iv + 1].slice(1, -1), ack: true });
        }
    }

    async onLinnEvent(event) {
        if (!event || event == '') return;
        this.log.info('LPEC Linn Event: ' + event);
        const events = event.split(' ');

        if (events[0] == 'EVENT') {
            this.setLinnEventToIOBroker.bind(this)(events, 'Volume', 'device.volume');
            this.setLinnEventToIOBroker.bind(this)(events, 'Mute', 'device.mute');
            this.setLinnEventToIOBroker.bind(this)(events, 'Standby', 'device.standby');
            this.setLinnEventToIOBroker.bind(this)(events, 'SourceIndex', 'device.sourceIndex');
            this.setLinnEventToIOBroker.bind(this)(events, 'Id', 'device.radio');
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            callback();
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  * @param {string} id
    //  * @param {ioBroker.Object | null | undefined} obj
    //  */
    // onObjectChange(id, obj) {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`IOBroker change: state ${id} changed: ${state.val} (ack = ${state.ack})`);
            if (state.ack) return;

            const onlyId = id.replace(this.namespace + '.', '');
            switch (onlyId) {
                case 'device.volume':
                    // @ts-ignore
                    this.stream.write(`Action Ds/Volume 2 SetVolume "${state.val}"  \n`);
                    break;
                case 'device.mute':
                    // @ts-ignore
                    this.stream.write(`Action Ds/Volume 2 SetMute "${state.val ? 'true' : 'false'}"  \n`);
                    break;
                case 'device.standby':
                    // @ts-ignore
                    this.stream.write(`Action Ds/Product 2 SetStandby "${state.val ? 'true' : 'false'}"  \n`);
                    break;
                case 'device.sourceIndex':
                    // @ts-ignore
                    this.stream.write(`Action Ds/Product 2 SetSourceIndex "${state.val}" \n`);
                    // @ts-ignore
                    this.stream.write(`Action Ds/Product 2 Play  \n`);
                    break;
                case 'device.radio':
                    // @ts-ignore
                    this.stream.write(`Action Ds/Radio 1 SetId "${state.val}" "" \n`);
                    // @ts-ignore
                    this.stream.write(`Action Ds/Radio 1 Play  \n`);
                    break;
            }

        } else {
            // The state was deleted
            this.log.info(`IOBroker change: state ${id} deleted`);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    // onMessage(obj) {
    //     if (typeof obj === 'object' && obj.message) {
    //         if (obj.command === 'send') {
    //             // e.g. send email or pushover or whatever
    //             this.log.info('send command');

    //             // Send response in callback if required
    //             if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
    //         }
    //     }
    // }

}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Lpeclinn(options);
} else {
    // otherwise start the instance directly
    new Lpeclinn();
}
