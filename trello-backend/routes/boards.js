// Purpose: Express Router for Kanban Board Management, Collaboration, and Member Invites
const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetchuser'); // Custom Authentication Middleware
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const User = require('../models/User');
const Invite = require('../models/Invite');
const sendInviteEmail = require('../utils/sendEmail'); // Email utility function

const { body, validationResult } = require('express-validator');

// Helper Function: Board ke andar activity logs record karne ke liye
const logActivity = async (boardId, userId, actionText) => {
    try {
        await Board.findByIdAndUpdate(boardId, {
            $push: {
                activityLog: {
                    $each: [{ action: actionText, user: userId }],
                    $position: 0 // Latest action ko array ke sabse upar (index 0) dikhane ke liye
                }
            }
        });
    } catch (err) {
        console.error("Activity log error:", err);
    }
};

// ROUTE 1: Get All Boards of the logged-in user (Owner or Member): GET "/api/boards/fetchallboards". Login required
router.fetchallboards = router.get('/fetchallboards', fetchuser, async (req, res) => {
    try {
        // Query: Woh sabhi boards fetch karo jiska owner current user hai YA jisme current user member hai
        const boards = await Board.find({
            $or: [
                { user: req.user.id },
                { "members.user": req.user.id }
            ]
        })
        .populate("user", "name email")
        .populate("members.user", "name email")
        .populate("activityLog.user", "name email");

        res.json(boards);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});

// ROUTE 2: Fetch a Single Board by ID: GET "/api/boards/getboard/:id". Login required
router.get('/getboard/:id', fetchuser, async (req, res) => {
    try {
        const board = await Board.findById(req.params.id)
            .populate("user", "name email")
            .populate("members.user", "name email")
            .populate("activityLog.user", "name email");

        if (!board) {
            return res.status(404).json({ error: "Board not found" });
        }

        // Security Check: Verify karo ki user board ka Owner ya Member hai ya nahi
        const isOwner = board.user._id.toString() === req.user.id;
        const isMember = board.members.some(m => m.user && m.user._id.toString() === req.user.id);

        if (!isOwner && !isMember) {
            return res.status(401).json({ error: "Access denied" });
        }

        res.json(board);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});

// ROUTE 3: Add a new Board: POST "/api/boards/addboard". Login required
router.post('/addboard', fetchuser, [
    body('title', 'Title must be at least 3 characters').isLength({ min: 3 }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description } = req.body;
        
        // Naya board object create kar rahe hain with initial activity log
        const board = new Board({
            title,
            description,
            user: req.user.id,
            members: [],
            activityLog: [{ action: "Board created", user: req.user.id }]
        });

        const savedBoard = await board.save();

        // Populate karke complete board data client ko wapas bhejo
        const populatedBoard = await Board.findById(savedBoard._id)
            .populate("user", "name email")
            .populate("members.user", "name email")
            .populate("activityLog.user", "name email");

        res.json(populatedBoard);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});

// ROUTE 4: Update an existing Board: PUT "/api/boards/updateboard/:id". Login required (Owner or Editor)
router.put('/updateboard/:id', fetchuser, async (req, res) => {
    try {
        const { title, description } = req.body;
        let board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).send("Board not found");
        }

        // Role check: Owner ya phir 'Editor' role wale member ko hi update ki permission hai (Viewers ko nahi)
        const isOwner = board.user.toString() === req.user.id;
        const memberObj = board.members.find(m => m.user.toString() === req.user.id);
        const isEditor = memberObj && memberObj.role === 'Editor';

        if (!isOwner && !isEditor) {
            return res.status(401).json({ error: "Access denied: Viewers cannot update board details" });
        }

        const newBoardData = {};
        if (title) newBoardData.title = title;
        if (description !== undefined) newBoardData.description = description;

        board = await Board.findByIdAndUpdate(req.params.id, { $set: newBoardData }, { new: true })
            .populate("user", "name email")
            .populate("members.user", "name email")
            .populate("activityLog.user", "name email");

        // Activity log record karo
        await logActivity(req.params.id, req.user.id, "Updated board details");

        res.json(board);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});

// ROUTE 5: Delete an existing Board: DELETE "/api/boards/deleteboard/:id". Login required (Owner only)
router.delete('/deleteboard/:id', fetchuser, async (req, res) => {
    try {
        let board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).send("Board not found");
        }

        // Sirf board ka original owner hi board delete kar sakta hai
        if (board.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }

        // Cascade Delete: Board ke andar ki lists aur cards ko bhi database se delete karo
        const lists = await List.find({ board: req.params.id });
        const listIds = lists.map(list => list._id);
        await Card.deleteMany({ list: { $in: listIds } });
        await List.deleteMany({ board: req.params.id });

        // Finally board ko delete kar do
        board = await Board.findByIdAndDelete(req.params.id);
        res.json({ Success: "Board has been deleted", board: board });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});

