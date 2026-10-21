# Trello Clone

A full-stack task management application inspired by Trello, built using the MERN stack (MongoDB, Express, React, Node.js). It allows users to create boards, organize tasks into lists, and manage cards with drag-and-drop functionality.

## Features

- **Authentication** — Signup and login with JWT-based authentication
- **Boards** — Create, edit, delete, and search boards
- **Lists** — Create, edit, delete, and reorder lists within a board (drag-and-drop)
- **Cards** — Create, edit, and delete cards with:
  - Description
  - Due dates (with overdue/today/upcoming highlighting)
  - Color-coded labels (Urgent, Bug, Future, Low Priority)
  - Checkbox to mark a card as done (auto-removes after a short delay)
  - Copy-to-clipboard button for card titles
- **Drag-and-drop** — Move cards between lists, and reorder lists themselves
- **Delete confirmations** — Prevents accidental deletion of boards, lists, and cards
- **About page** — Accessible without logging in
- **Dark theme** — Trello-inspired dark UI

## Tech Stack

**Frontend**
- React (Create React App)
- React Router DOM
- Bootstrap
- @hello-pangea/dnd (drag-and-drop)

**Backend**
- Node.js
- Express.js
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for authentication
- bcryptjs for password hashing

## Project Structure

```
trello-backend/
  models/        -> Mongoose schemas (User, Board, List, Card)
  routes/        -> API endpoints (auth, boards, lists, cards)
  middleware/    -> JWT authentication middleware
  db.js          -> MongoDB connection
  index.js       -> Server entry point

trello-frontend/
  src/
    pages/       -> Login, Signup, Boards, BoardView, About
    context/     -> Global auth state (React Context)
    App.js       -> Route definitions
    App.css      -> Global styling
```

## Setup Instructions

### Backend

```bash
cd trello-backend
npm install
```

Create a `.env` file in `trello-backend/` with the following:

```
MONGO_URI=mongodb://127.0.0.1:27017/trelloclone
JWT_SECRET=abdullah_trello_app_2026_secret_xyz123
PORT=5000
```

Start the server:

```bash
npm run dev
```

The backend will run at `http://localhost:5000`.

### Frontend

```bash
cd trello-frontend
npm install
npm start
```

The frontend will run at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/createuser` | Register a new user |
| POST | `/api/auth/login` | Log in a user |
| GET | `/api/boards/fetchallboards` | Get all boards for the logged-in user |
| POST | `/api/boards/addboard` | Create a new board |
| PUT | `/api/boards/updateboard/:id` | Update a board |
| DELETE | `/api/boards/deleteboard/:id` | Delete a board |
| GET | `/api/lists/fetchlists/:boardId` | Get all lists for a board |
| POST | `/api/lists/addlist/:boardId` | Create a new list |
| PUT | `/api/lists/updatelist/:id` | Update a list (title or position) |
| DELETE | `/api/lists/deletelist/:id` | Delete a list |
| GET | `/api/cards/fetchcards/:listId` | Get all cards for a list |
| POST | `/api/cards/addcard/:listId` | Create a new card |
| PUT | `/api/cards/updatecard/:id` | Update a card |
| DELETE | `/api/cards/deletecard/:id` | Delete a card |

## Author

Abdullah Rashid
