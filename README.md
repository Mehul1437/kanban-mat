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
kanban-mat/
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

## Live Application

- Frontend: [https://kanban-mat.vercel.app](https://kanban-mat.vercel.app)
- Backend API: [https://kanban-mat.onrender.com](https://kanban-mat.onrender.com)

---

## 🤝 Contributing

Pull requests welcome! For major changes, open an issue first to discuss what you'd like to change.

---

## 📄 License

[MIT](LICENSE) 