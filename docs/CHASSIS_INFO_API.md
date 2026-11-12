# RTO Sarthi · Chassis to RC API

Get the vehicle number and RC details of an Indian vehicle from its **chassis number** and **engine number**, as JSON.

## 1. Your API key

```
YOUR_API_KEY
```

> Keep this key secret. Call the API from your server, not from browser JavaScript or a mobile app.

## 2. Request

| | |
|---|---|
| Method | `GET` (or `POST`) |
| URL | `https://api.rtosarthi.com/api/v1/chassis-info?chassis=MA1XXYZ1234567890&engine=ABC12345` |
| Header | `x-api-key: YOUR_API_KEY` |

| Parameter | Required | Description |
|---|---|---|
| `chassis` | Yes | Chassis number (VIN), e.g. `MA1XXYZ1234567890`. Spaces and dashes are fine. |
| `engine` | Yes | Engine number of the same vehicle. |
| `x-api-key` | Yes | Your API key (header). |

POST works too: same URL and header, JSON body:

```json
{ "chassis": "MA1XXYZ1234567890", "engine": "ABC12345" }
```

## 3. Success response (200)

```json
{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "chassisNumber": "MA1XXYZ1234567890",
  "vehicleNumber": "CG04AB1234",
  "data": {
    "REGN_NO": "CG04AB1234",
    "REGISTERED_AT": "RAIPUR RTO, CHHATTISGARH",
    "VEHICLE_CLASS": "GOODS CARRIER (LGV)",
    "MAKER_DESC": "TATA MOTORS LTD",
    "MAKER_MODEL": "ACE GOLD",
    "FUEL_DESC": "DIESEL",
    "CHASI_NO": "MA1XXYZ1234567890",
    "REGN_DT": "15-Jun-2019",
    "INSURANCE_UPTO": "12-Mar-2027",
    "FIT_UPTO": "14-Jun-2027",
    "TAX_UPTO": "31-Mar-2027"
  },
  "matches": [{ "...": "the same as data" }],
  "source": "rtosarthi_api4",
  "usage": { "limit": 500, "used": 21, "remaining": 479 }
}
```

Sample data. Fields come wherever they are available on the vehicle record; a field with no value is `"NA"`.

- `vehicleNumber`: the vehicle number found for this chassis
- `data`: the vehicle, in the same fields as the RTO Sarthi Vehicle Info API
- `matches`: every vehicle found (almost always one; `data` is the first)
- `usage.remaining`: calls you have left. Only successful calls use your limit.

## 4. Main fields in `data`

| Field | Meaning |
|---|---|
| `REGN_NO` | Vehicle number |
| `REGISTERED_AT` | RTO and state |
| `OWNER_NAME` | Registered owner |
| `VEHICLE_CLASS` | LMV, 2WN, LGV… |
| `MAKER_DESC` / `MAKER_MODEL` | Manufacturer / model |
| `FUEL_DESC` | Fuel type |
| `CHASI_NO` / `ENG_NO` | Chassis / engine number |
| `REGN_DT` / `REGN_UPTO` | Registration date / valid up to |
| `INSURANCE_COMP` / `INSURANCE_UPTO` | Insurance company / valid up to |
| `PUCC_UPTO` | PUC valid up to |
| `FIT_UPTO` | Fitness valid up to |
| `TAX_UPTO` | Tax valid up to |
| `PERMIT_NO` / `PERMIT_VALID_UPTO` | Permit number / valid up to |
| `UNLADEN_WEIGHT` / `LADEN_WEIGHT` | Weights (kg) |

## 5. Errors

On an error `success` is `false` and `message` says what went wrong. Errors never use up a call.

| Status | Meaning |
|---|---|
| 400 | Chassis / engine number missing or invalid |
| 401 | API key missing or wrong |
| 403 | Limit used up, key switched off, or the key is not a Chassis to RC key |
| 404 | No vehicle found for this chassis and engine number |
| 502 | Service busy, try again |

## 6. Examples

**cURL**

```bash
curl -H "x-api-key: YOUR_API_KEY" "https://api.rtosarthi.com/api/v1/chassis-info?chassis=MA1XXYZ1234567890&engine=ABC12345"
```

**Node.js**

```js
const res = await fetch('https://api.rtosarthi.com/api/v1/chassis-info?chassis=MA1XXYZ1234567890&engine=ABC12345', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
})
const body = await res.json()

if (body.success) console.log(body.vehicleNumber, body.data, body.usage.remaining)
else console.log(body.message)
```

**PHP**

```php
$ch = curl_init('https://api.rtosarthi.com/api/v1/chassis-info?chassis=MA1XXYZ1234567890&engine=ABC12345');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ['x-api-key: YOUR_API_KEY'],
  CURLOPT_TIMEOUT => 30,
]);
$body = json_decode(curl_exec($ch), true);
curl_close($ch);

echo $body['success'] ? $body['vehicleNumber'] : $body['message'];
```

**Python**

```python
import requests

res = requests.get(
    "https://api.rtosarthi.com/api/v1/chassis-info",
    params={"chassis": "MA1XXYZ1234567890", "engine": "ABC12345"},
    headers={"x-api-key": "YOUR_API_KEY"},
    timeout=30,
)
body = res.json()
print(body["data"] if body["success"] else body["message"])
```

## 7. Tips

- Set a timeout of about 30 seconds. On a 502, wait a little and retry once.
- Save the response if you need the same vehicle again, instead of calling twice.
- Recharge before `usage.remaining` reaches 0.

To recharge or get a new key, contact RTO Sarthi on call or WhatsApp.
