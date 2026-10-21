import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthState from "./context/AuthState";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Boards from "./pages/Boards";
import BoardView from "./pages/BoardView";
import About from "./pages/About";
import Profile from "./pages/Profile";
import AcceptInvite from "./pages/AcceptInvite";

function App() {
  return (
    <AuthState>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/boards" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/boards" element={<Boards />} />
          <Route path="/board/:boardId" element={<BoardView />} />
          <Route path="/invite/:token" element={<AcceptInvite />} />
        </Routes>
      </BrowserRouter>
    </AuthState>
  );
}

export default App;