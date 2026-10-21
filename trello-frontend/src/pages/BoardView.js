import CardModal from "../CardModal";
import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import authContext from "../context/authContext";

const LABEL_OPTIONS = [
  { name: "Urgent", color: "#f14b4b" },
  { name: "Bug", color: "#ffab00" },
  { name: "Future", color: "#28a745" },
  { name: "Low Priority", color: "#007bff" },
];

// description ke letters (characters) count karne wala helper - spaces ko ignore karta hai
const countLetters = (text) => {
  if (!text) return 0;
  return text.replace(/\s/g, "").length;
};

const BoardView = () => {
  const { boardId } = useParams();
  const context = useContext(authContext);
  const { host, authToken } = context;
  const navigate = useNavigate();

  // States
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const [boardDetails, setBoardDetails] = useState({ title: "My Board" });
  const [lists, setLists] = useState([]);
  const [cardsByList, setCardsByList] = useState({});
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitle, setNewCardTitle] = useState({});

  const [selectedCardModal, setSelectedCardModal] = useState(null);

  const [editingListId, setEditingListId] = useState(null);
  const [editListTitle, setEditListTitle] = useState("");
  const [openListMenuId, setOpenListMenuId] = useState(null);

  const [editingCardId, setEditingCardId] = useState(null);
  const [editCardTitle, setEditCardTitle] = useState("");
  const [editCardDescription, setEditCardDescription] = useState("");
  const [editCardDueDate, setEditCardDueDate] = useState("");
  const [editCardLabels, setEditCardLabels] = useState([]);

  const [completedCards, setCompletedCards] = useState({});
  const [copiedCardId, setCopiedCardId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Helper Function for Alert
  const showAlert = (message, type = "success") => {
    setAlert({ msg: message, type: type });
    setTimeout(() => {
      setAlert(null);
    }, 3000);
  };

  // Fetch Board and List Data
  const fetchBoardData = async () => {
    setLoading(true);
    try {
      const boardRes = await fetch(`${host}/api/boards/getboard/${boardId}`, {
        method: "GET",
        headers: { "auth-token": authToken },
      });
      if (boardRes.ok) {
        const boardJson = await boardRes.json();
        setBoardDetails(boardJson);
      }

      const response = await fetch(`${host}/api/lists/fetchlists/${boardId}`, {
        method: "GET",
        headers: { "auth-token": authToken },
      });
      const json = await response.json();

      if (Array.isArray(json)) {
        const sortedLists = [...json].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        setLists(sortedLists);

        const cardsMap = {};
        for (let list of sortedLists) {
          const cardResponse = await fetch(`${host}/api/cards/fetchcards/${list._id}`, {
            method: "GET",
            headers: { "auth-token": authToken },
          });
          const cardJson = await cardResponse.json();
          if (Array.isArray(cardJson)) {
            cardsMap[list._id] = [...cardJson].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
          } else {
            cardsMap[list._id] = [];
          }
        }
        setCardsByList(cardsMap);
      }
    } catch (err) {
      console.error("Error fetching board data:", err);
      showAlert("Failed to load board data", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authToken) {
      navigate("/login");
      return;
    }
    fetchBoardData();
    // eslint-disable-next-line
  }, [authToken, boardId]);

  // Calculate Total Cards Count
  let totalCardsCount = 0;
  for (let key in cardsByList) {
    if (cardsByList[key]) {
      totalCardsCount += cardsByList[key].length;
    }
  }

  // Handle Add List
  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      const response = await fetch(`${host}/api/lists/addlist/${boardId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "auth-token": authToken },
        body: JSON.stringify({ title: newListTitle, position: lists.length }),
      });
      const json = await response.json();

      if (json._id) {
        setLists([...lists, json]);
        setCardsByList({ ...cardsByList, [json._id]: [] });
        setNewListTitle("");
        showAlert("New list added successfully!");
      }
    } catch (error) {
      showAlert("Error creating list", "danger");
    }
  };

  // Handle Delete List
  const handleDeleteList = async (listId, listTitle) => {
    if (!window.confirm(`Delete list "${listTitle}" and all its cards?`)) return;

    try {
      await fetch(`${host}/api/lists/deletelist/${listId}`, {
        method: "DELETE",
        headers: { "auth-token": authToken },
      });

      setLists(lists.filter((l) => l._id !== listId));
      const updatedCards = { ...cardsByList };
      delete updatedCards[listId];
      setCardsByList(updatedCards);
      showAlert("List deleted successfully!");
    } catch (error) {
      showAlert("Error deleting list", "danger");
    }
  };

  // List Editing Functions
  const startEditingList = (list) => {
    setEditingListId(list._id);
    setEditListTitle(list.title);
  };

  const cancelEditingList = () => {
    setEditingListId(null);
    setEditListTitle("");
  };

  const handleUpdateList = async (listId) => {
    if (!editListTitle.trim()) return;

    const response = await fetch(`${host}/api/lists/updatelist/${listId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "auth-token": authToken },
      body: JSON.stringify({ title: editListTitle }),
    });
    const json = await response.json();

    if (json._id) {
      setLists(lists.map((l) => (l._id === listId ? json : l)));
      cancelEditingList();
      showAlert("List updated successfully!");
    }
  };

  // Card Editing Functions
  const startEditingCard = (card) => {
    setEditingCardId(card._id);
    setEditCardTitle(card.title);
    setEditCardDescription(card.description || "");
    setEditCardDueDate(card.dueDate ? card.dueDate.slice(0, 10) : "");
    setEditCardLabels(card.labels || []);
  };

  const cancelEditingCard = () => {
    setEditingCardId(null);
    setEditCardTitle("");
    setEditCardDescription("");
    setEditCardDueDate("");
    setEditCardLabels([]);
  };

  const toggleEditLabel = (labelName) => {
    if (editCardLabels.includes(labelName)) {
      setEditCardLabels(editCardLabels.filter((l) => l !== labelName));
    } else {
      setEditCardLabels([...editCardLabels, labelName]);
    }
  };

  const handleUpdateCard = async (cardId, listId) => {
    if (!editCardTitle.trim()) return;

    const response = await fetch(`${host}/api/cards/updatecard/${cardId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "auth-token": authToken },
      body: JSON.stringify({
        title: editCardTitle,
        description: editCardDescription,
        dueDate: editCardDueDate || null,
        labels: editCardLabels,
      }),
    });
    const json = await response.json();

    if (json._id) {
      setCardsByList({
        ...cardsByList,
        [listId]: cardsByList[listId].map((c) => (c._id === cardId ? json : c)),
      });
      cancelEditingCard();
      showAlert("Card updated successfully!");
    }
  };

  // Handle Add Card
  const handleAddCard = async (listId) => {
    const title = newCardTitle[listId];
    if (!title || !title.trim()) return;

    const currentCards = cardsByList[listId] || [];

    const response = await fetch(`${host}/api/cards/addcard/${listId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "auth-token": authToken },
      body: JSON.stringify({ title, position: currentCards.length }),
    });
    const json = await response.json();

    if (json._id) {
      setCardsByList({
        ...cardsByList,
        [listId]: [...currentCards, json],
      });
      setNewCardTitle({ ...newCardTitle, [listId]: "" });
      showAlert("Card added successfully!");
    }
  };

  // Delete Card Logic
  const handleDeleteCard = async (cardId, listId) => {
    await fetch(`${host}/api/cards/deletecard/${cardId}`, {
      method: "DELETE",
      headers: { "auth-token": authToken },
    });

    setCardsByList((prev) => ({
      ...prev,
      [listId]: (prev[listId] || []).filter((c) => c._id !== cardId),
    }));
  };

  const handleDeleteCardWithConfirm = (cardId, listId, cardTitle) => {
    if (!window.confirm(`Delete card "${cardTitle}"?`)) return;
    handleDeleteCard(cardId, listId);
    showAlert("Card deleted successfully!");
  };

  const handleMarkDone = (cardId, listId) => {
    setCompletedCards((prev) => ({ ...prev, [cardId]: true }));
    showAlert("Task Completed! Removing...", "info");
    setTimeout(() => {
      handleDeleteCard(cardId, listId);
    }, 1200);
  };

  // Drag and Drop Logic
  const onDragEnd = async (result) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;

    if (type === "list") {
      if (source.index === destination.index) return;
      const reorderedLists = Array.from(lists);
      const [movedList] = reorderedLists.splice(source.index, 1);
      reorderedLists.splice(destination.index, 0, movedList);
      setLists(reorderedLists);

      await Promise.all(
        reorderedLists.map((l, index) =>
          fetch(`${host}/api/lists/updatelist/${l._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "auth-token": authToken },
            body: JSON.stringify({ position: index }),
          })
        )
      );
      return;
    }

    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;

    if (sourceListId === destListId && source.index === destination.index) return;

    const sourceCards = Array.from(cardsByList[sourceListId]);
    const [movedCard] = sourceCards.splice(source.index, 1);

    if (sourceListId === destListId) {
      sourceCards.splice(destination.index, 0, movedCard);
      setCardsByList({ ...cardsByList, [sourceListId]: sourceCards });
    } else {
      const destCards = Array.from(cardsByList[destListId] || []);
      destCards.splice(destination.index, 0, movedCard);
      setCardsByList({
        ...cardsByList,
        [sourceListId]: sourceCards,
        [destListId]: destCards,
      });
    }

    await fetch(`${host}/api/cards/updatecard/${draggableId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "auth-token": authToken },
      body: JSON.stringify({ list: destListId, position: destination.index }),
    });
  };

  return (
    <div className="container-fluid mt-3 mb-5 px-4">
      {/* Alert Component */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show fixed-top m-3 ms-auto shadow-sm`} style={{ maxWidth: "350px", zIndex: 1050 }} role="alert">
          {alert.msg}
        </div>
      )}

      {/* Header Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 p-3 bg-white rounded-3 shadow-sm border">
        <div className="d-flex align-items-center gap-3">
          <Link to="/boards" className="btn btn-sm btn-outline-secondary fw-semibold">
            &larr; Back to Boards
          </Link>
          <h4 className="m-0 fw-bold text-dark">{boardDetails.title || "Board View"}</h4>

          <input
            type="text"
            className="form-control form-control-sm border-secondary-subtle"
            placeholder="🔍 Search cards..."
            style={{ width: "220px" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fs-6 fw-bold">
            Total Tasks: {totalCardsCount}
          </span>
        </div>
      </div>

      {/* Add New List Form */}
      <form onSubmit={handleAddList} className="mb-4 d-flex gap-2" style={{ maxWidth: "350px" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Add new list title..."
          value={newListTitle}
          onChange={(e) => setNewListTitle(e.target.value)}
        />
        <button type="submit" className="btn btn-primary fw-semibold text-nowrap px-3">
          + Add List
        </button>
      </form>

      {/* Spinner / Board Content */}
      {loading ? (
        <div className="text-center my-5 py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted fw-semibold">Loading board...</p>
        </div>
      ) : (
        <>
          {lists.length === 0 && (
            <div className="text-center my-5 p-5 border rounded-3 bg-light shadow-sm">
              <h5 className="fw-bold">No lists created yet!</h5>
              <p className="text-muted mb-0">Type a title above to create your first list.</p>
            </div>
          )}

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="all-lists" direction="horizontal" type="list">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="d-flex gap-3 pb-4 overflow-x-auto align-items-start"
                  style={{ minHeight: "75vh" }}
                >
                  {lists.map((list, listIndex) => {
                    const listCards = (cardsByList[list._id] || []).filter((card) =>
                      card.title.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    return (
                      <Draggable key={list._id} draggableId={list._id} index={listIndex}>
                        {(providedList) => (
                          <div
                            ref={providedList.innerRef}
                            {...providedList.draggableProps}
                            className="p-3 bg-light rounded-3 border shadow-sm"
                            style={{
                              width: "300px",
                              minWidth: "300px",
                              display: "flex",
                              flexDirection: "column",
                              ...providedList.draggableProps.style,
                            }}
                          >
                            {/* List Header */}
                            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                              {editingListId === list._id ? (
                                <div className="d-flex gap-1 w-100">
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={editListTitle}
                                    onChange={(e) => setEditListTitle(e.target.value)}
                                    autoFocus
                                  />
                                  <button type="button" className="btn btn-sm btn-success px-2" onClick={() => handleUpdateList(list._id)}>
                                    ✓
                                  </button>
                                  <button type="button" className="btn btn-sm btn-outline-secondary px-2" onClick={cancelEditingList}>
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="d-flex align-items-center gap-2">
                                    <span
                                      {...providedList.dragHandleProps}
                                      title="Drag list"
                                      style={{ cursor: "grab", color: "#6c757d", fontSize: "1.1rem" }}
                                    >
                                      ⠿
                                    </span>
                                    <h6 className="mb-0 fw-bold text-dark">
                                      {list.title}{" "}
                                      <span className="text-muted fw-normal fs-7">
                                        ({listCards.length})
                                      </span>
                                    </h6>
                                  </div>
                                  <div style={{ position: "relative" }}>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-light border-0 px-2 py-0"
                                      onClick={() =>
                                        setOpenListMenuId(openListMenuId === list._id ? null : list._id)
                                      }
                                    >
                                      ⋮
                                    </button>
                                    {openListMenuId === list._id && (
                                      <div
                                        className="shadow border rounded bg-white p-1"
                                        style={{
                                          position: "absolute",
                                          right: 0,
                                          top: "100%",
                                          minWidth: "120px",
                                          zIndex: 50,
                                        }}
                                      >
                                        <button
                                          type="button"
                                          className="btn btn-sm w-100 text-start text-dark"
                                          onClick={() => {
                                            startEditingList(list);
                                            setOpenListMenuId(null);
                                          }}
                                        >
                                          ✏️ Edit
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-sm w-100 text-start text-danger"
                                          onClick={() => {
                                            handleDeleteList(list._id, list.title);
                                            setOpenListMenuId(null);
                                          }}
                                        >
                                          🗑️ Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Cards Area */}
                            <Droppable droppableId={list._id} type="card">
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className="flex-grow-1 pe-1"
                                  style={{ minHeight: "50px" }}
                                >
                                  {listCards.length === 0 && (
                                    <div className="text-muted text-center py-3 border border-dashed rounded-2 mb-2 bg-white" style={{ fontSize: "0.8rem" }}>
                                      No tasks here
                                    </div>
                                  )}

                                  {listCards.map((card, index) => (
                                    <Draggable key={card._id} draggableId={card._id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`card mb-2 p-2 border-0 shadow-sm rounded-2 bg-white ${
                                            snapshot.isDragging ? "shadow border border-primary" : ""
                                          }`}
                                        >
                                          {editingCardId === card._id ? (
                                            /* Inline Card Edit Form */
                                            <div className="d-flex flex-column gap-2">
                                              <div className="d-flex align-items-center gap-2">
                                                <span
                                                  {...provided.dragHandleProps}
                                                  title="Drag"
                                                  style={{ cursor: "grab", color: "#adb5bd", fontSize: "0.85rem" }}
                                                >
                                                  ⠿
                                                </span>
                                                <input
                                                  type="text"
                                                  className="form-control form-control-sm"
                                                  value={editCardTitle}
                                                  onChange={(e) => setEditCardTitle(e.target.value)}
                                                  placeholder="Card Title"
                                                  autoFocus
                                                />
                                              </div>
                                              <div className="text-muted text-end" style={{ fontSize: "0.7rem", marginTop: "-4px" }}>
                                                {countLetters(editCardTitle)} letters
                                              </div>
                                              <textarea
                                                className="form-control form-control-sm"
                                                value={editCardDescription}
                                                onChange={(e) => setEditCardDescription(e.target.value)}
                                                placeholder="Description"
                                                rows={2}
                                              />
                                              <div className="text-muted text-end" style={{ fontSize: "0.7rem", marginTop: "-4px" }}>
                                                {countLetters(editCardDescription)} letters
                                              </div>
                                              <input
                                                type="date"
                                                className="form-control form-control-sm"
                                                value={editCardDueDate}
                                                onChange={(e) => setEditCardDueDate(e.target.value)}
                                              />
                                              <div className="d-flex flex-wrap gap-1">
                                                {LABEL_OPTIONS.map((label) => (
                                                  <button
                                                    key={label.name}
                                                    type="button"
                                                    className="btn btn-sm text-white px-2 py-0"
                                                    onClick={() => toggleEditLabel(label.name)}
                                                    style={{
                                                      backgroundColor: label.color,
                                                      fontSize: "0.7rem",
                                                      opacity: editCardLabels.includes(label.name) ? 1 : 0.4,
                                                      border: editCardLabels.includes(label.name) ? "2px solid #000" : "none",
                                                    }}
                                                  >
                                                    {label.name}
                                                  </button>
                                                ))}
                                              </div>
                                              <div className="d-flex justify-content-end gap-2 mt-1">
                                                <button
                                                  type="button"
                                                  className="btn btn-sm btn-outline-secondary"
                                                  onClick={cancelEditingCard}
                                                >
                                                  Cancel
                                                </button>
                                                <button
                                                  type="button"
                                                  className="btn btn-sm btn-primary"
                                                  onClick={() => handleUpdateCard(card._id, list._id)}
                                                >
                                                  Save
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            /* Standard Card View */
                                            <div>
                                              {/* Labels */}
                                              {card.labels && card.labels.length > 0 && (
                                                <div className="d-flex flex-wrap gap-1 mb-2">
                                                  {card.labels.map((labelName) => {
                                                    const label = LABEL_OPTIONS.find((l) => l.name === labelName);
                                                    return (
                                                      <span
                                                        key={labelName}
                                                        className="badge"
                                                        style={{
                                                          backgroundColor: label ? label.color : "#6c757d",
                                                          fontSize: "0.65rem",
                                                        }}
                                                      >
                                                        {labelName}
                                                      </span>
                                                    );
                                                  })}
                                                </div>
                                              )}

                                              {copiedCardId === card._id && (
                                                <span className="badge bg-success-subtle text-success mb-1" style={{ fontSize: "0.65rem" }}>
                                                  Copied!
                                                </span>
                                              )}

                                              {/* Card Title & Actions */}
                                              <div className="d-flex justify-content-between align-items-start gap-1">
                                                <div className="d-flex align-items-center gap-2">
                                                  <span
                                                    {...provided.dragHandleProps}
                                                    title="Drag"
                                                    style={{ cursor: "grab", color: "#adb5bd", fontSize: "0.85rem" }}
                                                  >
                                                    ⠿
                                                  </span>
                                                  <input
                                                    type="checkbox"
                                                    className="form-check-input mt-0"
                                                    checked={!!completedCards[card._id]}
                                                    onChange={() => handleMarkDone(card._id, list._id)}
                                                  />
                                                  <span
                                                    className="fw-semibold text-dark"
                                                    style={{
                                                      cursor: "pointer",
                                                      fontSize: "0.9rem",
                                                      ...(completedCards[card._id]
                                                        ? { textDecoration: "line-through", opacity: 0.5 }
                                                        : {}),
                                                    }}
                                                    onClick={() => startEditingCard(card)}
                                                  >
                                                    {card.title}
                                                  </span>
                                                </div>

                                                {/* Actions (Attachments, Copy Title & Delete Cross Button) */}
                                                <div className="d-flex gap-1 opacity-75">
                                                  <button
                                                    type="button"
                                                    className="btn btn-sm btn-light p-0 px-1 border-0"
                                                    title="Attachments"
                                                    onClick={() => setSelectedCardModal(card)}
                                                  >
                                                    📁
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="btn btn-sm btn-light p-0 px-1 border-0"
                                                    title="Copy Title"
                                                    onClick={() => {
                                                      navigator.clipboard.writeText(card.title);
                                                      setCopiedCardId(card._id);
                                                      setTimeout(() => setCopiedCardId(null), 1500);
                                                    }}
                                                  >
                                                    📋
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="btn btn-sm btn-light p-0 px-1 text-danger border-0"
                                                    title="Delete Task"
                                                    onClick={() =>
                                                      handleDeleteCardWithConfirm(card._id, list._id, card.title)
                                                    }
                                                  >
                                                    ×
                                                  </button>
                                                </div>
                                              </div>

                                              {/* Description */}
                                              {card.description && (
                                                <>
                                                  <p className="mb-0 mt-1 text-muted text-truncate" style={{ fontSize: "0.78rem" }}>
                                                    {card.description}
                                                  </p>
                                                  <div className="text-muted text-end" style={{ fontSize: "0.65rem" }}>
                                                    {countLetters(card.description)} letters
                                                  </div>
                                                </>
                                              )}

                                              {/* Attachments */}
                                              {card.attachments && card.attachments.length > 0 && (
                                                <div className="mt-2 d-flex flex-wrap gap-1">
                                                  {card.attachments.map((att, attIndex) => (
                                                    <a
                                                      key={attIndex}
                                                      href={`${host}/${att.filepath || att}`}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      className="badge bg-light text-secondary border text-decoration-none text-truncate"
                                                      style={{ fontSize: "0.65rem", maxWidth: "140px" }}
                                                    >
                                                      📎 {att.filename || att}
                                                    </a>
                                                  ))}
                                                </div>
                                              )}

                                              {/* Due Date Badge */}
                                              {card.dueDate &&
                                                (() => {
                                                  const parts = card.dueDate.slice(0, 10).split("-");
                                                  const dueDate = new Date(parts[0], parts[1] - 1, parts[2]);
                                                  const today = new Date();
                                                  today.setHours(0, 0, 0, 0);

                                                  const isOverdue = dueDate < today;
                                                  const isToday = dueDate.getTime() === today.getTime();

                                                  let badgeClass = "bg-success-subtle text-success border-success-subtle";
                                                  let statusText = "Coming";

                                                  if (isOverdue) {
                                                    badgeClass = "bg-danger-subtle text-danger border-danger-subtle";
                                                    statusText = "Overdue";
                                                  } else if (isToday) {
                                                    badgeClass = "bg-primary-subtle text-primary border-primary-subtle";
                                                    statusText = "Today";
                                                  }

                                                  return (
                                                    <div className="mt-2">
                                                      <span className={`badge border ${badgeClass}`} style={{ fontSize: "0.68rem" }}>
                                                        📅 {dueDate.toLocaleDateString()} ({statusText})
                                                      </span>
                                                    </div>
                                                  );
                                                })()}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>

                            {/* Add Card Footer Form */}
                            <div className="d-flex gap-1 mt-2 pt-2 border-top">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Add card..."
                                value={newCardTitle[list._id] || ""}
                                onChange={(e) => setNewCardTitle({ ...newCardTitle, [list._id]: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAddCard(list._id);
                                }}
                              />
                              <button type="button" className="btn btn-sm btn-primary fw-bold" onClick={() => handleAddCard(list._id)}>
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}

      {/* Card Details Modal */}
      {selectedCardModal && (
        <CardModal
          card={selectedCardModal}
          onClose={() => setSelectedCardModal(null)}
          onUpdate={fetchBoardData}
        />
      )}
    </div>
  );
};

export default BoardView;