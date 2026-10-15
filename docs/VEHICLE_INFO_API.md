# RTO Sarthi Vehicle Info API

Fetch vehicle registration (RC) details by vehicle number from your own software.

- **Base URL:** `https://api.rtosarthi.com`
- **Endpoint:** `/api/v1/vehicle-info`
- **Methods:** `GET` or `POST`
- **Format:** JSON

---

## 1. Get your API key

RTO Sarthi creates an API key for you and sells you a number of API calls. The key looks like this:

```
rts_3f9a1c...e07b
```

**Keep the key secret.** Anyone who has it can use up your calls.

- Store it on your **server** (an environment variable or a config file), never in website JavaScript, a mobile app bundle or a public Git repo.
- If the key leaks, ask RTO Sarthi to generate a new one. The old key stops working at once.

> Call the API from your **server only**. Requests made from a web browser on another website are blocked.

---

## 2. Make a request

### Parameters

| Name  | Where | Required | Description |
|-------|-------|----------|-------------|
| `x-api-key` | Header | Yes* | Your API key |
| `vno` | Query string (GET) or JSON body (POST) | Yes | Vehicle registration number, e.g. `CG12BU5574` |
| `key` | Query string or JSON body | Yes* | Your API key, if you can't send headers |

\* Send the key **either** in the `x-api-key` header (recommended) **or** as `key`. The header is safer because URLs are often saved in server logs.

The vehicle number can contain spaces, dashes or lowercase letters. `cg 12-bu 5574` is read as `CG12BU5574`.

### GET

```
GET https://api.rtosarthi.com/api/v1/vehicle-info?vno=CG12BU5574
x-api-key: YOUR_API_KEY
```

### POST

```
POST https://api.rtosarthi.com/api/v1/vehicle-info
x-api-key: YOUR_API_KEY
Content-Type: application/json

{ "vno": "CG12BU5574" }
```

---

## 3. Response

### Success: `200 OK`

```json
{
  "success": true,
  "message": "Vehicle details fetched successfully",
  "vehicleNumber": "CG12BU5574",
  "data": {
    "REGN_NO": "CG12BU5574",
    "OWNER_NAME": "RAM KUMAR",
    "MOBILE_NO": "98XXXXXX10",
    "MAKER_DESC": "TATA MOTORS LTD",
    "MAKER_MODEL": "ACE GOLD",
    "REGISTERED_AT": "KORBA, Chhattisgarh",
    "STATUS": "ACTIVE",
    "INSURANCE_UPTO": "12-Mar-2027",
    "FIT_UPTO": "05-Jan-2027",
    "TAX_UPTO": "31-Mar-2027",
    "PUCC_UPTO": "20-Nov-2026"
  },
  "usage": {
    "limit": 1000,
    "used": 101,
    "remaining": 899
  }
}
```

- `data` holds the vehicle details as received from the RTO records. Fields can vary from vehicle to vehicle and some may be empty, so check that a field exists before using it.
- The mobile number may be partly hidden.
- The values shown above are an example only.

### The `usage` object

Almost every response has a `usage` object. Use it to show your balance or to warn before it runs out.

| Field | Meaning |
|-------|---------|
| `limit` | Total API calls you have bought |
| `used` | Calls used so far |
| `remaining` | Calls left (`limit - used`) |

The `401` responses (missing or wrong key) do **not** have `usage`, because the key is not known.

### Which calls use your limit?

| Result | Uses 1 call? |
|--------|--------------|
| `200` Vehicle details returned | **Yes** |
| `404` Vehicle not found | No |
| `400` Invalid vehicle number | No |
| `403` Key switched off / limit exhausted | No |
| `502` Vehicle service not responding | No |

Every call, successful or not, is recorded by RTO Sarthi with its date, time and vehicle number.

---

## 4. Errors

Every error has `"success": false` and a readable `message`.

| HTTP | When | Example `message` | What to do |
|------|------|-------------------|------------|
| `400` | `vno` missing or shorter than 4 characters | `A valid vehicle registration number is required (vno=CG12BU5574).` | Fix the input. |
| `401` | No key sent | `API key is required. Send it in the x-api-key header.` | Send the key. |
| `401` | Wrong key, or a key that was replaced | `Invalid API key` | Check the key, or get the new one from RTO Sarthi. |
| `403` | Calls used up. The response also has `"limitExhausted": true` | `API call limit exhausted. Please recharge to continue.` | Buy more calls from RTO Sarthi. Don't retry. |
| `403` | Key switched off by RTO Sarthi | `This API key is disabled. Please contact RTO Sarthi.` | Contact RTO Sarthi. |
| `404` | No record for this vehicle number | `Vehicle details not found. Please check registration number.` | Check the number. Not charged. |
| `502` | The vehicle information service did not respond | `Vehicle information service is not responding. Please try again.` | Retry after a few seconds. Not charged. |
| `500` | Unexpected server error | `Something went wrong!` | Retry later. Contact RTO Sarthi if it continues. |

