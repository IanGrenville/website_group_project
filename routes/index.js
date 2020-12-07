const express = require('express');
const router = express.Router();
const middleware = require("../middleware");
const common = require("../common.js");
const User = require('../models/User.js');
const Course = require('../models/Courses');
const Event = require('../models/Events');
const Subpage = require("../models/Subpage");
const News = require('../models/News');
const TechnicalReport = require('../models/TechnicalReport');
const Posting = require('../models/Posting');
const TAPosting = require('../models/TAPosting');
const Award = require('../models/Award');
const { Model, connection } = require('mongoose');
const bcrypt = require('bcrypt');
const Page = require('../models/Page');

router.get('/', (req, res) => {
    res.render('homepage', { logged: req.session.authenticated, username: req.session.username, theme: req.session.theme});
});

router.get('/dashboard', middleware.isAuthenticated, (req, res) => {
    // Set content

    User.findOne({ username: req.session.username }, (err, user) => {
        if (err) {
            console.error(err);
            res.send("error when accessing the User Database");
        } else {
            res.render('dashboard', { logged: req.session.authenticated, user: user, theme: req.session.theme})
        }
    });

});

/**
 * Settings route
 */
// Adding the settings route
router.get('/settings', middleware.isAuthenticated,  (req, res)=>{
    User.findOne({username: req.session.username})
        .then(user=>{
            if (user){
                // Evidently if the user is logged in, this path should be the only one to be executed
                const {username, email} = user;
                const title = "Settings";
                let dropdown =  `<option value="default">Default</option>
                <option value="dark">Dark</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="yellow">Yellow</option>`;
                content = {"html": "./partials/settings",  "script": "<script src='/js/settings.js'></script>"}
                
                res.render('user-layout', {
                    title,
                    content,
                    menu: [],
                    logged: req.session.authenticated,
                    user: req.session.username,
                    email: email,
                    theme: req.session.theme
                })
            } else {
                // This shouldn't occur if the user is logged in, but protecting against errors
                const title = "Error!";
                content = {"html": "./partials/user-error"}
                // Render a subpage with the error
                res.render('user-layout', {
                    title, 
                    content, 
                    menu: [],
                    logged: req.session.authenticated,
                    user: req.session.username,
                    theme: req.session.theme
                })
            }
        })
        .catch(err=>{
            console.log(err);
            const title = "Error!";
            content = {"html": "./partials/user-error"}
            // Render a subpage with the error
            res.render('user-layout', {
                title,
                content,
                menu: [],
                logged: req.session.authenticated,
                user: req.session.username,
                theme: req.session.theme
            });
        });
});


router.post('/settings', middleware.isAuthenticated, (req, res)=>{
    
    console.log("Received update for a user!");
    // This shouldn't occur if the user is logged in, but protecting against errors
    console.log(req.body);
    const mUser = req.session.username;
    const {username, password, confPassword, curPassword, email } = req.body;
    /**
     * @description Finds a user within the database
     * @param {String} username
     * @returns {Promise} 
     */
    function findUser(username){
        var errors = [];
        return new Promise((resolve, reject) => {
            User.findOne({username: username}, (err, user) =>{
                if (err){
                    console.error(err);
                    errors.push({msg: "Error during connection!"});
                    reject(errors);
                } else {
                    resolve(user);
                }
            })
        });
    }

    /**
     * @description updates a given users information
     * @param {User} user 
     * @returns {Promise}
     */
    function updateUser(user){
        return new Promise((resolve, reject) => {
            var errors = [];
            if (bcrypt.compareSync(curPassword, user.password)){
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
                        console.error(err);
                        errors.push({msg: 'Error during connection! Try again!'});
                        reject({errors, user});
                    }
                });
                resolve({success: {msg: "Successfully updated!"}, user});
            } else {
                errors.push({msg: 'Wrong password! Try again!'});
                reject({errors, user});
            }
        });
    }

    // Find and update user
    findUser(mUser)
        .then(user => {
            return updateUser(user)
        })
        .then(result => {
            // Success messages in success.msg
            const title = "Settings";
            content = {"html": "./partials/settings",  "script": "<script src='/js/settings.js'></script>"}
            // Render a settings page with the error
            const user = result.user;
            return res.render('user-layout', {
                title, 
                content, 
                menu: [], 
                logged: req.session.authenticated, 
                theme: req.session.theme, 
                user: req.session.username, 
                email: user.email
            });
        })
        .catch(result => {
            const title = "Settings";
            content = {"html": "./partials/settings",  "script": "<script src='/js/settings.js'></script>"}
            // Render a settings page with the error
            const user = result.user;
            console.log(result);
            const errors = result.errors;
            return res.render('user-layout', {
                title,
                content,
                menu: [],
                logged: req.session.authenticated, 
                theme: req.session.theme, 
                user: req.session.username, 
                email: user.email, 
                errors
            });
        });
});

