/* ========================================================================
       JAVASCRIPT (Vanilla)  ·  Código modular, comentado y optimizado
       ------------------------------------------------------------------------
       Cada funcionalidad vive en su propio módulo (patrón de función). Todo se
       inicializa al final, cuando el DOM está listo.
       ======================================================================== */
    (function () {
      'use strict';

      /* Detecta si el usuario prefiere movimiento reducido (accesibilidad).
         Se usa para desactivar autoplay y parallax. */
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      /* Utilidades cortas */
      var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
      var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

      /* --------------------------------------------------------------------
         MÓDULO 1 · Header sticky
         Añade una clase al hacer scroll para compactar y opacar el header.
         -------------------------------------------------------------------- */
      function initStickyHeader() {
        var header = $('#header');
        if (!header) return;
        var onScroll = function () {
          header.classList.toggle('is-scrolled', window.scrollY > 30);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
      }

      /* --------------------------------------------------------------------
         MÓDULO 2 · Menú móvil
         Panel lateral accesible: gestiona aria-expanded, bloqueo de scroll,
         cierre con Escape, clic en la capa oscura o en un enlace.
         -------------------------------------------------------------------- */
      function initMobileMenu() {
        var toggle  = $('#navToggle');
        var nav     = $('#nav');
        var overlay = $('#navOverlay');
        if (!toggle || !nav || !overlay) return;

        // Enlaces enfocables dentro del panel (para mover y atrapar el foco)
        var focusables = $$('.nav__link', nav);
        var firstFocusable = focusables[0];
        var lastFocusable = focusables[focusables.length - 1];

        var open = function () {
          nav.classList.add('is-open');
          overlay.hidden = false;
          requestAnimationFrame(function () { overlay.classList.add('is-open'); });
          toggle.setAttribute('aria-expanded', 'true');
          toggle.setAttribute('aria-label', 'Cerrar menú de navegación');
          document.body.style.overflow = 'hidden';
          // Accesibilidad: al abrir, el foco entra en el panel. Se hace en el
          // siguiente frame para asegurar que 'visibility:visible' ya se aplicó
          // (un elemento invisible no puede recibir el foco).
          if (firstFocusable) requestAnimationFrame(function () { firstFocusable.focus(); });
        };
        var close = function (returnFocus) {
          nav.classList.remove('is-open');
          overlay.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Abrir menú de navegación');
          document.body.style.overflow = '';
          setTimeout(function () { overlay.hidden = true; }, 350);
          // Devuelve el foco al botón que abrió el panel (salvo que se pida lo contrario)
          if (returnFocus !== false) toggle.focus();
        };
        var isOpen = function () { return nav.classList.contains('is-open'); };

        toggle.addEventListener('click', function () { isOpen() ? close() : open(); });
        overlay.addEventListener('click', function () { close(); });
        // Cierra al pulsar un enlace (sin devolver el foco: el usuario va a la sección)
        focusables.forEach(function (link) { link.addEventListener('click', function () { close(false); }); });

        // Teclado dentro del panel: Escape cierra; Tab queda atrapado (focus trap)
        document.addEventListener('keydown', function (e) {
          if (!isOpen()) return;
          if (e.key === 'Escape') { close(); return; }
          if (e.key === 'Tab') {
            // Ciclo del foco entre el primer y el último elemento enfocable
            if (e.shiftKey && document.activeElement === firstFocusable) {
              e.preventDefault(); lastFocusable.focus();
            } else if (!e.shiftKey && document.activeElement === lastFocusable) {
              e.preventDefault(); firstFocusable.focus();
            }
          }
        });
        // Si se agranda la ventana, resetea el estado del panel
        window.addEventListener('resize', function () { if (window.innerWidth > 760 && isOpen()) close(false); });
      }

      /* --------------------------------------------------------------------
         MÓDULO 3 · Slider del Hero (crossfade)
         Rotación de mensajes con autoplay, flechas, puntos, teclado, gestos
         táctiles y pausa al interactuar. Respeta "prefers-reduced-motion".
         -------------------------------------------------------------------- */
      function initHeroSlider() {
        var root   = $('#heroSlider');
        if (!root) return;
        var slides = $$('.hero__slide', root);
        var dotsBox = $('#heroDots');
        var live   = $('#sliderLive');
        var prevBtn = $('#heroPrev');
        var nextBtn = $('#heroNext');
        var total  = slides.length;
        var index  = 0;
        var timer  = null;
        var DELAY  = 6000;

        // Genera los puntos indicadores dinámicamente (botones simples y accesibles)
        var dots = slides.map(function (_, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'slider-dot' + (i === 0 ? ' is-active' : '');
          b.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1));
          b.addEventListener('click', function () { go(i); restart(); });
          dotsBox.appendChild(b);
          return b;
        });

        // Muestra la diapositiva n y actualiza estado + accesibilidad
        function go(n) {
          index = (n + total) % total;
          slides.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
          dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
          if (live) live.textContent = 'Diapositiva ' + (index + 1) + ' de ' + total;
        }
        var next = function () { go(index + 1); };
        var prev = function () { go(index - 1); };

        // Autoplay (desactivado si el usuario prefiere menos movimiento)
        function play()  { if (!reduceMotion) timer = setInterval(next, DELAY); }
        function stop()  { clearInterval(timer); }
        function restart() { stop(); play(); }

        // Flechas
        nextBtn.addEventListener('click', function () { next(); restart(); });
        prevBtn.addEventListener('click', function () { prev(); restart(); });

        // Teclado: flechas izquierda/derecha cuando el slider tiene foco
        root.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { next(); restart(); }
          if (e.key === 'ArrowLeft')  { prev(); restart(); }
        });

        // Pausa el autoplay al pasar el cursor o al enfocar (accesibilidad)
        root.addEventListener('mouseenter', stop);
        root.addEventListener('mouseleave', play);
        root.addEventListener('focusin', stop);
        root.addEventListener('focusout', play);
        // Pausa cuando la pestaña no está visible (ahorra recursos)
        document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });

        // Gestos táctiles (swipe) para móvil
        addSwipe(root, next, prev);

        play();
      }

      /* --------------------------------------------------------------------
         MÓDULO 4 · Carrusel de Proyectos (deslizante y responsivo)
         Muestra 1 / 2 / 3 tarjetas según el ancho. Flechas, puntos por página,
         swipe táctil y recálculo al redimensionar.
         -------------------------------------------------------------------- */
      function initProjectsCarousel() {
        var root  = $('#projCarousel');
        if (!root) return;
        var track = $('#projTrack');
        var items = $$('.project', track);
        var dotsBox = $('#projDots');
        var prevBtn = $('#projPrev');
        var nextBtn = $('#projNext');
        var page = 0, perView = 3, pages = 1, dots = [];

        // Determina cuántas tarjetas caben según el breakpoint
        function calcPerView() {
          var w = window.innerWidth;
          return w <= 560 ? 1 : (w <= 900 ? 2 : 3);
        }

        // (Re)construye el carrusel: variables CSS, páginas y puntos
        function build() {
          perView = calcPerView();
          root.style.setProperty('--slides-per-view', perView);
          pages = Math.ceil(items.length / perView);
          if (page > pages - 1) page = pages - 1;

          dotsBox.innerHTML = '';
          dots = [];
          for (var i = 0; i < pages; i++) {
            (function (i) {
              var b = document.createElement('button');
              b.type = 'button';
              b.className = 'slider-dot' + (i === page ? ' is-active' : '');
              b.setAttribute('aria-label', 'Grupo de proyectos ' + (i + 1));
              b.addEventListener('click', function () { page = i; update(); });
              dotsBox.appendChild(b);
              dots.push(b);
            })(i);
          }
          update();
        }

        // Aplica la traslación y refresca estados (puntos y flechas)
        function update() {
          // El paso real por página es el ancho del viewport (100%) MÁS el gap que
          // separa una página de la siguiente; si no, se acumula un desfase.
          track.style.transform = 'translateX(calc(-' + page + ' * (100% + var(--gap))))';
          dots.forEach(function (d, i) { d.classList.toggle('is-active', i === page); });
          // Deshabilita flechas en los extremos (feedback visual)
          prevBtn.disabled = page === 0;
          nextBtn.disabled = page === pages - 1;
          prevBtn.style.opacity = page === 0 ? '.4' : '1';
          nextBtn.style.opacity = page === pages - 1 ? '.4' : '1';
        }

        var next = function () { if (page < pages - 1) { page++; update(); } };
        var prev = function () { if (page > 0) { page--; update(); } };

        nextBtn.addEventListener('click', next);
        prevBtn.addEventListener('click', prev);
        addSwipe(root, next, prev);

        // Recalcula al redimensionar (con "debounce" para no saturar)
        var t;
        window.addEventListener('resize', function () {
          clearTimeout(t);
          t = setTimeout(build, 180);
        });

        build();
      }

      /* --------------------------------------------------------------------
         Utilidad · Detección de "swipe" táctil reutilizable
         Llama onLeft() al deslizar a la izquierda y onRight() a la derecha.
         -------------------------------------------------------------------- */
      function addSwipe(el, onLeft, onRight) {
        var startX = 0, startY = 0, tracking = false;
        el.addEventListener('touchstart', function (e) {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          tracking = true;
        }, { passive: true });
        el.addEventListener('touchend', function (e) {
          if (!tracking) return;
          tracking = false;
          var dx = e.changedTouches[0].clientX - startX;
          var dy = e.changedTouches[0].clientY - startY;
          // Solo cuenta como swipe horizontal si supera el umbral y no es vertical
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            dx < 0 ? onLeft() : onRight();
          }
        }, { passive: true });
      }

      /* --------------------------------------------------------------------
         MÓDULO 5 · Scroll Reveal (aparición al hacer scroll)
         Usa IntersectionObserver (más eficiente que escuchar 'scroll').
         -------------------------------------------------------------------- */
      function initScrollReveal() {
        var els = $$('.reveal');
        if (!els.length) return;

        // Si no hay soporte o se prefiere menos movimiento: mostrar todo ya
        if (reduceMotion || !('IntersectionObserver' in window)) {
          els.forEach(function (el) { el.classList.add('is-visible'); });
          return;
        }

        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target); // una sola vez
            }
          });
        }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

        els.forEach(function (el) { io.observe(el); });
      }

      /* --------------------------------------------------------------------
         MÓDULO 6 · Parallax del Hero
         Mueve las formas decorativas según el scroll. Optimizado con
         requestAnimationFrame y desactivado en móvil / movimiento reducido.
         -------------------------------------------------------------------- */
      function initParallax() {
        if (reduceMotion || window.innerWidth < 760) return;
        var layers = $$('[data-parallax]');
        if (!layers.length) return;
        var ticking = false;

        function render() {
          var y = window.scrollY;
          layers.forEach(function (layer) {
            var speed = parseFloat(layer.getAttribute('data-parallax')) || 0;
            layer.style.transform = 'translate3d(0,' + (y * speed) + 'px,0)';
          });
          ticking = false;
        }
        window.addEventListener('scroll', function () {
          if (!ticking) { requestAnimationFrame(render); ticking = true; }
        }, { passive: true });
      }

      /* --------------------------------------------------------------------
         MÓDULO 7 · Navegación activa
         Resalta el enlace del menú según la sección visible (aria-current).
         -------------------------------------------------------------------- */
      function initActiveNav() {
        var links = $$('.nav__link[href^="#"]');
        var map = {};
        var sections = [];
        links.forEach(function (link) {
          var id = link.getAttribute('href').slice(1);
          var sec = document.getElementById(id);
          if (sec) { map[id] = link; sections.push(sec); }
        });
        if (!sections.length || !('IntersectionObserver' in window)) return;

        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              links.forEach(function (l) { l.removeAttribute('aria-current'); });
              var active = map[entry.target.id];
              if (active) active.setAttribute('aria-current', 'true');
            }
          });
        }, { rootMargin: '-45% 0px -50% 0px' });

        sections.forEach(function (s) { io.observe(s); });
      }

      /* --------------------------------------------------------------------
         MÓDULO 8 · Barra de balance (elemento firma)
         Anima el llenado cuando el hero es visible.
         -------------------------------------------------------------------- */
      function initBalanceBar() {
        var bar = $('#balanceBar');
        if (!bar) return;
        if (reduceMotion || !('IntersectionObserver' in window)) { bar.classList.add('is-filled'); return; }
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { bar.classList.add('is-filled'); io.disconnect(); }
          });
        }, { threshold: 0.4 });
        io.observe(bar);
      }

      /* --------------------------------------------------------------------
         MÓDULO 9 · Botón "volver arriba"
         -------------------------------------------------------------------- */
      function initToTop() {
        var btn = $('#toTop');
        if (!btn) return;
        window.addEventListener('scroll', function () {
          btn.classList.toggle('is-visible', window.scrollY > 600);
        }, { passive: true });
        btn.addEventListener('click', function () {
          window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
      }

      /* --------------------------------------------------------------------
         MÓDULO 10 · Validación del formulario de contacto
         Validación en cliente, accesible (aria-invalid + mensajes de error).
         Nota: el envío real requiere conectar un backend o servicio (Formspree,
         EmailJS, etc.). Aquí se simula el éxito para demostrar la UX.
         -------------------------------------------------------------------- */
      function initContactForm() {
        var form = $('#contactForm');
        if (!form) return;
        var status = $('#formStatus');
        var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Marca o limpia el estado de error de un campo
        function setError(input, on) {
          var field = input.closest('.field');
          field.classList.toggle('has-error', on);
          input.setAttribute('aria-invalid', on ? 'true' : 'false');
        }

        // Valida un campo individual y devuelve true/false
        function validate(input) {
          var v = input.value.trim();
          var ok = true;
          if (input.id === 'email') ok = emailRe.test(v);
          else if (input.id === 'message') ok = v.length >= 10;
          else ok = v.length > 0;
          setError(input, !ok);
          return ok;
        }

        var inputs = $$('input, textarea', form);
        // Limpia el error en cuanto el usuario corrige
        inputs.forEach(function (input) {
          input.addEventListener('input', function () {
            if (input.closest('.field').classList.contains('has-error')) validate(input);
          });
        });

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var allOk = true;
          var firstInvalid = null;
          inputs.forEach(function (input) {
            var ok = validate(input);
            if (!ok && !firstInvalid) firstInvalid = input;
            allOk = allOk && ok;
          });

          if (!allOk) {
            status.textContent = 'Revisa los campos marcados en rojo.';
            status.classList.remove('is-ok');
            if (firstInvalid) firstInvalid.focus(); // lleva el foco al primer error
            return;
          }

          // --- Envío simulado (sustituir por fetch() a tu backend) ---
          status.textContent = '¡Gracias! Tu mensaje se ha enviado correctamente. Te responderé pronto.';
          status.classList.add('is-ok');
          form.reset();
        });
      }

      /* --------------------------------------------------------------------
         MÓDULO 11 · Foco en la sección destino (accesibilidad de teclado)
         Al pulsar un enlace interno, tras el desplazamiento suave (que gestiona
         el CSS) el foco se mueve a la sección para que la navegación por teclado
         continúe desde ahí y no se quede en el enlace.
         -------------------------------------------------------------------- */
      function initAnchorFocus() {
        $$('a[href^="#"]').forEach(function (link) {
          link.addEventListener('click', function () {
            var id = link.getAttribute('href').slice(1);
            if (!id) return;
            var target = document.getElementById(id);
            if (!target) return;
            // tabindex=-1 permite enfocar un contenedor no interactivo sin
            // incluirlo en el orden normal de tabulación.
            if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
            // preventScroll evita un salto brusco que competiría con el scroll suave.
            setTimeout(function () { target.focus({ preventScroll: true }); }, 0);
          });
        });
      }

      /* --------------------------------------------------------------------
         MÓDULO 12 · Año dinámico en el footer
         -------------------------------------------------------------------- */
      function initYear() {
        var el = $('#year');
        if (el) el.textContent = new Date().getFullYear();
      }

      /* --------------------------------------------------------------------
         INICIALIZACIÓN GENERAL  ·  cuando el DOM está listo
         -------------------------------------------------------------------- */
      function init() {
        initStickyHeader();
        initMobileMenu();
        initHeroSlider();
        initProjectsCarousel();
        initScrollReveal();
        initParallax();
        initActiveNav();
        initBalanceBar();
        initToTop();
        initContactForm();
        initAnchorFocus();
        initYear();
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();