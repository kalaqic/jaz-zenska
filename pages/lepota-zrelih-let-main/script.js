/* =========================
   MOBILE MENU
========================= */

const menuToggle =
    document.querySelector(".menu-toggle");

const navLinks =
    document.querySelector(".nav-links");


menuToggle.addEventListener("click", () => {

    navLinks.classList.toggle("active");

});


document.querySelectorAll(".nav-links a").forEach(link => {

    link.addEventListener("click", () => {

        navLinks.classList.remove("active");

    });

});


/* =========================
   REVEAL ANIMATION
========================= */

const revealElements =
    document.querySelectorAll(".reveal");


const observer =
    new IntersectionObserver(

        entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add("visible");

                    observer.unobserve(entry.target);

                }

            });

        },

        {
            threshold: 0.12
        }

    );


revealElements.forEach(element => {

    observer.observe(element);

});


/* =========================
   FALLING LEAVES
========================= */

const leavesContainer =
    document.querySelector(".leaves");


const leafCount =
    window.innerWidth < 700 ? 8 : 16;


for (let i = 0; i < leafCount; i++) {

    const leaf =
        document.createElement("div");


    leaf.classList.add("leaf");


    const size =
        Math.random() * 10 + 8;


    leaf.style.width =
        `${size}px`;


    leaf.style.height =
        `${size * 0.6}px`;


    leaf.style.left =
        `${Math.random() * 100}%`;


    leaf.style.animationDuration =
        `${Math.random() * 12 + 14}s`;


    leaf.style.animationDelay =
        `${Math.random() * 15}s`;


    leaf.style.opacity =
        `${Math.random() * 0.25 + 0.15}`;


    leavesContainer.appendChild(leaf);

}


/* =========================
   SMOOTH SCROLL
========================= */

document
    .querySelectorAll('a[href^="#"]')
    .forEach(link => {

        link.addEventListener("click", function(event) {

            const target =
                document.querySelector(
                    this.getAttribute("href")
                );


            if (!target) return;


            event.preventDefault();


            target.scrollIntoView({
                behavior: "smooth"
            });

        });

    });