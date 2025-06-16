# 🚀 Kanban Mate

A Trello-like productivity app for teams, featuring real-time collaboration, role-based access, Kanban board, comments, file uploads, notifications, and more.

---

## ✨ Features

### Core
- **User Authentication** (JWT, bcrypt)
- **Project & Task CRUD**
- **Drag-and-Drop Kanban Board** (react-beautiful-dnd)
- **Role-Based Access Control** (Owner, Editor, Viewer)
- **Comments & File Uploads** on tasks
- **Real-Time Collaboration** (Socket.IO)
- **Activity Log** per project

### Bonus
- **Notifications System** (toasts + backend events)
- **Audit Trail** (who did what & when)
- **Kanban & Calendar View Toggle** (Kanban ready)
- **Dark/Light Mode Toggle**
- **Project Member Management** (invite, change roles)
- **Responsive & Accessible UI**

---

## 🛠️ Tech Stack

**Backend:**
- Node.js, Express
- MongoDB (Atlas)
- JWT, bcryptjs
- Socket.IO
- Multer (file uploads)

**Frontend:**
- React + Hooks
- Zustand (state management)
- React Router
- TailwindCSS (with dark mode)
- react-beautiful-dnd
- Axios
- Socket.IO client
- @headlessui/react (modals)
- react-hot-toast (toasts)

---

## 🗂️ Project Structure

```
smart-taskmate/
  backend/
    models/
    routes/
    middleware/
    uploads/
    server.js
    .env
  frontend/
    src/
      components/
      pages/
      store/
      utils/
      App.js
      index.js
    tailwind.config.js
    package.json
```

---

## 🚦 Getting Started

### 1. **Clone the repo**
```bash
git clone https://github.com/Mehul1437/kanban-mate.git
cd kanban-mate
```

### 2. **Backend Setup**
```bash
cd backend
npm install
# Add your MongoDB Atlas URI and JWT secret to .env
npm start
```

### 3. **Frontend Setup**
```bash
cd ../frontend
npm install
npm start
```

- The frontend runs on [http://localhost:3000](http://localhost:3000)
- The backend runs on [http://localhost:5000](http://localhost:5000)

---

## 🌐 Deployment Guide

### 1. MongoDB Atlas Setup
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier is sufficient)
3. Set up database access:
   - Create a database user with read/write permissions
   - Add your IP address to the IP whitelist (or use 0.0.0.0/0 for all IPs)
4. Get your connection string from "Connect" > "Connect your application"
   - Replace `<password>` with your database user's password
   - Replace `<dbname>` with your database name (e.g., `smart-taskmate`)

### 2. Backend Deployment (Render)
1. Create a free account at [Render](https://render.com)
2. Create a new Web Service:
   - Connect your GitHub repository
   - Select the `backend` directory
   - Set the following:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Environment Variables:**
       ```
       MONGO_URI=your_mongodb_atlas_connection_string
       JWT_SECRET=your_jwt_secret_key
       PORT=5000
       ```
3. Deploy the service
4. Note the deployed URL (e.g., `https://your-app.onrender.com`)

### 3. Frontend Deployment (Netlify/Vercel)

#### Option A: Netlify
1. Create a free account at [Netlify](https://netlify.com)
2. Create a new site from Git:
   - Connect your GitHub repository
   - Select the `frontend` directory
   - Set the following:
     - **Build Command:** `npm install && npm run build`
     - **Publish Directory:** `build`
3. Add environment variables:
   ```
   REACT_APP_API_URL=your_backend_url
   ```
4. Deploy the site

#### Option B: Vercel
1. Create a free account at [Vercel](https://vercel.com)
2. Import your GitHub repository:
   - Select the `frontend` directory
   - Set the following:
     - **Framework Preset:** Create React App
     - **Build Command:** `npm run build`
3. Add environment variables:
   ```
   REACT_APP_API_URL=your_backend_url
   ```
4. Deploy the site

### 4. Post-Deployment
1. Update CORS settings in your backend:
   - Add your frontend domain to the allowed origins
2. Test the following functionality:
   - User registration/login
   - Project creation
   - Real-time updates
   - File uploads
   - Notifications

### 5. Monitoring & Maintenance
- Monitor your MongoDB Atlas cluster usage
- Set up alerts for Render/Netlify/Vercel
- Regularly backup your database
- Keep dependencies updated

---

## 📸 Screenshots

> Add screenshots/gifs of the Kanban board, dark mode, real-time updates, etc.

---

## 🤝 Contributing

Pull requests welcome! For major changes, open an issue first to discuss what you'd like to change.

---

## 📄 License

[MIT](LICENSE) 