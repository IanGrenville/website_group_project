window.onscroll = function () {
    
    var navbar = document.querySelector("nav");
    var video = document.getElementById("background-video");
    
    //make the header disappear once it encounters the navbar
    if (window.pageYOffset> video.offsetHeight) {
        document.documentElement.style.setProperty('--top-header', '-80px');
        navbar.classList.add("fixed-top");
    } else {
        document.documentElement.style.setProperty('--top-header', '0');
        navbar.classList.remove("fixed-top");
    }

    //animation that makes the header log move horizontally when scrolling
    var headLogo = document.getElementById("logo-header");
    headLogo.setAttribute("style", "transform: translate(-" + (window.pageYOffset>365?365:window.pageYOffset) + "px);" );

}