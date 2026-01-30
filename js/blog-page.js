// Blog page functionality
document.addEventListener('DOMContentLoaded', function() {
    initBlogModal();
    // initPageTransitionLoader(); // Commented out if function doesn't exist
});

// Blog content data
const blogContent = {
    1: {
        category: "Meditacije",
        date: "5 decembra, 2024",
        title: "Moč jutranjih ritualov",
        image: "images/jutranji obred.jpg",
        content: `
            <p>Ali ste kdaj občutili, da živite življenje, ki ni popolnoma vaše? Da delate stvari, ki vas ne navdihujejo ali napolnjujejo? Za ženske je samoodkrivanje ključ do življenja, ki presega naše najboljše sanje.</p>
            
            <p><strong>Zakaj je samoodkrivanje pomembno?</strong><br>
            Ko razumete, kaj vas resnično navdihuje in napolnjuje, začnete živeti življenje, ki je v skladu z vašo notranjo naravo. To ni samo o sreči - gre za življenje z namenom in izpolnjevanjem.</p>
            
            <p><strong>Kako odkriti, kaj vas navdihuje</strong><br>
            <strong>1. Poslušajte svoja čustva</strong> - Kaj vas navdihuje? Kaj vas napolnjuje z energijo? Kaj vas počuti živahne in navdihnjene?</p>
            
            <p><strong>2. Opazujte svoje energijske vzorce</strong> - Kdaj se počutite najbolj energične? Kdaj se počutite najbolj navdihnjene? Kaj vas počuti živahne?</p>
            
            <p><strong>3. Vprašajte se, kaj bi naredile, če ne bi bilo omejitev</strong> - Če bi vedele, da ne morete spodleteti, kaj bi naredile? To je pogosto to, kar vas resnično navdihuje.</p>
            
            <p><strong>4. Eksperimentirajte</strong> - Poskusite nove stvari. Ne vedite, kaj vas navdihuje, dokler ne poskusite. Eksperimentirajte in odkrijte, kaj vas resnično navdihuje.</p>
            
            <p><strong>5. Zaupajte svoji intuiciji</strong> - Vaša intuicija vedno ve, kaj vas navdihuje. Naučite se jo slišati in ji zaupati.</p>
            
            <p><strong>Praktični primer: Kako začeti</strong><br>
            Začnite z enostavnim vprašanjem vsak dan: "Kaj me je danes navdihnilo?" Zapišite si odgovor, tudi če se zdi majhen. Čez čas boste začeli videti vzorce - stvari, ki vas vedno navdihujejo, so pogosto povezane z vašo resnično naravo.</p>
            
            <p><strong>Preprečevanje pogostih napak</strong><br>
            Ne zamenjujte navdihovanja s tem, kar družba pričakuje od vas. Morda vas družba spodbuja k določeni karieri, vendar če vas to ne navdihuje, ni to prava pot za vas. Vaša pot je unikatna in je pomembno, da jo spoštujete.</p>
            
            <p><strong>Kako vključiti navdihovanje v vsakdanje življenje</strong><br>
            Ko odkrijete, kaj vas navdihuje, pomembno je, da to vključite v svoje vsakdanje življenje. To ne pomeni, da morate takoj spremeniti vse - začnite z majhnimi koraki. Če vas navdihuje umetnost, začnite z 15 minutami risanja vsak dan. Če vas navdihuje pomoč drugim, poiščite prostovoljstvo, ki se ujema z vašimi vrednotami.</p>
            
            <p><strong>Kako življenje postane več</strong><br>
            Ko odkrijete, kaj vas resnično navdihuje in napolnjuje, se odprejo možnosti, ki jih prej niste videli. Začnete verovati, da je življenje lahko več - več radosti, več izpolnjevanja, več možnosti. To ni sanje - to je resničnost, ko živite življenje, ki vas navdihuje.</p>
            
            <p><strong>Zaključek</strong><br>
            Odkritje, kaj vas resnično navdihuje, je potovanje, ne cilj. Potrebuje čas, potrpežljivost in pogum. Vendar ko začnete živeti življenje, ki vas navdihuje, boste opazili, kako se vaše življenje začne spreminjati na globlji ravni. Začnete se počutiti bolj izpolnjene, bolj navdihnjene in bolj povezane s seboj.</p>
            
            <p><em>"Največji dar, ki si ga lahko podarite, je življenje, ki vas navdihuje in napolnjuje. Odkrijte, kaj vas resnično navdihuje, in zaupajte svoji poti."</em></p>
            
            <div class="blog-newsletter-cta">
                <p class="blog-newsletter-text">Želite več navdihujočih vsebin, kot je ta?</p>
                <a href="index.html#newsletter" class="blog-newsletter-button">Prijavite se na našo e-novičko</a>
            </div>
        `
    },
    2: {
        category: "Samoodkrivanje",
        date: "15 januarja, 2025",
        title: "Srečno na poti Jaz Ženska!",
        image: "linear-gradient(135deg, #f8d7da, #f5c6cb)",
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
            
            <p>Tako kot s soncem, je tudi s srečo, pride in gre. Ozavestite srečne trenutke, uživajte v njih, bodite hvaležni zanje, delite jih z drugimi in se že vnaprej veselite novih. Bodite pozitivni in pričakujte dobro. Prevetrite svoje navade, prepričanja in vrednote, opustite nerealna pričakovanja in če želite ujeti srečo, razprite roke in srce, dajte brez pričakovanja, da se vam bo vrnilo, živite brez strahu in pogumno stopajte naprej z zaupanjem in vero v življenje, ki nam vedno ponudi in da tisto, kar je v določenem trenutka najboljše za nas. Če to ni čisto tako kot si želimo, se vprašajmo kaj v našem življenju bi bilo dobro spremeniti, kaj lahko naredimo drugače, česa se lahko naučimo in katero novo pot lahko izberemo? Ob vsem tem pa ne pozabite, da smo kreatorji svojega življenja in kovači svoje sreče. Kujte močno in vztrajno udarjajte po tnalu življenja, verjemite v srečo, imejte jo radi in bodite pripravljeni, da ji boste na široko odprli vrata, ko vas bo ponovno obiskala!</p>
            
            <p>Čeprav sem dejala, da univerzalnega recepta za srečo ni, pa obstaja kar nekaj nasvetov in priporočil, ki nam lahko pomagajo na naši poti do sreče. Zbrala in strnila sem jih v e-knjigi: 25 stopnic do sreče, ki jo lahko dobite če kliknete na povezavo: DUGME</p>
            
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

