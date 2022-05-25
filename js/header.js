window.addEventListener("scroll", function(){
    var header = document.querySelector(".headerContent");
    header.classList.toggle('scroll-down', window.scrollY > 0);
})