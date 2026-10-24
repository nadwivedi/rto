# RTO Sarthi Vehicle Info API

Get vehicle (RC) details of any Indian vehicle number as JSON.

## Quick start

1. Use the API key RTO Sarthi gave you.
2. Send a GET request with the vehicle number and your key in the `x-api-key` header.
3. Read the vehicle details from `data` and your calls left from `usage.remaining`.

```bash
curl -H "x-api-key: YOUR_API_KEY" "https://api.rtosarthi.com/api/v1/vehicle-info?vno=CG04AB1234"
```

## Request

```
GET https://api.rtosarthi.com/api/v1/vehicle-info?vno=CG04AB1234
x-api-key: YOUR_API_KEY
```

| Parameter | Where | Required | Description |
|-----------|-------|----------|-------------|
| `vno` | Query (GET) or JSON body (POST) | Yes | Vehicle number, e.g. CG04AB1234 or 23BH4512AB. Spaces and dashes are fine. |
| `x-api-key` | Header | Yes | Your API key. |

POST to the same URL with a JSON body `{"vno": "CG04AB1234"}` also works.

Keep your API key secret and call the API from your server, not from browser JavaScript or a mobile app.

## Success response

```json
{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "CG04AB1234",
  "data": {
    "REGN_NO": "CG04AB1234",
    "REGISTERED_AT": "RAIPUR RTO, CHHATTISGARH",
    "OWNER_NAME": "RAM KUMAR",
    "OWNER_SERIAL_NO": "1",
    "PRESENT_ADDRESS": "WARD NO 12, TELIBANDHA, RAIPUR, CHHATTISGARH 492001",
    "VEHICLE_CLASS": "GOODS CARRIER (LGV)",
    "MAKER_DESC": "TATA MOTORS LTD",
    "MAKER_MODEL": "ACE GOLD",
    "FUEL_DESC": "DIESEL",
    "FUEL_NORMS": "BHARAT STAGE VI",
    "COLOR": "WHITE",
    "CHASI_NO": "MAT445123K1A12345",
    "ENG_NO": "275IDI12ABC345",
    "REGN_DT": "15-Jun-2019",
    "REGN_UPTO": "14-Jun-2034",
    "FINANCER_DETAILS": "SHRIRAM FINANCE LTD",
    "INSURANCE_COMP": "TATA AIG GENERAL INSURANCE CO. LTD.",
    "INS_POLICY_NO": "0164123456",
    "INSURANCE_UPTO": "12-Mar-2027",
    "PUCC_NO": "CG01200030012345",
    "PUCC_UPTO": "20-Dec-2026",
    "FIT_UPTO": "14-Jun-2027",
    "TAX_UPTO": "31-Mar-2027",
    "BLACKLIST_STATUS": "NA",
    "NOC_DETAILS": "NA"
  },
  "source": "rtosarthi_api1",
  "usage": { "limit": 1000, "used": 101, "remaining": 899 }
}
```

Sample data. Fields are returned wherever they are available on the vehicle record. A field with no value is `"NA"`.

`usage.remaining` is how many calls you have left.
Only successful calls use up your limit.

`source` says which RTO Sarthi API served the call: `rtosarthi_api1` or `rtosarthi_api2`. The fields in `data` are the same for both. Every reply has `source` and `usage`, including errors.

## Main fields in `data`

| Field | Meaning |
|-------|---------|
| `REGN_NO` | Vehicle number |
| `REGISTERED_AT` | Registering RTO and state |
| `OWNER_NAME` | Registered owner |
| `OWNER_SERIAL_NO` | 1 = first owner, 2 = second owner… |
| `PRESENT_ADDRESS` | Owner's address |
| `VEHICLE_CLASS` | e.g. MOTOR CAR (LMV), M-CYCLE/SCOOTER (2WN) |
| `MAKER_DESC` / `MAKER_MODEL` | Manufacturer / model |
| `FUEL_DESC` / `FUEL_NORMS` | Fuel / emission norms |
| `CHASI_NO` / `ENG_NO` | Chassis / engine number |
| `REGN_DT` / `REGN_UPTO` | Registration date / valid up to |
| `FINANCER_DETAILS` | Financer (hypothecation) |
| `INSURANCE_COMP` / `INS_POLICY_NO` / `INSURANCE_UPTO` | Insurance company / policy / valid up to |
| `PUCC_UPTO` / `FIT_UPTO` / `TAX_UPTO` | PUC / fitness / road tax valid up to (LTT = lifetime tax) |
| `BLACKLIST_STATUS` / `NOC_DETAILS` | Blacklist / NOC |

## Errors

On an error, `success` is `false` and `message` says what went wrong.

| Code | Meaning | Uses a call? |
|------|---------|--------------|
| 400 | Vehicle number missing or invalid | No |
| 401 | API key missing or wrong | No |
| 403 | Limit used up, or key switched off | No |
| 404 | Vehicle not found | No |
| 502 | Service busy, try again | No |

## Examples

cURL:

```bash
curl -H "x-api-key: YOUR_API_KEY" "https://api.rtosarthi.com/api/v1/vehicle-info?vno=CG04AB1234"
```

Node.js:

```js
const res = await fetch('https://api.rtosarthi.com/api/v1/vehicle-info?vno=CG04AB1234', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
const body = await res.json()

if (body.success) console.log(body.data, body.usage.remaining)
else console.log(body.message)
```

PHP:

```php
$ch = curl_init('https://api.rtosarthi.com/api/v1/vehicle-info?vno=CG04AB1234');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ['x-api-key: YOUR_API_KEY'],
  CURLOPT_TIMEOUT => 30,
]);
$body = json_decode(curl_exec($ch), true);
curl_close($ch);

echo $body['success'] ? $body['data']['MAKER_MODEL'] : $body['message'];
```

Python:

```python
import requests

res = requests.get(
    "https://api.rtosarthi.com/api/v1/vehicle-info",
    params={"vno": "CG04AB1234"},
    headers={"x-api-key": "YOUR_API_KEY"},
    timeout=30,
)
body = res.json()
print(body["data"] if body["success"] else body["message"])
```

## Tips

- Set a timeout of about 30 seconds. On a 502, wait a few seconds and try once more.
- Save the response if you need the same vehicle again, instead of calling twice.
- Recharge before `usage.remaining` reaches 0.

To recharge or get a new key, contact RTO Sarthi.
