# Deployment Guide

## Deploying to Production

### Prerequisites

- Node.js hosting service (Heroku, DigitalOcean, AWS, etc.)
- MongoDB Atlas account (or self-hosted MongoDB)
- Domain name (optional)

---

## Option 1: Deploy to Heroku

### Step 1: Create Heroku App

```bash
heroku login
heroku create shopease-ecommerce
```

### Step 2: Set Environment Variables

```bash
heroku config:set MONGODB_URI="your_mongodb_atlas_connection_string"
heroku config:set JWT_SECRET="your_super_secret_jwt_key"
heroku config:set NODE_ENV="production"
```

### Step 3: Deploy

```bash
git push heroku master
```

### Step 4: Seed Database (One-time)

```bash
heroku run npm run seed
```

---

## Option 2: Deploy to DigitalOcean

### Step 1: Create Droplet

1. Create Ubuntu 20.04 droplet
2. SSH into your server

### Step 2: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
sudo npm install -g pm2
```

### Step 3: Clone and Setup

```bash
cd /var/www
git clone https://github.com/yourusername/shopease-ecommerce.git
cd shopease-ecommerce
npm install
```

### Step 4: Configure Environment

```bash
nano .env
```

Add:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shopease
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=production
```

### Step 5: Seed Database

```bash
npm run seed
```

### Step 6: Start with PM2

```bash
pm2 start server.js --name shopease
pm2 save
pm2 startup
```

### Step 7: Setup Nginx Reverse Proxy

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/shopease
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/shopease /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Option 3: Deploy to Vercel/Netlify (Frontend Only)

If you want to deploy frontend separately:

### Backend on Heroku/DigitalOcean

Follow Option 1 or 2 for backend

### Frontend on Vercel

1. Update API URLs in frontend JavaScript files
2. Deploy frontend files to Vercel
3. Set environment variables in Vercel dashboard

---

## MongoDB Atlas Setup

### Step 1: Create Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster

### Step 2: Configure Database

1. Create database user
2. Whitelist IP addresses (0.0.0.0/0 for development)
3. Get connection string

### Step 3: Update Connection String

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopease?retryWrites=true&w=majority
```

---

## SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

---

## Environment Variables Checklist

✅ `PORT` - Server port (default: 5000)  
✅ `MONGODB_URI` - MongoDB connection string  
✅ `JWT_SECRET` - Secret key for JWT tokens (use strong random string)  
✅ `NODE_ENV` - Set to "production"

---

## Security Checklist

✅ Change JWT_SECRET from default  
✅ Use HTTPS in production  
✅ Set secure cookie flags  
✅ Enable CORS only for specific domains  
✅ Use environment variables for sensitive data  
✅ Keep dependencies updated  
✅ Set up firewall rules  
✅ Regular security audits with `npm audit`

---

## Monitoring

### PM2 Monitoring

```bash
pm2 monit
pm2 logs shopease
pm2 restart shopease
```

### Check Server Status

```bash
sudo systemctl status mongod
sudo systemctl status nginx
```

---

## Backup Strategy

### Database Backup

```bash
mongodump --uri="mongodb://localhost:27017/shopease" --out=/backups/$(date +%Y%m%d)
```

### Automated Backups (Cron)

```bash
crontab -e
```

Add:

```
0 2 * * * mongodump --uri="mongodb://localhost:27017/shopease" --out=/backups/$(date +\%Y\%m\%d)
```

---

## Troubleshooting

### Server Not Starting

```bash
pm2 logs shopease
# Check for port conflicts
sudo lsof -i :5000
```

### Database Connection Issues

```bash
sudo systemctl status mongod
# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Nginx Issues

```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

---

## Performance Optimization

1. **Enable Gzip Compression** in Nginx
2. **Use CDN** for static assets
3. **Implement Caching** with Redis
4. **Optimize Images** before upload
5. **Minify CSS/JS** for production
6. **Enable HTTP/2** in Nginx

---

## Post-Deployment

1. ✅ Test all functionalities
2. ✅ Verify database connections
3. ✅ Test user registration/login
4. ✅ Test product browsing
5. ✅ Test shopping cart
6. ✅ Test order placement
7. ✅ Check responsive design
8. ✅ Monitor server logs
9. ✅ Set up SSL certificate
10. ✅ Configure domain name

---

## Support

For deployment issues:

- Check server logs: `pm2 logs`
- MongoDB logs: `/var/log/mongodb/mongod.log`
- Nginx logs: `/var/log/nginx/error.log`

Need help? Open an issue on GitHub!
