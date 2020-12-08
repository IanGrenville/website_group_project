const express = require('express');
const router = express.Router();
const common = require("../common.js");
const Event = require('../models/Events');

router.get('/all', (req, res) => {
    var title = "Events";
    var menu = [['events/all', 'All'], ['events/colloquium', 'Colloquia'], ['events/seminar', 'Seminars']];
    const logged = req.session.authenticated;
    const username = req.session.username;

    common.getAllDataFrom(Event).then(events => {
        //res.send("request received !");
        var content = { html: './list/events', data: events };
        res.render('subpage.ejs', { type: req.params.pagename, title, menu, content, logged, username, theme: req.session.theme });
    }).catch(err => {
        console.error(err);
        res.send(err);
    });

});

router.get('/:pagename', (req, res) => {
    var title = "Events";
    var menu = [['events/all', 'All'], ['events/colloquium', 'Colloquia'], ['events/seminar', 'Seminars']];
    const logged = req.session.authenticated;
    const username = req.session.username;

    common.getAllDataWith(Event, { eventType: req.params.pagename }).then(events => {
        var content = { html: './list/events', data: events };
        res.render('subpage.ejs', { type: req.params.pagename, title, menu, content, logged, username, theme: req.session.theme });
    }).catch(err => {
        console.error(err);
        res.send(err);
    });

});

module.exports = router;