/**
 * The search bar route.
 */
router.get('/search', (req, res) => {
    // Building Generic search of the site
    let searchQuery = {'$regex': req.query.searched, '$options': 'i'};
    const logged = req.session.authenticated;
    const username = req.session.username;
    let theme = req.session.theme;
    // Need to create a regex in order to match a query with a modelname, using first 2 words
    const query = req.query.searched;


    //functions which search each table within the database 
    const searchCourses = () =>common.getAllDataWithModel(Course, {$or: [
        {title: searchQuery},
        {description: searchQuery},
        {termsOffered: searchQuery},
        {instructor: searchQuery}
    ]});
    const searchSubpages = () =>common.getAllDataWithModel(Subpage, {$or: [
        {name: searchQuery},
        {html: searchQuery},
        {markdown: searchQuery}
    ]});
    const searchNews = () => common.getAllDataWithModel(News, {$or: [
        {type: searchQuery},
        {title: searchQuery},
        {contact: searchQuery},
        {description: searchQuery}
    ]});
    const searchAwards = () => common.getAllDataWithModel(Award, {$or: [
        {title: searchQuery},
        {contact: searchQuery},
        {recipient: searchQuery},
        {description: searchQuery}
    ]});
    const searchEvents = () => common.getAllDataWithModel(Event, {$or: [
        {title: searchQuery},
        {hostedBy: searchQuery},
        {eventType: searchQuery},
        {description: searchQuery}
    ]});
    const searchTAPosting = () => common.getAllDataWithModel(TAPosting, {$or: [
        {title: searchQuery},
        {contact: searchQuery},
        {semester: searchQuery},
        {description: searchQuery}
    ]});
    const searchPosting = () => common.getAllDataWithModel(Posting, {$or: [
        {title: searchQuery},
        {contact: searchQuery},
        {type: searchQuery},
        {description: searchQuery}
    ]});
    const searchTechRep = () => common.getAllDataWithModel(TechnicalReport, {$or: [
        {title: searchQuery},
        {contact: searchQuery},
        {creator: searchQuery},
        {description: searchQuery}
    ]});
    
    // Execute all the promises, receiving an array of responses.
    Promise.all([
        searchCourses(),
        searchSubpages(),
        searchNews(),
        searchAwards(),
        searchEvents(),
        searchTAPosting(),
        searchPosting(),
        searchTechRep()
    ])
        .then(result => {
            result.forEach((value) => {
                value.data.forEach(innerVal => {
                    innerVal.matchedString = ""
                    if (value.modelName == "courses"){
                        let strSplit = innerVal.title.split(' ');
                        innerVal.href = 'academic/courses?query=' + strSplit[0] + '+' + strSplit[1];
                        // Adding the necessary information to the description string
                        let desc = innerVal.title.concat([innerVal.termsOffered.toString(), innerVal.description, innerVal.instructor.toString()])
                        innerVal.description = desc;
                    } else if (value.modelName == 'news'){
                        innerVal.href = '/news/all';
                        let desc = innerVal.title.concat([ innerVal.contact, innerVal.type, innerVal.description])
                        innerVal.description = desc;
                    } else if (value.modelName == 'awards') {
                        innerVal.href = '/news/awards';
                        let desc = innerVal.title.concat([innerVal.contact, innerVal.recipient, innerVal.description])
                        innerVal.description = desc;
                    } else if (value.modelName == 'events') {
                        innerVal.href = '/news/events';
                        let desc = innerVal.title.concat([innerVal.hostedBy, innerVal.eventType, innerVal.description])
                        innerVal.description = desc;
                    } else if (value.modelName == 'taposting') {
                        innerVal.href = '/employment/student';
                        let desc = innerVal.title.concat([innerVal.contact, innerVal.creator, innerVal.description])
                        innerVal.description = desc;
                    } else if (value.modelName == 'posting') {
                        innerVal.href = '/employment/faculty';
                        let desc = innerVal.title.concat([ innerVal.contact, innerVal.type, innerVal.description])
                        innerVal.description = desc;
                    } else if (value.modelName == 'technicalreports') {
                        // Need t
                        innerVal.href = '/research/technicalreports';
                        let desc = innerVal.title.concat([ innerVal.contact, innerVal.creator, innerVal.description])
                        innerVal.description = desc;
                    } else if (value.modelName == 'subpages'){
                        innerVal.href = '/' + innerVal.path;
                        // Parse the HTML to create a description
                        if (innerVal.markdown == "")
                            innerVal.description = parseHTML(innerVal.html);
                        else
                            innerVal.description = parseMarkdown(innerVal.markdown);
                        innerVal.description.concat([innerVal.name]);
                    }
                    innerVal.matchedString += getMatchedDesc(innerVal.description, req.query.searched);
                });
            });
            // Providing all the necessary elements to render to searched page
            console.log(result);
            content = {
                html: './list/search',
                query: req.query.searched,
                data: result, script: "<script src='/js/search.js'></script>",
                searchQuery: "https://www.google.com/search?q=mcgill+computer+science+"+req.query.searched.replace(" ","+")
            };
            res.render('subpage', { title: "Search", menu: result.menu, content, logged, username, theme});
        })
        .catch(err => {
            console.error(err);
        });


});


