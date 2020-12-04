
var aClass;
const courseSelector = document.getElementById('course-select');
const courseBox = document.getElementById('response-container');

window.onload = () => {
    aClass = courseSelector.value;
}
// Listen for new class selection
courseSelector.addEventListener('change', () => {
        if (aClass != courseSelector.value) aClass = courseSelector.value;
});

/**
 * @description Creates an element from a JSON which contains an array
 * @param {JSON} pJson 
 * @returns {HTMLElement}
 */
function createElementFromArray(pJson){
    let contentDiv = document.createElement(pJson.type);
    contentDiv.innerHTML = pJson.text;
    for (var i = 0; i < pJson.content.length; i++ ){
        contentDiv.innerHTML += pJson.content[i];
        if (i+1 < pJson.content.length) contentDiv.innerHTML += ", "
    }
    contentDiv.className = pJson.class;
    contentDiv.setAttribute('level', pJson.level)
    return contentDiv;
}
/**
 * @description Creates an element from a JSON
 * @param {JSON} pJson 
 * @returns {HTMLElement}
 */
function createAnElement(pJson){
    let contentDiv = document.createElement(pJson.type);
    if (pJson.type == 'a') {
        contentDiv.href = pJson.ref;
        contentDiv.target = '_blank';
    }
    contentDiv.innerHTML = pJson.content;
    contentDiv.className = pJson.class;
    contentDiv.setAttribute('level', pJson.level)
    return contentDiv;
}

/**
 * @description Appends a new node within a course box following a defined layout
 * @param {HTMLElement} parentNode 
 * @param {HTMLElement} newNode 
 */
function buildCourseLayout(parentNode, newNode){
    var added = false;
    for (var i  = 0; i < parentNode.children.length; i++){
        if (parseInt(newNode.getAttribute('level')) < parseInt(parentNode.children[i].getAttribute('level'))){
            parentNode.insertBefore(newNode, parentNode.children[i]);
            added = true;
            break;
        }
    }
    if(!added)
        parentNode.appendChild(newNode);
}

/**
 * @description Creates an HTMLElement to be appended to the page.
 * @param {JSON} content
 * @param {HTMLElement} target
 */
function createCourse(content, target){
    const aCardDiv = document.createElement('div');
    aCardDiv.className = 'card card-body';
    for (var key of Object.keys(content)){
        var contentDiv = null;
        if (key == "syllabus" || key == 'mcgillCalendar'){
            var pContent = key.slice(0,1).toUpperCase() + key.slice(1)
            var level = 8;
            if (key == "mcgillCalendar") {
                level = 9;
                pContent = pContent.slice(0, 2) + pContent.slice(2,3).toUpperCase() + pContent.slice(3,6) + " " + pContent.slice(6);
            };
            contentDiv = createAnElement({type: 'a', content: pContent, ref: content[key], class:'card-text', level: level});
        } else if (key == "instructor"){
            contentDiv = createElementFromArray({content: content[key], text: "Instructor(s): ", type: 'p', class:'card-text', level: 4});
        } else if (key == "termsOffered"){
            contentDiv = createElementFromArray({content: content[key], text: "Terms: ", type: 'p', class:'card-text', level: 3});
        } else if ((key == "prerequisites" || key=="restrictions" || key=='notes' || key=="credits") && content[key] != 'none'){
            var pContent = key.slice(0,1).toUpperCase() + key.slice(1) + ": " + content[key];
            var level = 7;
            if (key == "credits") level = 2;
            else if (key == "prerequisites") level = 5;
            else if (key == "restrictions") level = 6;
            contentDiv = createAnElement({type: 'p', content: pContent, class:'card-text', level: level});
        } else if (key == 'title'){
            contentDiv = createAnElement({type:'h3', content: content[key], class:'card-text', level: 0});
        } else if (key == 'description'){
            contentDiv = createAnElement({type: 'p', content: content[key], class:'card-text', level: 1});
        }
        if (contentDiv != undefined) buildCourseLayout(aCardDiv, contentDiv);
    }
    if (target.firstChild == null){
        target.appendChild(aCardDiv);
    } else {
        target.insertBefore(aCardDiv, target.firstChild);
    }
}
/**
 * @description Displays an error using the frontendAPI Popup Error
 * @param {Error} err 
 */
function displayError(err, targetHeader){
    // target Header is the element to latch onto in order
    createPopupMsg('error', err, targetHeader);
}

/**
 * @description Function call to the API on the backend to get the course element. Adds the course to the page or displays error
 */
function getClass() {
    const pOpts = {type: "GET", url: '/api/getCourse?class='+aClass, contentType: "None"}
    callBackEnd(pOpts)
        .then( response => {
            if (response.status == 0){
                console.log(response);
                createCourse(response.response, courseBox);
            } else {
                displayError(response.response, 'coursesHeader');
            }
            
        })
        .catch( err => {
            console.error(err);
            displayError(response.response, 'coursesHeader');
        });
}
