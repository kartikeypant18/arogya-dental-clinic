# Arogya Dental Clinic

Clinic website for **Arogya Dental Clinic** (Dr. Yogesh Tewari, BDS, Haldwani): treatment list, appointment requests, patient journal, and a staff desk.

## Folders

- `client/` — public website and staff desk (React + Vite)
- `backend/` — Express API, MongoDB models, and email
- `backend/.env` — private settings. Never commit this file.

## Local setup

Requires Node.js 18 or newer.

```bash
npm install
copy backend\.env.example backend\.env
npm run dev
```

- Website: http://localhost:5000
- Staff desk: http://localhost:5000/admin

## Production deploy

- **Frontend:** Vercel (`vercel.json` builds `client/dist`)
- **Backend:** Render Singapore (`render.yaml`, `SERVE_FRONTEND=false`)
- Set `VITE_API_URL` on Vercel to the Render API URL (for example `https://arogya-dental-api.onrender.com`)
- Set `FRONTEND_URL` on Render to the Vercel site URL
- Prefer a MongoDB Atlas cluster in **Singapore (ap-southeast-1)** for lower latency from Render Singapore

## Environment

| Variable | Purpose |
| --- | --- |
| `PORT` | Server port, default 5000 |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string used to sign staff sessions |
| `ADMIN_EMAIL` | Staff login email |
| `ADMIN_PASSWORD` | Staff password. Use a bcrypt hash in production |
| `CLINIC_EMAIL` | Inbox that receives new appointment requests |
| `CLINIC_PHONE` | Clinic phone stored for reference |
| `BREVO_API_KEY` | Optional. Leave blank to skip email |
| `BREVO_SENDER_NAME` | Name on outgoing email |
| `BREVO_SENDER_EMAIL` | Verified Brevo sender address |
| `SERVE_FRONTEND` | `false` on Render API-only. Defaults to serving the built site when present |
| `FRONTEND_URL` | Allowed browser origin for CORS (Vercel URL) |
| `VITE_API_URL` | Frontend build-time API base URL |

Generate a bcrypt password hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('your-password', 12))"
```