// ROUTE 6: Add a member or Send invite: POST "/api/boards/addmember/:id". Login required (Owner only)
router.post('/addmember/:id', fetchuser, async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ error: "Board not found" });
        }
        if (board.user.toString() !== req.user.id) {
            return res.status(401).json({ error: "Only the board owner can add members" });
        }

        const { email, role } = req.body;
        const normalizedEmail = email ? email.toLowerCase().trim() : "";
        const assignedRole = ['Editor', 'Viewer'].includes(role) ? role : 'Editor';

        // Check karo ki kya user already hamare platform par registered hai ya nahi
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            // Agar registered hai, toh direct board members array mein push kar do
            const isOwner = board.user.toString() === existingUser._id.toString();
            const isAlreadyMember = board.members.some(m => m.user.toString() === existingUser._id.toString());

            if (isOwner || isAlreadyMember) {
                return res.status(400).json({ error: "User is already on this board" });
            }

            board.members.push({ user: existingUser._id, role: assignedRole });
            await board.save();

            const inviter = await User.findById(req.user.id);
            await logActivity(board._id, req.user.id, `Added ${existingUser.name || existingUser.email} to the board`);

            try {
                await sendInviteEmail(
                    normalizedEmail, 
                    board.title, 
                    inviter ? inviter.name : "Board Admin", 
                    "DIRECT_ADDED"
                );
            } catch (e) {
                console.log("Notification email failed, but user was added:", e.message);
            }

            return res.json({ 
                success: true, 
                message: `${existingUser.name || normalizedEmail} has been added directly to the board!` 
            });
        }

        // Agar user unregistered hai, toh Invite collection mein token generate karke email bhejo
        const inviter = await User.findById(req.user.id);

        const invite = await Invite.create({
            email: normalizedEmail,
            board: board._id,
            invitedBy: req.user.id,
            role: assignedRole,
        });

        try {
            await sendInviteEmail(normalizedEmail, board.title, inviter ? inviter.name : "Board Admin", invite.token);
        } catch (emailError) {
            console.error("Email failed to send:", emailError.message);
            return res.status(500).json({ error: "Could not send invite email" });
        }

        res.json({ success: true, message: `Invite email sent to unregistered user (${normalizedEmail})` });

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});

// ROUTE 7: Remove a member: DELETE "/api/boards/removemember/:id". Login required (Owner only)
router.delete('/removemember/:id', fetchuser, async (req, res) => {
    try {
        const { userId } = req.body;
        let board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ error: "Board not found" });
        }

        if (board.user.toString() !== req.user.id) {
            return res.status(401).json({ error: "Only the board owner can remove members" });
        }

        const userToRemove = await User.findById(userId);

        // MongoDB $pull operator ka use karke members array se user ko hata rahe hain
        board = await Board.findByIdAndUpdate(
            req.params.id,
            { $pull: { members: { user: userId } } },
            { new: true }
        )
        .populate("user", "name email")
        .populate("members.user", "name email")
        .populate("activityLog.user", "name email");

        if (userToRemove) {
            await logActivity(req.params.id, req.user.id, `Removed ${userToRemove.name || userToRemove.email} from board`);
        }

        res.json(board);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});

// ROUTE 8: Leave a board: POST "/api/boards/leaveboard/:id". Login required (Members only)

router.post('/leaveboard/:id', fetchuser, async (req, res) => {
    try {
        let board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ error: "Board not found" });
        }

        // Owner apna khud ka board leave nahi kar sakta, usko delete karna padega
        if (board.user.toString() === req.user.id) {
            return res.status(400).json({ error: "Owner cannot leave their own board. Delete it instead." });
        }

        const isMember = board.members.some(m => m.user.toString() === req.user.id);
        if (!isMember) {
            return res.status(400).json({ error: "You are not a member of this board" });
        }

        const userLeaving = await User.findById(req.user.id);

        await Board.findByIdAndUpdate(
            req.params.id,
            { $pull: { members: { user: req.user.id } } }
        );

        await logActivity(req.params.id, req.user.id, `${userLeaving ? userLeaving.name : 'A member'} left the board`);

        res.json({ message: "Successfully left the board", boardId: req.params.id });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});

// ROUTE 9: Accept a board invite: POST "/api/boards/acceptinvite/:token". Login required

router.post('/acceptinvite/:token', fetchuser, async (req, res) => {
    try {
        // Token ke base par invite document find karo
        const invite = await Invite.findOne({ token: req.params.token });
        if (!invite) {
            return res.status(404).json({ error: "Invite not found or already used" });
        }

        const loggedInUser = await User.findById(req.user.id);
        if (!loggedInUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const board = await Board.findById(invite.board);
        if (!board) {
            return res.status(404).json({ error: "Board no longer exists" });
        }

        const isOwner = board.user.toString() === loggedInUser._id.toString();
        const isAlreadyMember = board.members.some(m => m.user.toString() === loggedInUser._id.toString());

        // Agar user pehle se member nahi hai, toh board members mein add kar do
        if (!isOwner && !isAlreadyMember) {
            board.members.push({ user: loggedInUser._id, role: invite.role || 'Editor' });
            await board.save();
            await logActivity(board._id, loggedInUser._id, `${loggedInUser.name || loggedInUser.email} joined the board`);
        }

        // Ek baar invite accept hone ke baad invite record ko database se delete kar do (One-time use token)
        await Invite.deleteOne({ _id: invite._id });

        res.json({ success: true, boardId: board._id, boardTitle: board.title });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Some Error occurred");
    }
});

// Router module ko export kar rahe hain
module.exports = router;