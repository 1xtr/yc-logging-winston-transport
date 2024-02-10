# Winston transport for Yandex Cloud Logging

### Attention:
> This transport use client from `@1xtr/yc-log-client` and only work inside cloud,
> where app have access to metadata for getting token
>
> `http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token`

Using other auth type (e.g. OAuth-Token, IamToken, SA) added later... may be, write an issue if needed.

### Required timestamp in logs

```js
const winstonOptions = {
  format: format.combine(
    format.timestamp({
      format: () => Date.now().toString(), // required
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new YCLoggingTransport({
      // folderId: 'b1g1****', // highest priority than logGroupId
      logGroupId: 'e23ps****',
      resourceType: 'node01',
      resourceId: 'api-client',
      streamName: 'test',
    }),
  ],
}
```
