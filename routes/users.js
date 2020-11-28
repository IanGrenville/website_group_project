const express = require('express');
const router = express.Router();
const app = express();
const bcrypt = require('bcrypt');
const User = require('../models/User.js');

app.use(express.json());
app.use(express.urlencoded({extended: true}));

router.get('/login', (req, res)=>{
    if (!req.session.authenticated){
        const title = "Login";
        const content = {"html": 'login.ejs', "script":""};
        const menu = [];
        return res.render('user-layout', {title, menu, content, logged: req.session.authenticated, user: req.session.username});
    } else {
        return res.redirect('/');
    }
    
});
router.get('/register', (req, res)=>{
    if (!req.session.authenticated){
        const title = "Register";
        const content = {"html": 'register.ejs', "script": "<script src='/js/register.js'></script>"};
        return res.render('user-layout', {title, content, logged: req.session.authenticated, user: req.session.username});
    } else {
        return res.redirect('/');
    }
});

router.post('/login', (req, res)=> {
    var username = req.body.username;
    var password = req.body.password;
    var errors = [];
    const title = "Login";
    const content = {"html": 'login.ejs', "script":""};
    User.findOne({username: username}, (err,user) => {
        if(err){ 
            console.log(err);
        }else if(user){
            var authenticated = bcrypt.compareSync(password,user.password);
            if(authenticated){
                console.log("User "+ username + " succesfully logged in.");
                // Saving the username into the session, potentially not the greatest solution, but works for now
                req.session.username = username;
                req.session.authenticated = true;
                return res.redirect("/dashboard");
            } else {
                console.log("User "+username + " failed to log in.");
                errors.push({msg: "Wrong username or password!"});
            }
        } else {
            console.log("No user with Username: " + username + " found.");
            errors.push({msg: "Wrong username or password!"});
        }
        return res.render('user-layout', {
            title, 
            menu: [],
            content,
            logged: req.session.authenticated,
            user: req.session.username,
            errors
        });
    }).catch(err=>console.log(err));
});

/**
 * Registration Route
 */
router.post('/register', (req, res)=> {
    // Is there  a reason for doing it this way?
    var password = bcrypt.hashSync(req.body.password,10);
    const username = req.body.username;
    const email = req.body.email;
    const title = "Register";
    var content = {
            "html": 'register.ejs', 
            "script": "<script src='/js/register.js'></script>"
        };
    var errors = [];
    // User query from database
    User.find({$or: [{name: username},{email: email}]}, (err, result)=>{
        if (err) console.log(err);
        else console.log(result)
    }).then(user=>{
        //console.log(user);
        if (user.length > 0){
            user.forEach(item=>{
                if (item.email == email){
                    errors.push({msg: "Email already registered!"});
                }
                if (item.username == username){
                    errors.push({msg: "Username already registered!"});
                }
                console.log(item, email, username);
            });
            return res.render('user-layout', {
                title, 
                content,
                logged: req.session.authenticated,
                user: req.session.user,
                errors
            });
        } else{
            // The data has passed the data verification system. Enter it into the database
            var user = new User({
                username: username,
                email: req.body.email,
                password: password,
                userType: 0
            });
            user.save((err) => {
                if(err) {console.log(err);}
            });
            console.log("User was added to the database!!")
        }
        return res.redirect('/users/register');
    }).catch(err=>console.log(err));
});


