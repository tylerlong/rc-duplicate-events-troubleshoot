import RingCentral from '@rc-ex/core';
import PubNubExtension from '@rc-ex/pubnub';
import waitFor from 'wait-for-async';

const main = async () => {
  const rc = new RingCentral({
    server: process.env.RINGCENTRAL_SERVER_URL,
    clientId: process.env.RINGCENTRAL_CLIENT_ID,
    clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET,
  });
  await rc.authorize({
    username: process.env.RINGCENTRAL_USERNAME!,
    extension: process.env.RINGCENTRAL_EXTENSION,
    password: process.env.RINGCENTRAL_PASSWORD!,
  });
  const pubnubExt = new PubNubExtension();
  await rc.installExtension(pubnubExt);
  await pubnubExt.subscribe(
    [
      '/restapi/v1.0/account/~/extension/~/presence?detailedTelephonyState=true',
    ],
    event => {
      console.log(JSON.stringify(event, null, 2));
    }
  );

  const status: ('Available' | 'Offline' | 'Busy')[] = [
    'Available',
    'Offline',
    'Busy',
  ];
  let index = 0;
  const interval = setInterval(async () => {
    await rc
      .restapi()
      .account()
      .extension()
      .presence()
      .put({
        userStatus: status[index++],
      });
    if (index >= 3) {
      clearInterval(interval); // stop after 3 API calls.
    }
  }, 5000); // every 5 seconds

  await waitFor({interval: 20000}); // exit after 20 minute
  await rc.revoke();
};

main();
