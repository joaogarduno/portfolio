const navSlide = () => {
    const burger = document.querySelector('.nav__burger');
    const nav = document.querySelector('.nav__menu')

    burger.addEventListener('click', () => {
        // TOGGLE NAV
        nav.classList.toggle('nav-active');
        // BURGER ANIMATION
        burger.classList.toggle('toggle');
    });
}
navSlide();