import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authContext from "../context/authContext";

const Boards = () => {
  // Context and Hooks setup
  const context = useContext(authContext);
  const { host, authToken, logout } = context;
  const navigate = useNavigate();

  // Core States
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Inline Edit States
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Invite & Role States
  const [invitingBoardId, setInvitingBoardId] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Editor");
  const [inviteMessage, setInviteMessage] = useState("");

  // Drawer / Panel States
  const [activeLogBoardId, setActiveLogBoardId] = useState(null);

  // Fetch all boards from backend
  const fetchBoards = async () => {
    try {
      const response = await fetch(`${host}/api/boards/fetchallboards`, {
        method: "GET",
        headers: { "auth-token": authToken },
      });
      const json = await response.json();
      if (Array.isArray(json)) {
        setBoards(json);
      }
    } catch (err) {
      console.error("Fetch Boards Error:", err);
    }
  };

  useEffect(() => {
    if (!authToken) {
      navigate("/login");
    } else {
      fetchBoards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  // Handle adding a new board
  const handleAddBoard = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(`${host}/api/boards/addboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": authToken,
        },
        body: JSON.stringify({ title, description }),
      });
      const json = await response.json();
      if (json._id) {
        setBoards([...boards, json]);
        setTitle("");
        setDescription("");

        // Default list initialization
        const defaultLists = ["To Do", "In Progress", "Done"];
        for (const listTitle of defaultLists) {
          await fetch(`${host}/api/lists/addlist/${json._id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "auth-token": authToken,
            },
            body: JSON.stringify({ title: listTitle }),
          });
        }
      } else {
        setError(
          json.error || "Could not create board. Title must be at least 3 characters."
        );
      }
    } catch (err) {
      setError("Something went wrong while adding the board.");
    }
  };

  // Handle board deletion
  const handleDeleteBoard = async (id, boardTitle) => {
    const confirmed = window.confirm(
      `Delete board "${boardTitle}"? This cannot be undone.`
    );
    if (!confirmed) return;

    await fetch(`${host}/api/boards/deleteboard/${id}`, {
      method: "DELETE",
      headers: { "auth-token": authToken },
    });
    setBoards(boards.filter((board) => board._id !== id));
  };

  // Handle leaving a board
  const handleLeaveBoard = async (id, boardTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to leave "${boardTitle}"?`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${host}/api/boards/leaveboard/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": authToken,
        },
      });
      const json = await response.json();
      if (json.boardId || json.success) {
        setBoards(boards.filter((b) => b._id !== id));
      } else {
        alert(json.error || "Could not leave board.");
      }
    } catch (err) {
      console.error("Leave board error:", err);
    }
  };

  // Edit board handlers
  const startEditing = (board) => {
    setEditingId(board._id);
    setEditTitle(board.title);
    setEditDescription(board.description || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleUpdateBoard = async (id) => {
    const response = await fetch(`${host}/api/boards/updateboard/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "auth-token": authToken },
      body: JSON.stringify({ title: editTitle, description: editDescription }),
    });
    const json = await response.json();
    if (json._id) {
      setBoards(boards.map((b) => (b._id === id ? json : b)));
      cancelEditing();
    } else {
      alert(json.error || "Could not update board.");
    }
  };

  // Handle inviting new members
  const handleInvite = async (boardId) => {
    setInviteMessage("");
    try {
      const response = await fetch(`${host}/api/boards/addmember/${boardId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": authToken,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const json = await response.json();
      if (json.success) {
        setInviteMessage(`✓ ${json.message}`);
        setInviteEmail("");
        if (json.board) {
          setBoards(boards.map((b) => (b._id === boardId ? json.board : b)));
        } else {
          fetchBoards();
        }
        setTimeout(() => {
          setInvitingBoardId(null);
          setInviteMessage("");
        }, 2000);
      } else {
        setInviteMessage(json.error || "Could not send invite.");
      }
    } catch (err) {
      setInviteMessage("Failed to invite member.");
    }
  };

  // Handle removing member
  const handleRemoveMember = async (boardId, userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this member?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `${host}/api/boards/removemember/${boardId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "auth-token": authToken,
          },
          body: JSON.stringify({ userId }),
        }
      );
      const json = await response.json();
      if (json._id) {
        setBoards(boards.map((b) => (b._id === boardId ? json : b)));
      }
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  // Handle User Logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Search filter calculation
  const filteredBoards = boards.filter((board) =>
    board.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mt-4 mb-5"> 
      {/* Header / Navbar Options */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Boards</h2>
        <div className="d-flex gap-2">
          <Link to="/profile" className="btn btn-outline-secondary">
            Profile
          </Link>
          <Link to="/about" className="btn btn-outline-secondary">
            About
          </Link>
          <button className="btn btn-outline-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Search Input */}
      <input
        type="text"
        className="form-control mb-3 search-input"
        placeholder="🔍 Search boards..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Add Board Form */}
      <form onSubmit={handleAddBoard} className="mb-4">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="row g-2">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Board title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="col-md-5">
            <input
              type="text"
              className="form-control"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <button type="submit" className="btn btn-primary w-100">
              Add Board
            </button>
          </div>
        </div>
      </form>

      {/* Boards Grid */}
      <div className="row align-items-start">
        {filteredBoards.length === 0 && (
          <p className="text-muted ms-2">No boards found.</p>
        )}

        {filteredBoards.map((board) => (
          <div className="col-md-4 mb-3" key={board._id}>
            <div className="card shadow-sm">
              <div className="card-body">
                <div>
                  {editingId === board._id ? (
                    // Edit Mode JSX
                    <>
                      <input
                        type="text"
                        className="form-control mb-2"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-control mb-2"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                      <div className="d-flex justify-content-between mb-3">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpdateBoard(board._id)}
                        >
                          ✓ Save
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={cancelEditing}
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    // Normal View Mode
                    <>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5
                          className="card-title mb-0"
                          style={{ cursor: "pointer" }}
                          title="Click to edit"
                          onClick={() => startEditing(board)}
                        >
                          {board.title}
                        </h5>
                        <button
                          className="btn btn-sm btn-light border"
                          title="Activity & Members"
                          onClick={() =>
                            setActiveLogBoardId(
                              activeLogBoardId === board._id
                                ? null
                                : board._id
                            )
                          }
                        >
                          Members
                        </button>
                      </div>

                      <p className="card-text text-muted mb-3">
                        {board.description}
                      </p>

                      {/* Members Badges */}
                      {board.members && board.members.length > 0 && (
                        <div className="mb-3">
                          <small className="text-muted d-block mb-1">
                            Members:
                          </small>
                          <div className="d-flex flex-wrap gap-1">
                            {board.members.map((m) => {
                              const memberUser = m.user || m;
                              const memberId = memberUser._id || memberUser;
                              const memberName =
                                memberUser.name ||
                                memberUser.email ||
                                "User";

                              return (
                                <span
                                  key={memberId}
                                  className="badge bg-secondary d-inline-flex align-items-center gap-1"
                                >
                                  {memberName} ({m.role || "Editor"})
                                  <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    style={{
                                      fontSize: "0.45rem",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      handleRemoveMember(board._id, memberId)
                                    }
                                  ></button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Invite Form Section */}
                      {invitingBoardId === board._id && (
                        <div className="mb-3 p-2 bg-light rounded border">
                          {inviteMessage && (
                            <p
                              style={{ fontSize: "0.8rem" }}
                              className="mb-1 text-primary"
                            >
                              {inviteMessage}
                            </p>
                          )}
                          <div className="d-flex flex-column gap-2">
                            <input
                              type="email"
                              className="form-control form-control-sm"
                              placeholder="Friend's email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                            />
                            <div className="d-flex gap-1">
                              <select
                                className="form-select form-select-sm"
                                value={inviteRole}
                                onChange={(e) =>
                                  setInviteRole(e.target.value)
                                }
                              >
                                <option value="Editor">Editor</option>
                                <option value="Viewer">Viewer</option>
                              </select>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleInvite(board._id)}
                              >
                                Add
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setInvitingBoardId(null)}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Activity Log Drawer */}
                      {activeLogBoardId === board._id && (
                        <div className="mb-3 p-2 bg-light rounded border">
                          <div className="mb-2 pb-2 border-bottom">
                            <small  
                              className="fw-bold text-success d-block mb-1"
                              style={{ fontSize: "0.75rem" }}
                            >
                              🟢 Active People:
                            </small>
                            <div className="d-flex flex-wrap gap-1">
                              <span
                                className="badge bg-success"
                                style={{ fontSize: "0.7rem" }}
                              >
                                {board.user?.name ||
                                  board.user?.email ||
                                  "Owner"}{" "}
                                (Owner)
                              </span>
                              {board.members &&
                                board.members.map((m) => {
                                  const memberUser = m.user || m;
                                  return (
                                    <span
                                      key={memberUser._id || memberUser}
                                      className="badge bg-info text-dark"
                                      style={{ fontSize: "0.7rem" }}
                                    >{}
                                      {memberUser.name ||
                                        memberUser.email ||
                                        "Member"}{" "}
                                      ({m.role || "Editor"})
                                    </span>
                                  );
                                })}
                            </div>
                          </div>

                          <small
                            className="fw-bold d-block mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Activity History:
                          </small>
                          {board.activityLog &&
                          board.activityLog.length > 0 ? (
                            <ul
                              className="list-unstyled mb-0"
                              style={{
                                maxHeight: "100px",
                                overflowY: "auto",
                                fontSize: "0.75rem",
                              }}
                            >
                              {board.activityLog.map((log, index) => (
                                <li
                                  key={index}
                                  className="border-bottom py-1"
                                >
                                  <span className="fw-semibold">
                                    {log.user?.name || "User"}
                                  </span>
                                  : {log.action}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <small
                              className="text-muted"
                              style={{ fontSize: "0.75rem" }}
                            >
                              No activities recorded yet.
                            </small>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Card Action Buttons (Open, Invite, Delete, Leave) */}
                <div className="d-flex justify-content-between mt-3 pt-2 border-top">
                  <Link
                    to={`/board/${board._id}`}
                    className="btn btn-sm btn-primary"
                  >
                    Open
                  </Link>
                  <button
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => setInvitingBoardId(board._id)}
                  >
                    Invite
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() =>
                      handleDeleteBoard(board._id, board.title)
                    }
                  >
                    Delete
                  </button>
                  <button
                    className="btn btn-sm btn-outline-warning text-dark"
                    onClick={() =>
                      handleLeaveBoard(board._id, board.title)
                    }
                  >
                    Leave
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Boards;