# Salon Flow

Full-stack app for salon and partner management: user auth (OTP), partner/owner flows, and store APIs. Backend: Django REST + PostgreSQL. Frontend: React (Vite + TypeScript).

---

## Versions (tested / recommended)

| Component | Version |
|-----------|---------|
| **Python** | 3.10+ (3.12 recommended) |
| **Node.js** | 18+ (20 LTS recommended) |
| **Yarn** | 1.22+ |
| **PostgreSQL** | 14+ (16 recommended) |
| **Django** | 5.0 |
| **React** | 19.x |
| **Vite** | 6.x |
| **TypeScript** | 5.8.x |

Backend pinning: see `backend/requirements.txt`.  
Frontend pinning: see `Fronted/salonflow-mobile-app/package.json`.

---

## Project structure

```
salon-flow/
├── backend/
│   ├── requirements.txt
│   └── salonflow/          # Django project (manage.py here)
│       ├── user/           # Auth, OTP, JWT
│       ├── partner/
│       └── store/
├── Fronted/
│   └── salonflow-mobile-app/   # React + Vite app
├── docker-compose.yml      # Optional: full stack with Docker
└── Readme.md
```

---

## External dependencies

- **PostgreSQL** – required. The backend uses it for all data. Install and run a server locally, or use Docker (e.g. `docker compose up db -d`).
- **Twilio** – optional. Used only when you enable real OTP over SMS. Without Twilio, the app can still run (OTP is bypassed for development; see [Twilio](#twilio-otp-sms) below).

---

## Environment variables

### Backend (`backend/salonflow/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SECRET_KEY` | Yes (production) | Django secret key | Long random string |
| `DEBUG` | No | Debug mode | `True` / `False` (use `False` in prod) |
| `ALLOWED_HOSTS` | Yes (production) | Comma-separated hosts | `localhost,127.0.0.1,yourdomain.com` |
| `DB_NAME` | Yes | PostgreSQL database name | `salondb` |
| `DB_USER` | Yes | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | Yes | PostgreSQL password | (your password) |
| `DB_HOST` | Yes | DB host | `localhost` or `db` (if using Docker) |
| `DB_PORT` | No | DB port | `5432` |
| `BLOCKED_SLOT_TIMEZONE` | No | Timezone for slots | `Asia/Kolkata` |
| `TWILIO_ACCOUNT_SID` | For Twilio | Twilio Account SID | From Twilio Console |
| `TWILIO_AUTH_TOKEN` | For Twilio | Twilio Auth Token | From Twilio Console |
| `TWILIO_PHONE_NUMBER` | For Twilio | Twilio sender number | E.g. `+1234567890` |

### Frontend

- **Local dev:** API base URL defaults to `http://localhost:8000` in code.
- **Build / Docker:** Set `VITE_API_BASE_URL` at build time (e.g. in `.env` or Docker build args) so the app calls the correct backend URL.

---

## Commands to start the project

### 1. Backend (Django)

From project root:

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cd salonflow
```

Create `backend/salonflow/.env` with the required variables (see table above). Then:

```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

API base: **http://localhost:8000**

### 2. Frontend (React + Vite)

From project root:

```bash
cd Fronted/salonflow-mobile-app
yarn install
yarn dev
```

App: **http://localhost:3000** (or the port Vite prints).  
Ensure PostgreSQL is running and the backend is up so the app can reach the API.

### 3. Using Docker (deployment / full stack)

From project root, with Docker and Docker Compose installed:

```bash
# Create .env at project root with DB_PASSWORD, SECRET_KEY, ALLOWED_HOSTS, DB_* and optionally VITE_API_BASE_URL
docker compose up --build -d
docker compose exec backend python manage.py migrate
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:8000  

*(If the backend Dockerfile is used, ensure `gunicorn` is in `backend/requirements.txt` for production.)*

---

## Twilio (OTP SMS)

Out of the box, **OTP is not sent via SMS**; `user/utils.py` has a stub so login still works (e.g. any OTP accepted in dev). To enable real SMS with Twilio:

### 1. Get Twilio credentials

1. Sign up at [twilio.com](https://www.twilio.com).
2. In the Twilio Console: **Account SID** and **Auth Token** (or create an API key).
3. Get a **Phone Number** (or use a trial number). For trial accounts, verify recipient numbers in the console.

### 2. Set environment variables

In `backend/salonflow/.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

Use your real SID, token, and number (E.164 format with `+`).

### 3. Implement `send_otp` in the backend

Replace the stub in `backend/salonflow/user/utils.py` with a real Twilio call. Example:

```python
import random
from django.conf import settings
from twilio.rest import Client

def generate_otp():
    return str(random.randint(1000, 9999))

def send_otp(phone: str, otp: str):
    sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', '')
    if not (sid and token and from_number):
        return  # Bypass if not configured
    client = Client(sid, token)
    client.messages.create(
        body=f"Your Salon Flow OTP is: {otp}",
        from_=from_number,
        to=phone,
    )
```

- Ensure `phone` is in E.164 format (e.g. `+919876543210`). If your app stores numbers without `+`, normalize before calling `send_otp`.
- For trial accounts, only verified numbers receive SMS unless you upgrade.
- Never commit `.env` or real Twilio credentials to Git.

After this, the existing **send-otp** and **verify-otp** flows will send real SMS and verify the same OTP.

---

## Pushing to GitHub

1. Create a new repository on GitHub (empty, no README).
2. In the project root:

```bash
git init
git add .
git commit -m "Initial commit: Salon Flow backend + frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/salon-flow.git
git push -u origin main
```

3. Do **not** commit `.env` or any file containing secrets. Use `.gitignore` (e.g. `.env`, `backend/salonflow/.env`) and share required variables with the deployment team via a secure channel or secret store.

---

## Summary for deployment team

- **Versions:** Python 3.10+, Node 18+, Yarn, PostgreSQL 14+; see `backend/requirements.txt` and `Fronted/salonflow-mobile-app/package.json`.
- **Start backend:** `cd backend` → venv → `pip install -r requirements.txt` → `cd salonflow` → `.env` → `python manage.py migrate` → `python manage.py runserver 0.0.0.0:8000`.
- **Start frontend:** `cd Fronted/salonflow-mobile-app` → `yarn install` → `yarn dev`.
- **Env:** Backend needs `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DB_*`; optional `TWILIO_*` for SMS OTP.
- **External deps:** PostgreSQL required; Twilio optional for real OTP.
- **Twilio:** Get SID, token, and number from Twilio Console → set `TWILIO_*` in `backend/salonflow/.env` → implement `send_otp` in `backend/salonflow/user/utils.py` as in the example above.