/**
 * 
 * @param {String} descString
 * @param {String} expr
 */
function getMatchedDesc(descString, expr){
    console.log(descString);
    let indicies = [];
    let regex = new RegExp(expr, 'gi');
    var matched;
    while (null !=(matched = regex.exec(descString))){
        indicies.push(matched.index);
    }
    console.log(indicies);
    // Create the string
    let matchedString = '';
    for (let i = 0; i < indicies.length; i++){
        // Get 40 characters + length of expression
        let start = indicies[i] - 50;
        let end = indicies[i] + expr.length + 50;
        let sDots = false;
        let eDots =  false;
        if (start < 0)
            start = 0;
        else
            sDots = true;
        if (end > descString.length)
            end = descString.length;
        else
            eDots = true;
        if (i > 0 && i+1 < indicies.length){
            // fix overlapping indicies
            let prev = indicies[i-1] + expr.length + 50;
            let next = indicies[i+1] - 50;
            if ( start < prev ){
                sDots = false;
                start = start<indicies[i-1] + expr.length?indicies[i-1]+expr.length:start;
            }
            if (end > next){
                end -= (end - next);
                end = end<indicies[i]+expr.length?indicies[i]+expr.length:end;
                eDots = false;
            }
        } else if (i > 0){
            let prev = indicies[i-1] + expr.length + 50;
            if ( start < prev){
                sDots = false;
                start = start<indicies[i-1] + expr.length?indicies[i-1]+expr.length:start;
            }
        } else if (i+1 < indicies.length) {
            let next = indicies[i+1] - 50;
            if (end > next){
                end -= (end - next);
                end = end<indicies[i]+expr.length?indicies[i]+expr.length:end;
                eDots = false;
            }
        }
        // build strings
        let startString = sDots?"..."+descString.slice(start, indicies[i]):descString.slice(start, indicies[i]);
        let matched = descString.slice(indicies[i], indicies[i]+expr.length);
        let endString = eDots?descString.slice(indicies[i] + expr.length, end)+"...":descString.slice(indicies[i] + expr.length, end);
        matchedString += startString + "<b>" + matched + "</b>" + endString;
        console.log(matchedString);
    }
    return matchedString;
}   


/**
 * @description Parse a html string and return the string without the html tags 
 * @param {String} string HTML code
 * @returns {String}
 */
function parseHTML(string){
    var inTag = false;
    let parsedString = '';
    for (let i  = 0; i < string.length; i++){
        if (!inTag && string.charAt(i) == '<'){
            inTag = true;
        } else if (inTag && string.charAt(i) == '>') {
            inTag = false;
        } else if (!inTag){
            if (string.charAt(i) != '\n' && string.charAt(i) != '\t')
                parsedString += string.charAt(i);
        }
    }
    // Remove all the extra spaces
    let regex = new RegExp('\\s+',"gi");
    parsedString = parsedString.replace(regex, ' ');
    return parsedString;
}

function parseMarkdown(markdownText){
    let parsedString = '';
    for (let i  = 0; i < markdownText.length; i++){
        if (!isMarkdownTag(markdownText.charAt(i))){
            if (markdownText.charAt(i) != '\n' && markdownText.charAt(i) != '\r' && markdownText.charAt(i) != '\r')
                parsedString += markdownText.charAt(i);
        }
    }
    return parsedString;
}
/**
 * @description Matches markdown tag with characters
 * @param {String} char
 * @returns {Boolean}
 */
function isMarkdownTag(char){
    // Need to know markdown tags
    let tags = ['#'];
    for (let tag of tags){
        if (char == tag){
            return true;
        }
    }
    return false;
}

module.exports = router;