const { render } = require('ejs');
const express = require('express');
const router = express.Router();
const session = require('express-session');
/**
 * TODO: Add Session store to avoid memory leaks
 */

router.get('/', (req, res) => {
    res.render('homepage', {logged: req.session.authenticated, user: req.session.username });
});

router.get('/dashboard', (req, res)=>{
    var content;
    var title = 'Dashboard'
    if (req.session.authenticated){
        // Set content
        content = {"html": "<h1>Welcome "+ req.session.username +" </h1>"}
    } else {
        // Set error page
        content = {"html": "<h1>You do not have access to this page! Please <a href='/users/login'>Login</a></h1>"}
    }
    res.render('subpage', {title, content, menu:[],  logged: req.session.authenticated, user: req.session.username})
});
module.exports = router;