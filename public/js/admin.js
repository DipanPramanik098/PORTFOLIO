// Admin পেজের থিম টগল (পাবলিক main.js এখানে লোড হয় না)
const themeBtn = document.getElementById('themeToggle');

if (themeBtn) {
    const root = document.documentElement;
    const update = () => {
        themeBtn.textContent = root.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
    };
    update();

    themeBtn.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        update();
    });
}

// ===== মুছে ফেলার আগে নিশ্চিত করা =====
document.querySelectorAll('form[data-confirm]').forEach((f) => {
    f.addEventListener('submit', (e) => {
        if (!confirm(f.dataset.confirm)) e.preventDefault();
    });
});

// ===== ছবি বাছলে সাথে সাথে প্রিভিউ, আর ২MB এর বেশি হলে আগেই আটকানো =====
document.querySelectorAll('input[type="file"][name="imageFile"]').forEach((input) => {
    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('This image is larger than 2 MB. Please choose a smaller one.');
            input.value = '';
            return;
        }

        const field = input.closest('.field');
        let img = field.querySelector('.preview');
        if (!img) {
            img = document.createElement('img');
            img.className = 'preview';
            img.alt = 'Selected image';
            field.insertBefore(img, field.querySelector('input[type="text"]'));
        }
        img.src = URL.createObjectURL(file);
    });
});

