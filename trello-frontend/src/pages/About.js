import React from "react";
import { Link } from "react-router-dom";

const About = () => {
    return (
        <div className="container mt-5" style={{ maxWidth: "600px" }}>
            <h2 className="mb-4">About This App</h2>
            <p>
                This is a Trello-style task management app built with the MERN stack
                (MongoDB, Express, React, Node.js). It lets you create boards, organize
                tasks into lists, and drag-and-drop cards between them.
            </p>
            <p>Features include boards, lists, cards, drag-and-drop, and task completion tracking.</p>
            <Link to="/boards" className="btn btn-primary mt-2">Board Page</Link>
        </div>
    );
};

export default About;