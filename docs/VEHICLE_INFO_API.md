# RTO Sarthi Vehicle Info API

Get vehicle (RC) details by vehicle number.

## Request

```
GET https://api.rtosarthi.com/api/v1/vehicle-info?vno=CG12BU5574
x-api-key: YOUR_API_KEY
```

- `vno`: the vehicle number. Spaces and dashes are fine.
- `x-api-key`: your API key, sent as a header.

Keep your API key secret and call the API from your server, not from browser JavaScript.

## Success response

```json
{
  "success": true,
  "vehicleNumber": "CG12BU5574",
  "data": {
    "OWNER_NAME": "RAM KUMAR",
    "MAKER_MODEL": "ACE GOLD",
    "INSURANCE_UPTO": "12-Mar-2027"
  },
  "usage": { "limit": 1000, "used": 101, "remaining": 899 }
}
```

`usage.remaining` is how many calls you have left.
Only successful calls use up your limit.

## Errors

On an error, `success` is `false` and `message` says what went wrong.

| Code | Meaning |
|------|---------|
| 400 | Vehicle number missing or invalid |
| 401 | API key missing or wrong |
| 403 | Limit used up, or key switched off |
| 404 | Vehicle not found |
| 502 | Service busy, try again |

## Example

```bash
curl -H "x-api-key: YOUR_API_KEY" "https://api.rtosarthi.com/api/v1/vehicle-info?vno=CG12BU5574"
```

```js
const res = await fetch('https://api.rtosarthi.com/api/v1/vehicle-info?vno=CG12BU5574', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
const body = await res.json()

if (body.success) console.log(body.data, body.usage.remaining)
else console.log(body.message)
```

To recharge or get a new key, contact RTO Sarthi.
