const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== 1. Dark / Light theme =====
const themeBtn = document.getElementById('themeToggle');

function updateThemeIcon() {
    themeBtn.textContent = root.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
}
updateThemeIcon();

themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon();
});

// ===== 2. Mobile menu =====
const menuBtn = document.getElementById('menuToggle');
const nav = document.getElementById('nav');

menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => nav.classList.remove('open'))
);

// ===== 3. Scroll progress line + scroll-to-top button =====
const progress = document.getElementById('progress');
const scrollBtn = document.getElementById('scrollTop');

function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--p', max > 0 ? y / max : 0);
    scrollBtn.classList.toggle('show', y > 400);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== 4. Section heading line draws when visible =====
const headObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                headObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.25 }
);

document.querySelectorAll('.sec-head, .timeline').forEach((el) => headObserver.observe(el));

// ===== 5. Highlight current section in the nav (scroll spy) =====
const navLinks = [...document.querySelectorAll('.nav a')];
const spy = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                navLinks.forEach((a) =>
                    a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id)
                );
            }
        });
    },
    { rootMargin: '-45% 0px -50% 0px' }
);
document.querySelectorAll('main section[id]').forEach((s) => spy.observe(s));

// ===== 6. Hero: typing JSON response =====
function highlight(json) {
    // আগে HTML escape (ডেটা ডেটাবেস থেকে আসে, তাই নিরাপত্তার জন্য জরুরি)
    const safe = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return safe.replace(/("[^"]*")(\s*:)?|\b(\d+)\b/g, (m, str, colon, num) => {
        if (str) return colon ? `<span class="k">${str}</span>${colon}` : `<span class="s">${str}</span>`;
        return `<span class="n">${num}</span>`;
    });
}

const resp = document.getElementById('resp');
if (resp) {
    const body = resp.querySelector('pre');
    const data = JSON.parse(resp.dataset.json);

    // array গুলো এক লাইনে আনা হচ্ছে, নইলে কার্ড অনেক লম্বা হয়ে যেত
    const text = JSON.stringify(data, null, 2).replace(/\[([^\]]*)\]/g, (m, inner) =>
        '[' + inner.replace(/\s*\n\s*/g, ' ').trim() + ']'
    );

    const finish = () => {
        body.innerHTML = highlight(text);
        resp.classList.add('done');
    };

    if (reduceMotion) {
        finish();
    } else {
        let i = 0;
        setTimeout(function tick() {
            body.textContent = text.slice(0, ++i);
            if (i < text.length) setTimeout(tick, 22);
            else finish();
        }, 900);
    }
}

// ===== 7. Hero photo 3D tilt (শুধু মাউস আছে এমন ডিভাইসে) =====
const photo = document.querySelector('.photo');
if (photo && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    const wrap = photo.parentElement;

    wrap.addEventListener('pointermove', (e) => {
        const r = wrap.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        photo.style.setProperty('--ry', `${x * 10}deg`);
        photo.style.setProperty('--rx', `${-y * 10}deg`);
    });
    wrap.addEventListener('pointerleave', () => {
        photo.style.setProperty('--ry', '0deg');
        photo.style.setProperty('--rx', '0deg');
    });
}

// ===== 8. Projects slider (Swiper) =====
if (document.querySelector('.projects-swiper') && typeof Swiper !== 'undefined') {
    new Swiper('.projects-swiper', {
        slidesPerView: 1,
        spaceBetween: 26,
        grabCursor: true,
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        breakpoints: {
            700: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
        },
    });
}


// ===== 9. Contact form =====
const form = document.getElementById('contactForm');
if (form) {
    const status = document.getElementById('formStatus');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // পেজ রিলোড হওয়া বন্ধ
        status.className = 'form-status';
        status.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            const res = await fetch('/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(new FormData(form))),
            });
            const result = await res.json();
            if (!res.ok || !result.ok) throw new Error(result.error || 'Something went wrong.');

            status.textContent = 'Message sent. I will reply soon.';
            status.classList.add('ok');
            form.reset();
        } catch (err) {
            status.textContent =
                err instanceof SyntaxError ? 'Server error. Please try again later.' : err.message;
            status.classList.add('err');
        } finally {
            submitBtn.disabled = false; // সফল বা ব্যর্থ, দুই ক্ষেত্রেই বাটন আবার চালু
        }
    });
}



