# 🚀 Quick Start - VPS Deployment

## For Ubuntu 22.04 VPS | Domain: rs.4travels.net

---

## ⚡ Super Quick Deploy (3 Commands)

```bash
# 1. Upload all files to your VPS at /opt/4travels-portal

# 2. Run initial setup (installs Docker, Nginx, etc.)
sudo bash deploy-vps.sh

# 3. Deploy the application
sudo bash quick-deploy.sh

# 4. Setup SSL
sudo certbot --nginx -d rs.4travels.net
```

**That's it!** Visit https://rs.4travels.net

---

## 📦 What's Included

- `Dockerfile.backend` - Backend container configuration
- `Dockerfile.frontend` - Frontend container configuration  
- `docker-compose.yml` - Full stack orchestration
- `nginx-vps.conf` - Nginx reverse proxy config
- `nginx.conf` - Frontend nginx config (in container)
- `deploy-vps.sh` - Initial VPS setup script
- `quick-deploy.sh` - Quick deployment script
- `backup.sh` - Database backup script
- `DEPLOYMENT_GUIDE.md` - Complete deployment documentation

---

## 📋 Before You Start

1. **VPS Requirements:**
   - Ubuntu 22.04
   - 2GB RAM minimum
   - 20GB disk space
   - Root or sudo access

2. **Domain Setup:**
   - Point rs.4travels.net A record to your VPS IP
   - Wait for DNS propagation (5-30 minutes)

3. **Upload Files:**
   ```bash
   # From your local machine
   scp -r /path/to/app root@YOUR_VPS_IP:/opt/4travels-portal
   ```

---

## 🔐 Default Credentials

After deployment, create admin user:

```bash
sudo docker exec -it travel_mongodb mongosh

use 4travels_db

db.users.insertOne({
  "id": "admin-001",
  "email": "admin@4travels.net",
  "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5UpjpGXGUgO3G",
  "role": "admin",
  "agency_name": "4Travels Admin",
  "phone": "+7 999 000 00 00",
  "locale": "ru",
  "is_active": true,
  "balance": 0.0,
  "last_balance_topup": 0.0,
  "created_at": new Date().toISOString()
})

exit
```

**Login:** admin@4travels.net  
**Password:** admin123

---

## 🛠️ Useful Commands

```bash
# View logs
sudo docker compose logs -f

# Restart application
sudo docker compose restart

# Stop application
sudo docker compose down

# Update application
cd /opt/4travels-portal
git pull  # if using git
sudo docker compose up -d --build

# Backup database
sudo bash backup.sh

# Check status
sudo docker compose ps
```

---

## 📚 Full Documentation

See `DEPLOYMENT_GUIDE.md` for:
- Detailed step-by-step instructions
- Troubleshooting guide
- Security best practices
- Performance optimization
- Monitoring setup

---

## 🆘 Quick Troubleshooting

**Can't access website?**
```bash
sudo docker compose ps
sudo systemctl status nginx
sudo ufw status
```

**Backend not working?**
```bash
sudo docker compose logs backend
```

**Database issues?**
```bash
sudo docker compose logs mongodb
```

---

## 📞 Support

For detailed help, see `DEPLOYMENT_GUIDE.md`

---

**Happy Deploying! 🎉**
