# Second Rise iOS and Android Apps

The phone apps use Capacitor so the existing React app can ship as native iOS and Android apps while continuing to talk to the Railway backend.

## One-time setup

From `frontend/`:

```sh
npm install
npm run build:mobile
npm run cap:add:ios
npm run cap:add:android
```

The mobile build uses:

```sh
VITE_API_BASE_URL=https://second-rise-production.up.railway.app/api
```

That keeps native app requests pointed at production instead of trying to call `/api` on the device.

## Daily Development

After frontend changes:

```sh
npm run build:mobile
npm run cap:sync
```

Open the native projects:

```sh
npm run cap:open:ios
npm run cap:open:android
```

## Wearable Follow-Up

The backend exposes the end-of-day review at:

- `GET /api/wearable-review/today`
- `GET /api/wearable-review?date=YYYY-MM-DD`
- `POST /api/wearable-review/evaluate`

The review compares the day recommendation with synced wearable load:

- WHOOP strain as the primary load signal
- Oura activity score and steps as fallback signals
- Apple Health steps and sleep as fallback signals
- Fitbit steps and sleep as fallback signals
- Google Fit steps and sleep as fallback signals
- user feedback, especially `too_much` and `didnt_finish`

The response includes `adherence_status`:

- `followed`
- `over`
- `under`
- `unknown`
