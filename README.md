# chartmogul-intercom

ChartMogul integration with Intercom

This Node.js Express app should demonstrate how to integrate cloud apps such as [Intercom](https://intercom.io/) with [ChartMogul](http://chartmogul.com/). The integration automatically imports Intercom customer attributes and tags into your ChartMogul account.

## Run locally

This will run the integration locally at localhost:3000.

```
git clone https://github.com/bilbof/chartmogul-intercom
cd chartmogul-intercom
npm install
npm start
```

Please note that the Intercom integration requires a MongoDB URL `dbURL` in the database controller [here](https://github.com/bilbof/chartmogul-intercom/blob/master/controllers/database/index.js#L4). You would need to add this prior to running the app or setting up a webhook.