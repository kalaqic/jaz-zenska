// Blog page functionality
document.addEventListener('DOMContentLoaded', function() {
    initBlogModal();
    setBlogPageSpacing();
    window.addEventListener('resize', setBlogPageSpacing);
});

// Set blog page spacing to match footer height for perfect scroll limit
function setBlogPageSpacing() {
    const footer = document.querySelector('footer');
    const blogSection = document.querySelector('.blog-page-section');
    
    if (footer && blogSection) {
        // Temporarily show footer to measure its height
        const originalTransform = footer.style.transform;
        const originalVisibility = footer.style.visibility;
        const originalPosition = footer.style.position;
        
        footer.style.transform = 'translateY(0)';
        footer.style.visibility = 'hidden';
        footer.style.position = 'absolute';
        
        const footerHeight = footer.offsetHeight;
        
        // Restore footer
        footer.style.transform = originalTransform;
        footer.style.visibility = originalVisibility;
        footer.style.position = originalPosition;
        
        // Set blog page spacing to match footer height (slightly shorter to eliminate gap)
        blogSection.style.marginBottom = (footerHeight - 5) + 'px';
    }
}

// Blog content data
const blogContent = {
    1: {
        category: "25 stopnic do sreče",
        date: "11 decembra, 2024",
        title: "Začni svojo pot do sreče",
        image: "linear-gradient(135deg, #2d5016, #4a7c28)",
        content: `
            <p>Vsaka ženska si zasluži živeti življenje, polno sreče, zadovoljstva in notranje harmonije. Ta članek vas vodi skozi 25 praktičnih korakov, ki vas bodo pripeljali bliže k temu, kar resnično želite.</p>
            
            <p><strong>1. Prepoznaj svoje vrednote</strong><br>
            Prvi korak do sreče je razumevanje, kaj je za vas resnično pomembno. Vzemite si čas in napišite seznam svojih temeljnih vrednot. To so stvari, ki vas navdihujejo in dajejo smisel vašemu življenju.</p>
            
            <p><strong>2. Ustvari jutranji obred</strong><br>
            Začnite svoj dan z namenom. Jutranji obred vas povezuje z vašo notranjo močjo in pripravi za uspešen dan. To lahko vključuje meditacijo, pisanje v dnevnik, gibanje ali preprosto trenutek tišine.</p>
            
            <p><strong>3. Prakticiraj hvaležnost</strong><br>
            Vsak dan poiščite vsaj tri stvari, za katere ste hvaležni. Hvaležnost premika vašo pozornost z mankov na obilje in odpira vaše srce za več radosti.</p>
            
            <p><strong>4. Spoštuj svoje meje</strong><br>
            Zdrave meje so temelj samospoštovanja. Naučite se reči "ne", ko nekaj ni v skladu z vašimi vrednotami ali ko se počutite preobremenjene.</p>
            
            <p><strong>5. Povezuj se z naravo</strong><br>
            Narava ima moč, da nas pomiri, navdihne in poveže z našo notranjo modrostjo. Vsak dan poiščite čas za povezovanje z naravo, naj bo to sprehod v parku ali preprosto opazovanje sončnega zahoda.</p>
            
            <p>Ti koraki so le začetek. Vsak korak vas vodi bliže k življenju, ki vas napolnjuje in navdihuje. Zapomnite si, da je pot do sreče potovanje, ne cilj. Uživajte v vsakem koraku.</p>
        `
    },
    2: {
        category: "Meditacije",
        date: "5 decembra, 2024",
        title: "Moč jutranjih ritualov",
        image: "linear-gradient(135deg, var(--pinky), var(--mid-violet))",
        content: `
            <p>Jutranji rituali so močno orodje za povezovanje z vašo notranjo močjo in pripravo za uspešen dan. Ko ustvarite osebni jutranji obred, ki vas resnično navdihuje, boste opazili, kako se vaše življenje začne spreminjati.</p>
            
            <p><strong>Zakaj so jutranji rituali pomembni?</strong><br>
            Jutranji rituali vam dajejo občutek kontrole in namera nad vašim dnem. Namesto da se preprosto prepustite toku dogodkov, aktivno oblikujete svoj dan z namenom in pozornostjo.</p>
            
            <p><strong>Kako ustvariti svoj jutranji obred?</strong><br>
            1. <strong>Zbujenje z namenom</strong> - Namesto takojšnjega doseganja po telefonu, vzemite si nekaj trenutkov za globok vdih in nastavitev namena za dan.</p>
            
            <p>2. <strong>Gibanje</strong> - Telo se mora zbuditi. To lahko vključuje jogo, raztegovanje, ples ali preprosto sprehod. Gibanje aktivira vašo energijo in pripravi vas za dan.</p>
            
            <p>3. <strong>Meditacija ali tišina</strong> - Vsaj 5 minut tišine vam omogoča povezovanje z vašo notranjo modrostjo. To lahko vključuje vodeno meditacijo, opazovanje dihanja ali preprosto sedenje v tišini.</p>
            
            <p>4. <strong>Pisanje v dnevnik</strong> - Zapisovanje vaših misli, čustev in namenov vam pomaga razjasniti, kaj je za vas resnično pomembno.</p>
            
            <p>5. <strong>Hvaležnost</strong> - Začnite dan z iskanjem stvari, za katere ste hvaležni. To premika vašo energijo v pozitivno smer.</p>
            
            <p><strong>Praktični nasveti</strong><br>
            - Začnite z majhnimi koraki. 10 minut je dovolj za začetek.<br>
            - Naj bo vaš ritual prilagojen vašim potrebam in časovnemu razporedu.<br>
            - Bodi dosledna, vendar tudi mila do sebe, če danes ne uspeš.<br>
            - Eksperimentirajte in najdite, kaj vam resnično ustreza.</p>
            
            <p>Vaš jutranji obred je svet prostor, kjer se povezujete s seboj in pripravljate za dan, ki vas čaka. Naj bo to čas, ko spoštujete sebe in svoje potrebe.</p>
        `
    },
    3: {
        category: "Ženska moč",
        date: "28 novembra, 2024",
        title: "Odkrij svojo avtentično moč",
        image: "linear-gradient(135deg, var(--mid-violet), var(--dark-violet))",
        content: `
            <p>Vsaka ženska nosi v sebi neizmerno moč. Ta moč ni nekaj, kar morate pridobiti - že je v vas. Vaša naloga je, da jo odkrijete, spoštujete in uporabite.</p>
            
            <p><strong>Kaj je ženska moč?</strong><br>
            Ženska moč ni o dominaciji ali nadzorovanju. Gre za avtentično izražanje vaše notranje narave - vaše intuicije, sočutja, kreativnosti in povezovanja. To je moč, ki ustvarja, neguje in transformira.</p>
            
            <p><strong>Kako odkriti svojo moč?</strong><br>
            <strong>1. Poslušaj svojo intuicijo</strong><br>
            Vaša intuicija je vaš najboljši vodnik. Naučite se jo slišati in ji zaupati. Začnite z majhnimi koraki - ko se počutite, da nekaj ni prav, zaupajte temu občutku.</p>
            
            <p><strong>2. Spoštuj svoje čustva</strong><br>
            Vaša čustva so informacije, ne slabosti. Ko spoštujete svoja čustva, se povezujete z vašo notranjo modrostjo in močjo.</p>
            
            <p><strong>3. Izrazi svojo kreativnost</strong><br>
            Kreativnost je izraz vaše notranje moči. Naj bo to umetnost, kuhanje, pisanje ali karkoli drugega, kar vas navdihuje - pustite, da se vaša kreativnost izrazi.</p>
            
            <p><strong>4. Gradi skupnost</strong><br>
            Ženska moč se krepi v skupnosti. Ko se povezujete z drugimi ženskami, delite modrost in se podpirate, vsaka posameznica postane močnejša.</p>
            
            <p><strong>5. Spoštuj svoje meje</strong><br>
            Moč pomeni tudi vedeti, kdaj reči "ne". Zdrave meje so izraz samospoštovanja in moči.</p>
            
            <p><strong>Praktični koraki</strong><br>
            - Vsak dan poiščite čas za povezovanje s seboj - meditacija, pisanje, narava<br>
            - Okoli sebe zberite ženske, ki vas podpirajo in navdihujejo<br>
            - Prakticirajte izražanje svojih potreb in meja<br>
            - Zaupajte svoji intuiciji in sledite njenim nasvetom</p>
            
            <p>Vaša moč je že v vas. Odkrijte jo, spoštujte jo in uporabite za ustvarjanje življenja, ki vas napolnjuje in navdihuje.</p>
        `
    },
    4: {
        category: "Transformacija",
        date: "20 novembra, 2024",
        title: "Pot transformacije",
        image: "linear-gradient(135deg, var(--almost-white), var(--pinky))",
        content: `
            <p>Vsaka sprememba v življenju je priložnost za rast in transformacijo. Ko se spoprimemo s spremembami z milostjo, pogumom in odprtostjo, se odpremo za novo, močnejšo različico sebe.</p>
            
            <p><strong>Razumevanje transformacije</strong><br>
            Transformacija ni samo o spremembi zunanjih okoliščin - gre za globoko notranjo spremembo, ki nas vodi k bolj avtentičnemu življenju. To je proces, ki zahteva čas, potrpežljivost in pogum.</p>
            
            <p><strong>Faze transformacije</strong><br>
            <strong>1. Prepoznavanje</strong> - Prepoznate, da nekaj ni več v skladu z vašimi potrebami ali vrednotami.<br>
            <strong>2. Odpustitev</strong> - Spustite se, kar vas več ne služi, čeprav je to težko.<br>
            <strong>3. Prehod</strong> - To je čas negotovosti, ko še niste tam, kjer ste bili, vendar še niste tam, kamor greste.<br>
            <strong>4. Rast</strong> - Začnete graditi novo, bolj avtentično različico sebe.<br>
            <strong>5. Integracija</strong> - Nova različica sebe postane del vašega vsakdana.</p>
            
            <p><strong>Kako se spoprijeti s transformacijo</strong><br>
            - <strong>Bodi mila do sebe</strong> - Transformacija je proces, ne dogodek. Dajte si čas in prostor.<br>
            - <strong>Zaupaj procesu</strong> - Čeprav se zdi negotovo, zaupajte, da vas proces vodi na pravo mesto.<br>
            - <strong>Išči podporo</strong> - Povezujte se z ljudmi, ki vas podpirajo in razumejo vašo pot.<br>
            - <strong>Prakticiraj samosojalnost</strong> - Bodite sočutni do sebe, ko je težko.<br>
            - <strong>Praznuj majhne zmage</strong> - Vsak korak naprej je pomemben.</p>
            
            <p><strong>Praktični nasveti</strong><br>
            - Vzemite si čas za refleksijo - kaj vas vodi, kaj vas zadržuje?<br>
            - Ustvarite podporne rituale - kaj vam pomaga pri prehodu?<br>
            - Povezujte se z naravo - narava ima moč, da nas pomiri in navdihuje.<br>
            - Prakticirajte hvaležnost - tudi v težkih časih poiščite stvari, za katere ste hvaležni.</p>
            
            <p>Transformacija je potovanje, ne cilj. Uživajte v procesu in zaupajte, da vas vodi k bolj avtentičnemu in napolnjujočemu življenju.</p>
        `
    },
    5: {
        category: "Skupnost",
        date: "12 novembra, 2024",
        title: "Moč ženske skupnosti",
        image: "linear-gradient(135deg, #4a7c28, #2d5016)",
        content: `
            <p>Ko se ženske zberejo, se zgodijo čudeži. Ženska skupnost je prostor, kjer se deli modrost, podpira rast in krepi vsaka posameznica. To je moč, ki jo dolgo časa nismo uporabljale dovolj.</p>
            
            <p><strong>Zakaj je skupnost pomembna?</strong><br>
            Ženske so tradicionalno delile modrost v krogih, podpirale druga drugo in skupaj rastle. V današnjem svetu, kjer nas pogosto ločuje konkurenca in primerjava, je skupnost še posebej pomembna.</p>
            
            <p><strong>Kako skupnost podpira rast</strong><br>
            - <strong>Varnost</strong> - V skupnosti se počutite varne, da ste avtentični in izrazite svoje resnične občutke.<br>
            - <strong>Podpora</strong> - Ko je težko, vas skupnost podpre in vas spomni na vašo moč.<br>
            - <strong>Modrost</strong> - Deljenje izkušenj in modrosti vam pomaga rasti in se učiti.<br>
            - <strong>Povezovanje</strong> - Skupnost vas povezuje z drugimi in vas spomni, da niste same.</p>
            
            <p><strong>Kako graditi skupnost</strong><br>
            <strong>1. Začni majhno</strong> - Ni potrebno, da je skupnost velika. Začnite z dvema ali tremi ženskami, ki vas navdihujejo.</p>
            
            <p><strong>2. Ustvari varen prostor</strong> - Skupnost mora biti prostor, kjer se vsaka ženska počuti varne, da izrazi svoje resnične občutke in izkušnje.</p>
            
            <p><strong>3. Prakticiraj aktivno poslušanje</strong> - Ko se ženske zberejo, pomembno je, da se resnično poslušamo, ne samo čakamo na svojo priložnost za govor.</p>
            
            <p><strong>4. Deli modrost</strong> - Vsaka ženska ima svojo modrost. Delite jo in se učite druga od druge.</p>
            
            <p><strong>5. Podpiraj rast</strong> - Skupnost je prostor za rast. Podpirate druga drugo pri doseganju vaših ciljev in sanj.</p>
            
            <p><strong>Praktični nasveti</strong><br>
            - Organizirajte redne sestanke - naj bo to mesečno ali tedensko<br>
            - Ustvarite strukturo, vendar pustite prostor za spontanost<br>
            - Prakticirajte sočutje in razumevanje<br>
            - Praznujte uspehe druga druge</p>
            
            <p>Ženska skupnost je moč, ki nas krepijo, navdihujejo in podpirajo na naši poti. Povezujte se, delite modrost in skupaj rastite.</p>
        `
    },
    6: {
        category: "Samoodkrivanje",
        date: "5 novembra, 2024",
        title: "Povezovanje z notranjim glasom",
        image: "linear-gradient(135deg, var(--dark-violet), var(--pinky))",
        content: `
            <p>Vaš notranji glas je vaš najboljši vodnik. To je glas vaše intuicije, vaše notranje modrosti, ki vedno ve, kaj je za vas resnično prav. Naučite se ga slišati, zaupati mu in slediti njegovim nasvetom.</p>
            
            <p><strong>Kaj je notranji glas?</strong><br>
            Vaš notranji glas je kombinacija vaše intuicije, vaših čustev in vaše notranje modrosti. To ni glas strahu ali samokritike - to je glas, ki vas vodi k vaši resnični poti.</p>
            
            <p><strong>Kako slišati svoj notranji glas?</strong><br>
            <strong>1. Ustvari tišino</strong> - Vaš notranji glas govori tiho. Potrebujete tišino, da ga slišite. Vsak dan poiščite čas za tišino - meditacija, sprehod v naravi ali preprosto sedenje v tišini.</p>
            
            <p><strong>2. Poslušaj svoja čustva</strong> - Vaša čustva so informacije. Ko se počutite, da nekaj ni prav, to je vaš notranji glas, ki vam govori. Poslušajte ga.</p>
            
            <p><strong>3. Opazuj svoje sanje</strong> - Vaše sanje so pogosto izraz vaše podzavesti. Opazujte jih in poiščite vzorce ali sporočila.</p>
            
            <p><strong>4. Prakticiraj meditacijo</strong> - Meditacija vas povezuje z vašo notranjo modrostjo in vam pomaga slišati vaš notranji glas.</p>
            
            <p><strong>5. Zaupaj prvemu občutku</strong> - Vaš prvi občutek je pogosto vaš notranji glas. Naučite se mu zaupati.</p>
            
            <p><strong>Kako zaupati svojemu notranjemu glasu</strong><br>
            - Začnite z majhnimi odločitvami - zaupajte svojemu občutku pri majhnih stvareh<br>
            - Opazujte rezultate - ko sledite svojemu notranjemu glasu, kako se počutite?<br>
            - Prakticirajte - več kot prakticirate, bolj se boste naučili zaupati<br>
            - Bodite potrpežljivi - zaupanje vašemu notranjemu glasu je proces</p>
            
            <p><strong>Praktični nasveti</strong><br>
            - Vsak dan poiščite vsaj 10 minut za tišino<br>
            - Vzemite si čas pred odločitvami - vprašajte se, kaj čutite<br>
            - Zapišite svoje občutke in opazujte vzorce<br>
            - Prakticirajte meditacijo ali druge tehnike povezovanja s seboj</p>
            
            <p>Vaš notranji glas je vedno tam, ki vas vodi. Naučite se ga slišati, zaupati mu in slediti njegovim nasvetom. To je pot k bolj avtentičnemu in napolnjujočemu življenju.</p>
        `
    }
};

function initBlogModal() {
    const blogCards = document.querySelectorAll('.blog-post-card');
    const modal = document.getElementById('blog-modal');
    const modalOverlay = document.querySelector('.blog-modal-overlay');
    const closeButton = document.querySelector('.blog-modal-close');
    
    if (!modal || !blogCards.length) return;
    
    blogCards.forEach(card => {
        card.addEventListener('click', function() {
            const blogId = this.getAttribute('data-blog-id');
            const blog = blogContent[blogId];
            
            if (blog) {
                // Populate modal
                document.querySelector('.blog-modal-category').textContent = blog.category;
                document.querySelector('.blog-modal-date').textContent = blog.date;
                document.querySelector('.blog-modal-title').textContent = blog.title;
                document.querySelector('.blog-modal-image').style.background = blog.image;
                document.querySelector('.blog-modal-text').innerHTML = blog.content;
                
                // Show modal
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
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

