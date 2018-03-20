function visible (x) {
    var top_of_element = $(x).offset().top;
    var bottom_of_element = $(x).offset().top + $(x).outerHeight();
    var bottom_of_screen = $(window).scrollTop() + window.innerHeight;
    var top_of_screen = $(window).scrollTop();

    if((bottom_of_screen > bottom_of_element) && (top_of_screen < top_of_element)){
        return true;
    }
    else {
        return false;
    }
}

function playing (x) {
    return !!(x.currentTime > 0 && !x.paused && !x.ended && x.readyState > 2);
}