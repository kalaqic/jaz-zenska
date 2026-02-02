// Blog page functionality
document.addEventListener('DOMContentLoaded', function() {
    initBlogModal();
    // initPageTransitionLoader(); // Commented out if function doesn't exist
});

// Blog content data
const blogContent = {
    2: {
        category: "Srečno Jaz Zenska",
        date: "15 januarja, 2025",
        title: "25 Stopnic do sreče",
        image: "images/srecaknjigabanner.png",
        content: `
            <p><strong>Srečno, veliko sreče, srečno pot...!</strong></p>
            
            <p>Kako pogosto slišimo ali rečemo srečno, zaželimo nekomu srečo, se jezimo, ker nimamo sreče, hitimo za srečo ali čakamo in hrepenimo po njej, ob vsem tem pa upamo, da bomo našli srečo in jo uspeli zadržati. Pogosto pa se nam zdi, da nam, da bi bili srečni, samo še malo manjka, ves čas nekaj pričakujemo, čakamo, nekam hitimo... ob vsem tem, pa trenutki sreče gredo mimo nas, brez da bi se jih zavedali, v njih uživali in si jih vtisnili v spomin. Kolikokrat se prepozno, zavemo, da smo bili srečni in šele ob težkih situacijah spoznamo, da smo imeli srečo, pa je nismo prepoznali, ali pa, da nas je obiskala, pa ji sploh nismo bili pripravljeni odpreti vrat in jo spustiti v svoje življenje.</p>
            
            <p><strong>"Vsak je svoje sreče kovač!"</strong><br>
            (Gaj Salustij Krisp)</p>
            
            <p>Pregovor pravi, da je vsak svoje sreče kovač. Mogoče je to res in lahko verjamemo v to, vendar velikokrat ne vemo kako jo kovati. Še več, sprašujemo se kaj sploh sreča je. Kako zgleda, kako jo lahko prepoznamo, kako vemo, da imamo srečo, ali da smo srečni?</p>
            
            <p>Verjamem, da se boste strinjali z mano, da je srečo zelo težko opredeliti, opisati, ali ji dati samo en pomen. Največkrat rečemo, da smo srečni, če smo zadovoljni, radostni in zdravi, če ljubimo in smo ljubljeni, če je naše življenje lahkotno, brez težav in bolečin, če nismo lačni in če imamo streho nad glavo, službo, avto, denar...</p>
            
            <p>Po filozofski definiciji je sreča stanje popolne zadovoljitve in odsotnost vsakršne želje.</p>
            
            <p>Če bi se dosledno držali te definicije, bi težko našli srečne ljudi, saj imamo ljudje skoraj vedno kakšne želje in cilje, nove ideje in načrte, vedno znova si želimo nova znanja, izkušnje, doživetja...!</p>
            
            <p>Zato bi mogoče lahko rekli, da smo srečni takrat, ko se zavedamo vsega kar imamo in ko znamo v tem uživati in biti hvaležni.</p>
            
            <p><strong>"Pot sreče je kot Mlečna cesta na nebu: roj majhnih zvezd, ki jih posamič ne vidimo, vse skupaj pa dajejo svetlobo."</strong><br>
            (Francis Bacon)</p>
            
            <div style="text-align: center; margin: 25px 0;">
                <img src="images/blog sreca/jaz ženska 1.jpeg" alt="Jaz Ženska" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            </div>
            
            <p>Vse naše življenje je pot stkana iz trenutkov in sreča naj ne bo končni cilj, temveč način potovanja, na katerem znamo prepoznati lepote, darove in priložnosti življenja v vseh dimenzijah, ki se nam ponujajo.</p>
            
            <p>Sreča je za vsakega od nas nekaj drugega in drugačna in srečo lahko občutimo samo v sebi in za sebe. Vsakega osrečujejo različne stvari in za vsakega od nas ima sreča drugačen pomen. Zato premislite kaj za vas pomeni sreča in kdaj se počutite srečni. Kaj je tisto kar vas osrečuje, predvsem pa pomislite, kako se lahko osrečite sami. Čakati na srečo in pričakovati od drugih, da nas bodo osrečili, je zagotovo recept za nesrečo. Če bomo dovolili, da bo naša sreča odvisna od drugih, potem skoraj zagotovo ne bomo nikoli zares srečni. Za srečo je pomembno, da gradimo dobro samopodobo, se imamo radi in se zavedamo dragocenosti življenja, ki ga živimo. Življenja, ki nam je bilo dano in ki nam nudi nešteto priložnosti za doživljanje dobrega, lepega in radostnega. Na žalost pa vse prevečkrat hitimo, strmimo za nečem daleč in visoko, hitimo skozi življenje v iskanju in čakanju nečesa v prihodnosti, ali se prepustimo, da nas življenje nosi kot reka, medtem ko smo se izgubili nekje v preteklosti in nam dnevi minevajo v obžalovanju, kesanju in obtoževanju. Namesto ljubezni nas vodi strah, namesto radosti čutimo skrbi, namesto nasmeha imamo zaskrbljen in mrk obraz. Vedno najdemo krivca za vse, kar se nam dogaja nekje izven nas, nizamo izgovore in za svoje neuspehe in pomanjkanje sreče krivimo druge. V strahu pred neuspehom, izgubo in bolečino se zapremo, okoli sebe zgradimo visok zid, zaklenemo vrata in ugasnemo luč.</p>
            
            <p><strong>"Ko se ena vrata sreče zaprejo, se druga odprejo; toda pogosto tako dolgo strmimo v zaprta vrata, da ne vidimo tistih, ki so se nam odprla."</strong><br>
            (Helen Keller)</p>
            
            <p>Pomislite, kako težko se sreča prebije do nas, skozi vse te prepreke. Kdo od vas bi si želel hoje skozi zaraščen gozd, poln grmovja, trnja, ostrih trav in neprehodnih goščav. Vsak si raje poišče in izbere lepo, že uhojeno stezico. Tako tudi sreča izbira ljudi, ki so odprtega srca, ljubeči, veseli, nasmejani, uravnoteženi sami s sabo, hvaležni, prijazni, dobrosrčni in radodarni, pozitivno naravnani in optimistični. Sreča išče toplino in ljubezen, mir in dobroto, prijaznost in hvaležnost. Ne sprašuje kako bogat je nekdo, koliko nakita ima, kakšno obleko nosi, kakšen avto vozi. Koliko bogatih ljudi je nesrečnih, osamljenih in nezadovoljnih, koliko lepih in vitkih ljudi je samih, brez ljubezni in družine, koliko pametnih ljudi je neuspešnih in koliko talentiranih ljudi nikoli ni razvilo svojih potencialov? Niso imeli sreče, ali si niso dovoli biti srečni? Se s srečo rodimo ali si srečo kujemo sami?</p>
            
            <p><strong>"Živi danes! Smej se danes! Danes bodi srečen!"</strong><br>
            (Phil Bosmans)</p>
            
            <p>Upam si trditi, da je skrivnost srečnega življenja v tem, da verjamemo, da smo kreatorji svojega življenja, da damo vse od sebe in vedno naredimo največ in najbolje, kar lahko. Da znamo biti hvaležni, optimistični, ljubeči, pogumni in radodarni tudi takrat, ko nam je težko, ko nam gre vse narobe in ko ostanemo sami in pristanemo na dnu. V resnici, nam ravno takrat življenje ponuja nove priložnosti in prav takrat sreča čaka, da ji odpremo vrata. Od nas je odvisno, kaj bomo naredili v takšni situaciji. Koliko moči in poguma bomo zbrali, kako bomo znali biti ljubeči do sebe in si zacelit rane, ali bomo raje obtičali v pasti zanikanja, kritiziranja, obtoževanja in obžalovanja. Eden od številnih pregovorov o sreči pravi, da je sreča kot sončni zahod, ko je najlepše sonce zatone in zatem nastopi noč. Vendar smo ob sončnem zahodu vzhičeni in romantični, uživamo v prizoru in se že vnaprej veselimo novega, saj verjamemo in vemo, da bo naslednji dan sonce zopet vzšlo, nam svetilo, nas grelo in nam ponudilo nov sončni zahod.</p>
            
            <p><strong>"Kadar sledite svoji sreči...se vam bodo odprla vrata tam, koder ste mislili, da jih sploh ni; in koder tudi ni vrat za nikogar drugega."</strong><br>
            (Joseph Campbell)</p>
            
            <div style="text-align: center; margin: 25px 0;">
                <img src="images/blog sreca/jaz ženska 2.jpeg" alt="Jaz Ženska" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
            </div>
            
            <p>Tako kot s soncem, je tudi s srečo, pride in gre. Ozavestite srečne trenutke, uživajte v njih, bodite hvaležni zanje, delite jih z drugimi in se že vnaprej veselite novih. Bodite pozitivni in pričakujte dobro. Prevetrite svoje navade, prepričanja in vrednote, opustite nerealna pričakovanja in če želite ujeti srečo, razprite roke in srce, dajte brez pričakovanja, da se vam bo vrnilo, živite brez strahu in pogumno stopajte naprej z zaupanjem in vero v življenje, ki nam vedno ponudi in da tisto, kar je v določenem trenutka najboljše za nas. Če to ni čisto tako kot si želimo, se vprašajmo kaj v našem življenju bi bilo dobro spremeniti, kaj lahko naredimo drugače, česa se lahko naučimo in katero novo pot lahko izberemo? Ob vsem tem pa ne pozabite, da smo kreatorji svojega življenja in kovači svoje sreče. Kujte močno in vztrajno udarjajte po tnalu življenja, verjemite v srečo, imejte jo radi in bodite pripravljeni, da ji boste na široko odprli vrata, ko vas bo ponovno obiskala!</p>
            
            <p>Čeprav sem dejala, da univerzalnega recepta za srečo ni, pa obstaja kar nekaj nasvetov in priporočil, ki nam lahko pomagajo na naši poti do sreče. Zbrala in strnila sem jih v e-knjigi: 25 stopnic do sreče, ki jo lahko dobite če kliknete na povezavo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="ebook-signup.html" class="ebook-button" style="display: inline-block; background: linear-gradient(135deg, var(--pinky) 0%, var(--mid-violet) 100%); color: var(--white); border: none; padding: 18px 40px; border-radius: 50px; font-size: 18px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(200, 142, 167, 0.4); transition: all 0.3s ease; font-family: 'Montserrat', sans-serif; text-decoration: none;">
                    Želim brezplačno e-knjigo
                </a>
            </div>
            
            <div class="blog-newsletter-cta">
                <p class="blog-newsletter-text">Želite več navdihujočih vsebin, kot je ta?</p>
                <a href="index.html#newsletter" class="blog-newsletter-button">Prijavite se na našo e-novičko</a>
            </div>
        `
    }
};

