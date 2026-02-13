const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
}));

router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/login',
    failureFlash: true
}), (req, res) => {
    req.session.user = req.user._id;
    res.redirect('/home');
});

router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/login');
    });
});

module.exports = router;
