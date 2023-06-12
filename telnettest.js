// @ts-nocheck
const { Telnet } = require('telnet-client');

async function test() {
    const connection = new Telnet();



    // these parameters are just examples and most probably won't work for your use-case.
    const params = {
        host: '192.168.1.102',
        port: 23,
        timeout: 10000,
        negotiationMandatory: false
    };

    try {
        await connection.connect(params);
    } catch (error) {
        // handle the throw (timeout)
    }

    connection.shell(function (error, stream) {
        // @ts-ignore
        stream.on('data', (data) => console.log(data.toString()));
        console.log('ttt');
        stream.write('Subscribe Ds/Volume 2\n');
        setTimeout(() => stream.write('Action Ds/Volume 2 SetVolume "30"\n'), 5000);


    });

    // setTimeout(() => console.log('end'), 10000);


}

console.log('test');
test();

// Action Ds/Volume 2 SetVolume “45”