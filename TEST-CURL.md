# Test GetResponse API direktno

## Test 1: Osnovni test sa verbose output

```bash
curl -v -X POST "https://api.getresponse.com/v3/contacts" \
  -H "X-Auth-Token: api-key zn0yitbcr5jsxt6xf349zq37epsysj2b" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test123@example.com",
    "campaign": {
      "campaignId": "C5wYq"
    }
  }'
```

Ako ovo radi (vraća 201 ili kontakt kreiran), onda je problem u serverless funkciji.

## Test 2: Proveri response status

```bash
curl -w "\nHTTP Status: %{http_code}\n" -X POST "https://api.getresponse.com/v3/contacts" \
  -H "X-Auth-Token: api-key zn0yitbcr5jsxt6xf349zq37epsysj2b" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test456@example.com",
    "campaign": {
      "campaignId": "C5wYq"
    }
  }'
```

Ovaj će prikazati HTTP status kod.