function initBlogModal() {
    const blogCards = document.querySelectorAll('.blog-post-card');
    const modal = document.getElementById('blog-modal');
    const modalOverlay = document.querySelector('.blog-modal-overlay');
    const closeButton = document.querySelector('.blog-modal-close');
    
    console.log('Initializing blog modal...');
    console.log('Blog cards found:', blogCards.length);
    console.log('Modal found:', !!modal);
    
    if (!modal) {
        console.error('Blog modal not found!');
        return;
    }
    
    if (!blogCards.length) {
        console.error('No blog cards found!');
        return;
    }
    
    blogCards.forEach(card => {
        const openModal = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const blogId = card.getAttribute('data-blog-id');
            console.log('Opening modal for blog ID:', blogId);
            const blog = blogContent[blogId];
            
            if (blog) {
                console.log('Blog found, opening modal...');
                // Populate modal
                const categoryEl = document.querySelector('.blog-modal-category');
                const titleEl = document.querySelector('.blog-modal-title');
                const modalImage = document.querySelector('.blog-modal-image');
                const modalText = document.querySelector('.blog-modal-text');
                
                if (categoryEl) categoryEl.textContent = blog.category;
                if (titleEl) titleEl.textContent = blog.title;
                
                // Handle image - check if it's a URL or gradient
                if (modalImage) {
                // Clear previous styles
                modalImage.style.background = '';
                modalImage.style.backgroundImage = '';
                
                if (blog.image.includes('.jpg') || blog.image.includes('.jpeg') || blog.image.includes('.png') || blog.image.includes('.webp')) {
                    // It's an image URL
                    modalImage.style.backgroundImage = `url('${blog.image}')`;
                    modalImage.style.backgroundSize = 'cover';
                    modalImage.style.backgroundPosition = 'center';
                    modalImage.style.backgroundRepeat = 'no-repeat';
                } else {
                    // It's a gradient
                    modalImage.style.background = blog.image;
                    }
                }
                
                if (modalText) modalText.innerHTML = blog.content;
                
                // Show modal
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                console.log('Modal should be visible now');
            } else {
                console.error('Blog not found for ID:', blogId);
            }
        };
        
        // Add click listener to the card (works for entire card)
        card.addEventListener('click', function(e) {
            // Allow clicks on the button to also trigger
            openModal(e);
        });
        
        // Also add click listener specifically to the button
        const button = card.querySelector('.blog-read-more');
        if (button) {
            button.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card click from also firing
                openModal(e);
            });
        }
    });
    
    // Close modal functions
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

