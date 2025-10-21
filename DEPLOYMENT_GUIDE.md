# 4Travels B2B Portal - VPS Deployment Guide
## Ubuntu 22.04 | Domain: rs.4travels.net

---

## 📋 Prerequisites

- Ubuntu 22.04 VPS with root access
- Domain: rs.4travels.net pointed to your VPS IP
- Minimum 2GB RAM, 20GB storage
- SSH access to your server

---

## 🚀 Deployment Steps

### Step 1: Prepare Your VPS

SSH into your server:
```bash
ssh root@your-vps-ip
```

### Step 2: Install Required Software

Run the automated deployment script:
```bash
# Download and run the deployment script
curl -o deploy-vps.sh https://your-repo/deploy-vps.sh
chmod +x deploy-vps.sh
sudo ./deploy-vps.sh
```

Or manually install:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### Step 3: Upload Application Files

**Option A: Using Git (Recommended)**
```bash
cd /opt
git clone https://github.com/yourusername/4travels-portal.git
cd 4travels-portal
```

**Option B: Using SCP from your local machine**
```bash
# From your local machine
scp -r /path/to/your/app root@your-vps-ip:/opt/4travels-portal
```

**Option C: Using rsync**
```bash
# From your local machine
rsync -avz --exclude 'node_modules' --exclude '__pycache__' \
  /path/to/your/app/ root@your-vps-ip:/opt/4travels-portal/
```

### Step 4: Configure Environment Variables

```bash
cd /opt/4travels-portal

# Copy production environment files
cp frontend/.env.production frontend/.env
cp backend/.env.production backend/.env

# Update JWT secret (IMPORTANT!)
nano backend/.env
# Change JWT_SECRET_KEY to a random secure string
```

### Step 5: Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx-vps.conf /etc/nginx/sites-available/4travels
sudo ln -s /etc/nginx/sites-available/4travels /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 6: Build and Start Application

```bash
cd /opt/4travels-portal

# Build and start with Docker Compose
sudo docker compose up -d --build

# Check if containers are running
sudo docker compose ps

# View logs
sudo docker compose logs -f
```

### Step 7: Create Admin User

```bash
# Access MongoDB container
sudo docker exec -it travel_mongodb mongosh

# In MongoDB shell:
use 4travels_db

# Create admin user
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

# Password is: admin123
# Exit MongoDB
exit
```

### Step 8: Setup SSL Certificate (HTTPS)

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d rs.4travels.net

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Certificate will auto-renew
# Test auto-renewal:
sudo certbot renew --dry-run
```

### Step 9: Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

### Step 10: Verify Deployment

Open your browser and visit:
- **https://rs.4travels.net**

Login with:
- Email: `admin@4travels.net`
- Password: `admin123`

---

## 🔧 Useful Commands

### Docker Management
```bash
# View running containers
sudo docker compose ps

# View logs
sudo docker compose logs -f [service_name]
sudo docker compose logs -f backend
sudo docker compose logs -f frontend

# Restart services
sudo docker compose restart

# Stop services
sudo docker compose down

# Rebuild and restart
sudo docker compose up -d --build

# Remove everything and start fresh
sudo docker compose down -v
sudo docker compose up -d --build
```

### Nginx Management
```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### MongoDB Management
```bash
# Access MongoDB shell
sudo docker exec -it travel_mongodb mongosh

# Backup database
sudo docker exec travel_mongodb mongodump --out /backup
sudo docker cp travel_mongodb:/backup ./mongodb-backup

# Restore database
sudo docker cp ./mongodb-backup travel_mongodb:/backup
sudo docker exec travel_mongodb mongorestore /backup
```

### System Monitoring
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check Docker resource usage
sudo docker stats

# View system logs
sudo journalctl -u docker -f
```

---

## 🔄 Updating Your Application

When you make changes to your code:

```bash
cd /opt/4travels-portal

# Pull latest changes (if using Git)
git pull

# Rebuild and restart
sudo docker compose down
sudo docker compose up -d --build

# Or update specific service
sudo docker compose up -d --build backend
sudo docker compose up -d --build frontend
```

---

## 🛡️ Security Best Practices

1. **Change Default Passwords**
   ```bash
   # Change admin password in the application
   # Change JWT_SECRET_KEY in backend/.env
   ```

2. **Regular Updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo docker compose pull
   sudo docker compose up -d
   ```

3. **Enable Automatic Security Updates**
   ```bash
   sudo apt install unattended-upgrades -y
   sudo dpkg-reconfigure --priority=low unattended-upgrades
   ```

4. **Setup Backup Cron Job**
   ```bash
   # Edit crontab
   sudo crontab -e
   
   # Add daily backup at 2 AM
   0 2 * * * cd /opt/4travels-portal && docker exec travel_mongodb mongodump --out /backup && docker cp travel_mongodb:/backup /opt/backups/$(date +\%Y\%m\%d)
   ```

5. **Fail2Ban for SSH Protection**
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

---

## 🐛 Troubleshooting

### Issue: Containers won't start
```bash
# Check logs
sudo docker compose logs

# Check if ports are in use
sudo netstat -tulpn | grep -E '(3000|8001|27017)'

# Restart Docker
sudo systemctl restart docker
sudo docker compose up -d
```

### Issue: Can't access website
```bash
# Check if nginx is running
sudo systemctl status nginx

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check if containers are running
sudo docker compose ps

# Check firewall
sudo ufw status
```

### Issue: Database connection errors
```bash
# Check MongoDB container
sudo docker logs travel_mongodb

# Restart MongoDB
sudo docker compose restart mongodb

# Check if MongoDB is accessible
sudo docker exec -it travel_mongodb mongosh --eval "db.runCommand({ ping: 1 })"
```

### Issue: Frontend can't connect to backend
```bash
# Check backend logs
sudo docker compose logs backend

# Verify CORS settings in backend/.env
# Verify REACT_APP_BACKEND_URL in frontend/.env

# Rebuild frontend
sudo docker compose up -d --build frontend
```

---

## 📊 Performance Optimization

### Enable Gzip Compression in Nginx
```bash
sudo nano /etc/nginx/nginx.conf

# Add inside http block:
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### Setup Nginx Caching
```bash
sudo nano /etc/nginx/sites-available/4travels

# Add before server block:
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

# Add in location blocks:
proxy_cache my_cache;
proxy_cache_valid 200 60m;
```

---

## 📞 Support & Maintenance

### Health Check URLs
- Frontend: `https://rs.4travels.net`
- Backend API: `https://rs.4travels.net/api/docs`
- MongoDB: `localhost:27017` (internal only)

### Monitoring Setup (Optional)
```bash
# Install Netdata for real-time monitoring
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
# Access at: http://your-vps-ip:19999
```

---

## ✅ Deployment Checklist

- [ ] VPS with Ubuntu 22.04 setup
- [ ] Domain rs.4travels.net pointing to VPS IP
- [ ] Docker and Docker Compose installed
- [ ] Nginx installed and configured
- [ ] Application files uploaded
- [ ] Environment variables configured
- [ ] Containers built and running
- [ ] Admin user created in database
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Application accessible via https://rs.4travels.net
- [ ] Admin login successful
- [ ] All features tested

---

## 📝 Notes

- MongoDB data is persisted in Docker volume `mongodb_data`
- Logs are available via `docker compose logs`
- SSL certificate auto-renews every 90 days
- Backend runs on port 8001, Frontend on port 3000
- Nginx proxies both on ports 80/443

---

**Congratulations! Your 4Travels B2B Portal is now live at https://rs.4travels.net** 🎉
