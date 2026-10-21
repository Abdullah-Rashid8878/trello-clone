const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetchuser'); // Custom Auth Middleware
const List = require('../models/List');
const Card = require('../models/Card');
const Board = require('../models/Board');
const { body, validationResult } = require('express-validator');


// Helper Function: Check karo ki user ke paas board ka access hai ya nahi (Owner or Member)

const checkBoardAccess = (board, userId) => {
    if (!board) return false;
    
    // 1. Check karo kya current user board ka owner hai
    const isOwner = board.user.toString() === userId;
    
    // 2. Check karo kya current user board ka member hai (Robust handling for populated/unpopulated data)
    const isMember = board.members && board.members.some(m => {
        const memberId = m.user ? m.user.toString() : m.toString();
        return memberId === userId;
    });

    return isOwner || isMember;
};


// ROUTE 1: Get all lists of a board: GET "/api/lists/fetchlists/:boardId". Login required

router.get('/fetchlists/:boardId', fetchuser, async (req, res) => {
    try {
        // Step 1: Board find karo
        const board = await Board.findById(req.params.boardId);

        // Step 2: Helper function se access check karo
        if (!checkBoardAccess(board, req.user.id)) {
            return res.status(401).send("Not Allowed: You do not have access to this board");
        }

        // Step 3: Board ki sari lists ko 'position' ke basis par sort karke fetch karo
        const lists = await List.find({ board: req.params.boardId }).sort('position');
        res.json(lists);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});


// ROUTE 2: Add a new list to a board: POST "/api/lists/addlist/:boardId". Login required

router.post('/addlist/:boardId', fetchuser, [
    body('title', 'Title must be at least 1 character').isLength({ min: 1 }),
], async (req, res) => {
    try {
        // Validation check
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const board = await Board.findById(req.params.boardId);

        // Access check
        if (!checkBoardAccess(board, req.user.id)) {
            return res.status(401).send("Not Allowed");
        }

        // Existing lists count nikal lo taaki nayi list ki position set ki ja sake
        const existingLists = await List.find({ board: req.params.boardId });

        // Nayi List object create kar rahe hain
        const list = new List({
            title: req.body.title,
            board: req.params.boardId,
            position: existingLists.length
        });

        const savedList = await list.save();
        res.json(savedList);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});


// ROUTE 3: Update a list's title or position: PUT "/api/lists/updatelist/:id". Login required

router.put('/updatelist/:id', fetchuser, async (req, res) => {
    try {
        const { title, position } = req.body;
        const newListData = {};
        if (title) newListData.title = title;
        if (position !== undefined) newListData.position = position;

        // Pehle check karo ki list exist karti hai ya nahi
        let list = await List.findById(req.params.id);
        if (!list) {
            return res.status(404).send("List not found");
        }

        const board = await Board.findById(list.board);

        // Access check
        if (!checkBoardAccess(board, req.user.id)) {
            return res.status(401).send("Not Allowed");
        }

        // List ko update karke updated document return karo
        list = await List.findByIdAndUpdate(req.params.id, { $set: newListData }, { new: true });
        res.json(list);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});


// ROUTE 4: Delete a list: DELETE "/api/lists/deletelist/:id". Login required

router.delete('/deletelist/:id', fetchuser, async (req, res) => {
    try {
        let list = await List.findById(req.params.id);
        if (!list) {
            return res.status(404).send("List not found");
        }

        const board = await Board.findById(list.board);

        // Access check
        if (!checkBoardAccess(board, req.user.id)) {
            return res.status(401).send("Not Allowed");
        }

        // Cascade Delete: List ke delete hone par uske andar ke sare cards ko bhi delete kar do
        await Card.deleteMany({ list: req.params.id });
        
        // Ab list ko delete karo
        list = await List.findByIdAndDelete(req.params.id);
        res.json({ Success: "List has been deleted", list: list });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});

// Router module ko export kar rahe hain
module.exports = router;