# Peer-to-Peer Chat Application

## Goal
This project aims to develop a peer-to-peer (P2P) chat application that enables users to send and receive messages simultaneously, supports multiple peers, and allows users to query and retrieve a list of peers they have communicated with.

## Team Members
- **Sameer Choudhary (230001070)**
- **Vansh Khandelwal(230041038)**
- **Jai Pannu(230004019)**

---

## Setup Guide

### 1. Backend Setup (Flask)

#### Step 1: Create a Virtual Environment
```sh
python -m venv venv
```

#### Step 2: Activate the Virtual Environment
**Windows:**
```sh
venv\Scripts\activate
```
**macOS/Linux:**
```sh
source venv/bin/activate
```

#### Step 3: Install Dependencies
Make sure you have `requirements.txt`, then run:
```sh
pip install -r requirements.txt
```

#### Step 4: Run the Flask Application
Run the backend server by executing:
```sh
python app.py
```
During execution, you'll be prompted to enter:
- **Socket Server Port**: Used for P2P messaging.
- **Flask API Port**: Used for API communication.

**Example input:**
```sh
Enter your socket server port (for P2P messaging): 1
Enter flask api: 2001
```
The Flask API will be accessible at **http://localhost:2001/**.

---

### 2. Frontend Setup (Next.js)

#### Step 1: Install Dependencies
Navigate to the frontend directory and run:
```sh
npm install
```

#### Step 2: Start the Next.js App
```sh
npm run dev
```
The application will be available at **http://localhost:3000/** by default.

---

Now, your P2P chat application is set up and ready to use! 🚀

