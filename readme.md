# Trajectory Labeling Web Interface

This project provides a fast and intuitive web-based tool for labeling robotic demonstration trajectories.  
It supports **multiple synchronized camera views**, **automatic labeling during playback**, and an **interactive color timeline** for marking GOOD/BAD frames.

---

## 🚀 Features

- 📂 Load demonstrations (auto‑sorted: demo_1, demo_2, …)
- 🎥 Display **all camera views simultaneously**
- ▶️ Smooth Play/Pause with FPS control
- 🟩 Mark frames as **GOOD (1)** or **BAD (-1)**
- 🔁 Auto‑labeling during playback  
  (correct behavior: labels apply to the **previous** frame)
- 🧼 Clear all labels in one click
- 🕒 Interactive timeline  
  - Green = GOOD  
  - Red = BAD  
  - White = Unlabeled  
- 🖱 Click any timeline cell to jump to that frame
- ⚡ Fast and simple UI for large datasets

---

## 🖼 UI Preview

Screenshot of the interface during use:

![UI Screenshot](screenshot.png)

*(Place the screenshot in this folder with the same filename for GitHub rendering.)*

---

## 📦 Installation & Running

### 1️⃣ Backend (FastAPI)

Inside the **backend/** folder:

Install dependencies:
```
pip install -r requirements.txt
```

Run the backend server:
```
uvicorn app:app --reload --port 8000
```

Backend will run at:
```
http://localhost:8000
```

---

### 2️⃣ Frontend (React + Vite)

Inside the **frontend/** folder:

Install dependencies:
```
npm install
```

Start development UI:
```
npm run dev
```

Frontend will start at:
```
http://localhost:5173
```

---

## 📁 Folder Structure

```
project/
│
├── backend/
│   ├── app.py
│   ├── data/
│   ├── labels/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md
```

---

## 📝 Usage Workflow

1. Start backend  
2. Start frontend  
3. Open browser at: **http://localhost:5173**  
4. Select a demo  
5. Preview all camera feeds in sync  
6. Choose a labeling mode:
   - GOOD (1)
   - BAD (-1)
7. Press **Play** to auto‑label frames  
   - playback labels frame *t* right when switching to *t+1*
8. Navigate with the timeline  
9. Press “Clear All Labels” to reset to zero

---

## 🟢 Label Encoding

| Value | Meaning | Color |
|-------|---------|--------|
| 1 | GOOD | Green |
| -1 | BAD | Red |
| 0 | Unlabeled | White |

Labels are saved automatically via FastAPI routes.

---

## 🤝 Contributing

Pull requests and suggestions are welcome!  
This tool is designed to be simple, modular, and easy to extend.

---

## 📄 License

MIT License
