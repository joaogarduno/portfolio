const navSlide = () => {
    const burger = document.querySelector('.header__burger');
    const nav = document.querySelector('.header__nav');

    burger.addEventListener('click', () => {
        // TOGGLE NAV
        nav.classList.toggle('nav-active');
        // BURGER ANIMATION
        burger.classList.toggle('toggle');
    });
}
navSlide();