Example of a "limit exhausted" response:

```json
{
  "success": false,
  "limitExhausted": true,
  "message": "API call limit exhausted. Please recharge to continue.",
  "usage": { "limit": 1000, "used": 1000, "remaining": 0 }
}
```

---

## 5. Code examples

Replace `YOUR_API_KEY` with your key, ideally read from an environment variable.

### cURL

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  "https://api.rtosarthi.com/api/v1/vehicle-info?vno=CG12BU5574"
```

### Node.js (18+, built-in fetch)

```js
const API_URL = 'https://api.rtosarthi.com/api/v1/vehicle-info'
const API_KEY = process.env.RTOSARTHI_API_KEY

async function getVehicle(vno) {
  const res = await fetch(`${API_URL}?vno=${encodeURIComponent(vno)}`, {
    headers: { 'x-api-key': API_KEY },
    signal: AbortSignal.timeout(30000)
  })
  const body = await res.json()

  if (body.usage) console.log(`Calls left: ${body.usage.remaining}`)

  if (!body.success) {
    const err = new Error(body.message)
    err.status = res.status
    err.limitExhausted = !!body.limitExhausted
    throw err
  }
  return body.data
}

getVehicle('CG12BU5574')
  .then((v) => console.log(v.OWNER_NAME, v.MAKER_MODEL))
  .catch((e) => console.error(e.status, e.message))
```

### PHP

```php
<?php
$apiKey = getenv('RTOSARTHI_API_KEY');
$vno = 'CG12BU5574';

$ch = curl_init('https://api.rtosarthi.com/api/v1/vehicle-info?vno=' . urlencode($vno));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['x-api-key: ' . $apiKey],
    CURLOPT_TIMEOUT => 30,
]);
$raw = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$body = json_decode($raw, true);

if (!empty($body['success'])) {
    echo $body['data']['OWNER_NAME'] . "\n";
    echo 'Calls left: ' . $body['usage']['remaining'] . "\n";
} else {
    echo "Error $status: " . ($body['message'] ?? 'Unknown error') . "\n";
}
```

### Python (requests)

```python
import os
import requests

API_URL = "https://api.rtosarthi.com/api/v1/vehicle-info"
API_KEY = os.environ["RTOSARTHI_API_KEY"]

res = requests.get(API_URL, params={"vno": "CG12BU5574"},
                   headers={"x-api-key": API_KEY}, timeout=30)
body = res.json()

if body.get("success"):
    print(body["data"].get("OWNER_NAME"))
    print("Calls left:", body["usage"]["remaining"])
else:
    print(res.status_code, body.get("message"))
```

### C# (.NET)

```csharp
using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
http.DefaultRequestHeaders.Add("x-api-key", Environment.GetEnvironmentVariable("RTOSARTHI_API_KEY"));

var res = await http.GetAsync("https://api.rtosarthi.com/api/v1/vehicle-info?vno=CG12BU5574");
var json = await res.Content.ReadAsStringAsync();
Console.WriteLine($"{(int)res.StatusCode}: {json}");
```

---

## 6. Best practices

1. **Set a timeout of about 30 seconds.** A lookup normally takes a few seconds, but the RTO source can be slow.
2. **Retry only on `502` or `500`,** and at most 2–3 times with a few seconds' gap. Never retry `400`, `401`, `403` or `404`, because the result won't change.
3. **Save the results on your side.** Every successful call uses one call from your limit, even for a vehicle you looked up before. If you need the same vehicle again soon, read it from your own database.
4. **Watch `usage.remaining`.** Alert your team when it gets low, for example under 50, so you can recharge before calls start failing.
5. **Validate input first.** Remove empty or obviously wrong numbers before calling the API.
6. **Send one request per vehicle.** For many vehicles, call them one after another or a few at a time, not hundreds at once.
7. **Keep the key server-side,** and send it in the header, not the URL.

---

## 7. Support and recharge

To buy more calls, replace a leaked key or report a problem, contact RTO Sarthi with:

- the name your API key is registered under,
- the vehicle number, and the date and time of the call (for problems with one call).

RTO Sarthi keeps a record of every call made with your key, including the data returned, so any call can be checked.
