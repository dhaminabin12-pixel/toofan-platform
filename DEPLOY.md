# TooFan — Deployment Guide

> Real values (AWS account ID, instance ID, IP addresses, key-pair file, CLI profile)
> are deliberately **not** in this repo. Keep them in your password manager or in
> GitHub → Settings → Secrets. Placeholders below are written as `<LIKE_THIS>`.

## How it's deployed

```
                ┌──────────────────────────┐
Browser ──────▶ │ Vercel (toofan-frontend) │  React SPA
                └────────────┬─────────────┘
                             │ rewrites /api, /socket.io, /uploads
                             ▼
                ┌──────────────────────────┐
                │ AWS EC2 (us-east-1)      │
                │  ├─ toofan-backend (PM2) │  Express + Socket.IO, port 5000
                │  └─ PostgreSQL           │  via Prisma
                └────────────┬─────────────┘
                             ▼
                      S3: uploads bucket      driver / restaurant images
```

- **Frontend** — Vercel builds `toofan-frontend/` on every push to `main`.
  API, socket and upload traffic is proxied to the backend by `toofan-frontend/vercel.json`.
- **Backend** — `.github/workflows/deploy.yml` SSHes into EC2 on every push to `main`,
  pulls, runs `npm install`, `prisma db push`, and restarts the `toofan-backend` PM2 process.

## Resources

| Resource | Where to find the value |
|----------|-------------------------|
| AWS account ID | `aws sts get-caller-identity` |
| Region | `us-east-1` |
| EC2 instance / public IP | AWS console → EC2, or the `EC2_HOST` GitHub secret |
| SSH key pair | `<KEY_PAIR>.pem` — stored outside the repo (`*.pem` is git-ignored) |
| S3 uploads bucket | `toofan-uploads-<ACCOUNT_ID>` (created by `scripts/aws-setup.sh`) |

## 1. Provision AWS (once)

```bash
AWS_PROFILE=<your-profile> ./scripts/aws-setup.sh
```

This creates the S3 bucket, security group, key pair and EC2 instance, and prints the public IP.

## 2. Configure environment variables

```bash
cp .env.production.example .env   # fill in every value; .env is git-ignored
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # run twice: JWT_SECRET, JWT_REFRESH_SECRET
```

Copy it to the server:

```bash
scp -i <KEY_PAIR>.pem .env ec2-user@<EC2_HOST>:~/toofan-platform/toofan-backend/.env
```

## 3. GitHub secrets

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `EC2_HOST` | EC2 public IP or hostname |
| `EC2_SSH_KEY` | Full contents of `<KEY_PAIR>.pem` |

## 4. Deploy

Push to `main`. GitHub Actions deploys the backend; Vercel deploys the frontend.

## 5. Seed the database (first time only)

```bash
ssh -i <KEY_PAIR>.pem ec2-user@<EC2_HOST>
cd ~/toofan-platform/toofan-backend
node prisma/seed.js
```

## Useful commands on the server

```bash
pm2 status
pm2 logs toofan-backend
pm2 restart toofan-backend
npx prisma studio            # then tunnel: ssh -L 5555:localhost:5555 ...
```

## HTTPS / custom domain

1. Point the domain's A record at the EC2 public IP.
2. `sudo yum install -y certbot && sudo certbot certonly --standalone -d <your-domain>`
3. Put nginx (or a load balancer) in front of port 5000 and update `vercel.json` to use `https://<your-domain>`.

> `docker-compose.yml` and the Dockerfiles are kept for running the whole stack locally
> or for a future container-based deploy; production currently uses PM2.