// Adding the settings route
router.get('/settings', (req, res)=>{
    if (req.session.authenticated){
        User.findOne({username: req.session.username})
            .then(user=>{
                if (user){
                    // Evidently if the user is logged in, this path should be the only one to be executed
                    const {username, email} = user;
                    const title = "Settings";
                    content = {"html": "settings",  "script": "<script src='/js/settings.js'></script>"}
                    // Render a subpage with the error
                    res.render('user-layout', {title, content, menu: [], logged: req.session.authenticated, user: req.session.username, email: email})
                } else {
                    // This shouldn't occur if the user is logged in, but protecting against errors
                    const title = "Error!";
                    content = {"html": "user-error"}
                    // Render a subpage with the error
                    res.render('user-layout', {title, content, menu: [], logged: req.session.authenticated, user: req.session.username})
                }
            })
            .catch(err=>{
                console.log(err);
                const title = "Error!";
                content = {"html": "user-error"}
                // Render a subpage with the error
                res.render('user-layout', {title, content, menu: [], logged: req.session.authenticated, user: req.session.username})
            });
    } else {
        // Set error page
        const title = "Error!";
        content = {"html": "<h1>You do not have access to this page! Please <a href='/users/login'>Login</a> to view this content</h1>"}
        // Render a subpage with the error
        res.render('subpage', {title, content, menu: [], logged: req.session.authenticated, user: req.session.username,})
    }
});


router.post('/settings', (req, res)=>{
    var errors = [];
    if (req.session.authenticated){
        console.log("Received update for a user!");
        // This shouldn't occur if the user is logged in, but protecting against errors
        console.log(req.body);
        const mUser = req.session.username;
        const {username, password, confPassword, curPassword, email } = req.body;
        User.findOne({username: mUser}, (err,user) => {
            if(err){ 
                console.log(err);
            }else if(user){
                var authenticated = bcrypt.compareSync(curPassword, user.password);
                if(authenticated){
                    console.log("User "+ mUser + " entered the correct password, changing information now!");
                    // update the users information
                    if (username != user.username && username != '') {
                        user.username = username;
                        req.session.username = username;
                    }
                    if ( user.email != email && email != '') user.email = email
                    if (password != '' && confPassword != '') {
                        // update the passwords
                        const mPass = bcrypt.hashSync(req.body.password,10);
                        user.password = mPass;
                    }
                    // Saving the username into the session, potentially not the greatest solution, but works for now
                    req.session.authenticated = true;
                    user.save((err) =>{
                        if (err) { 
                            console.log(err);
                            const title = "Error!";
                            content = {"html": "user-error"}
                            // Render a subpage with the error
                            return res.render('user-layout', {title, content, menu: [], logged: req.session.authenticated, user: req.session.username})
                        }
                    })
                    const title = "Settings";
                    content = {"html": "settings",  "script": "<script src='/js/settings.js'></script>"}
                    // Render a settings page with the error
                    return res.render('user-layout', {title, content, menu: [], logged: req.session.authenticated, user: req.session.username, email: user.email})
                } else {
                    console.log("User "+ username + " entered the incorrect password.");
                    errors.push({msg: 'Wrong password! try again!'});
                    const title = "Settings";
                    content = {"html": "settings",  "script": "<script src='/js/settings.js'></script>"}
                    // Render a settings page with the error
                    return res.render('user-layout', {title, content, menu: [], logged: req.session.authenticated, user: req.session.username, email: user.email, errors})
                }
            } else {
                console.log("No user with Username: " + username + " found.");
                const title = "Error!";
                content = {"html": "user-error"}
                // Render a subpage with the error
                return res.render('user-layout', {title, content, menu: [], logged: req.session.authenticated, user: req.session.username})
            }
        });
    } else {
        // Set error page
        const title = "Error!";
        content = {"html": "<h1>You do not have access to this page! Please <a href='/users/login'>Login</a> to view this content</h1>"}
        // Render a subpage with the error
        res.render('subpage', {title, content, menu: [], logged: req.session.authenticated, user: req.session.username,})
    }
});

/** 
 * Logout Route
 * Can be accessed by the user if they know the route, but nothing will happen if they do not have an active session
*/
router.get("/logout", (req, res)=>{
    // Check if authenticated session exists. 
    if (req.session.authenticated){
        req.session.destroy();
        console.log("Successfully logged out. Redirecting");
    } else {
        console.log("Session not authenticated");
    }
    res.redirect("/");
});


module.exports = router;