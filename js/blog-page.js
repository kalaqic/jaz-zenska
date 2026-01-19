// Blog page functionality
document.addEventListener('DOMContentLoaded', function() {
    initBlogModal();
    initPageTransitionLoader();
});

// Blog content data
const blogContent = {
    1: {
        category: "Samoodkrivanje",
        date: "11 decembra, 2024",
        title: "Kako odkriti, kaj vas resnično navdihuje in napolnjuje",
        image: "linear-gradient(135deg, #2d5016, #4a7c28)",
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
        category: "Meditacije",
        date: "5 decembra, 2024",
        title: "Moč jutranjih ritualov",
        image: "images/jutranji obred.jpg",
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
            
            <p><strong>Kako prilagoditi ritual svojemu življenju</strong><br>
            Ne vsak jutranji ritual je primeren za vsakogar. Pomembno je, da najdete tisto, kar vam resnično ustreza. Če ste zgodnji ptič, lahko vaš ritual traja dlje. Če ste nočna ptica, začnite z krajšim ritualom in ga postopoma podaljšujte.</p>
            
            <p><strong>Kako premostiti izgovore</strong><br>
            "Nimam časa" je najpogostejši izgovor. Vendar je pomembno razumeti, da je vaš jutranji ritual naložba v sebe. Tudi 10 minut lahko naredi veliko razliko. Namesto da razmišljate o tem, koliko časa nimate, razmislite o tem, koliko časa lahko namenite sebi.</p>
            
            <p><strong>Kako ohraniti doslednost</strong><br>
            Doslednost je ključna, vendar to ne pomeni, da morate biti popolni. Če danes ne uspete, to ni konec sveta. Pomembno je, da se naslednji dan vrnete k svojemu ritualu. Bodite mili do sebe in spomnite se, da je to proces.</p>
            
            <p><strong>Dodatni elementi za vaš jutranji obred</strong><br>
            Razmislite o dodajanju elementov, ki vas navdihujejo - morda je to branje navdihujočih citatov, poslušanje glasbe, ki vas navdihuje, ali preprosto sedenje ob oknu in opazovanje narave. Naj bo vaš ritual prilagojen vašim potrebam.</p>
            
            <p><strong>Kako meriti uspeh</strong><br>
            Uspeh vašega jutranjega rituala ni merjen s časom, ki ga namenite, temveč s tem, kako se počutite. Če se po vašem ritualu počutite bolj mirne, bolj navdihnjene in bolj pripravljene na dan, potem vaš ritual deluje.</p>
            
            <p>Vaš jutranji obred je svet prostor, kjer se povezujete s seboj in pripravljate za dan, ki vas čaka. Naj bo to čas, ko spoštujete sebe in svoje potrebe. Začnite danes in opazujte, kako se vaše življenje začne spreminjati.</p>
            
            <div class="blog-newsletter-cta">
                <p class="blog-newsletter-text">Želite več navdihujočih vsebin, kot je ta?</p>
                <a href="index.html#newsletter" class="blog-newsletter-button">Prijavite se na našo e-novičko</a>
            </div>
        `
    },
    3: {
        category: "Samoodkrivanje",
        date: "28 novembra, 2024",
        title: "Kako povezati se s svojo notranjo močjo in živeti življenje, ki presega vaše sanje",
        image: "linear-gradient(135deg, var(--mid-violet), var(--dark-violet))",
        content: `
            <p>Vsaka ženska nosi v sebi neizmerno moč. Ta moč ni nekaj, kar morate pridobiti - že je v vas. Vaša naloga je, da se z njo povežete, jo spoštujete in uporabite za ustvarjanje življenja, ki presega vaše najboljše sanje.</p>
            
            <p><strong>Kaj je notranja moč?</strong><br>
            Vaša notranja moč je kombinacija vaše intuicije, vaših vrednot, vaše kreativnosti in vaše avtentičnosti. To ni moč nad drugimi - gre za moč, ki ustvarja, neguje in transformira.</p>
            
            <p><strong>Kako se povezati s svojo notranjo močjo</strong><br>
            <strong>1. Poslušajte svojo intuicijo</strong> - Vaša intuicija je vaš najboljši vodnik. Naučite se jo slišati in ji zaupati. Začnite z majhnimi koraki - ko se počutite, da nekaj ni prav, zaupajte temu občutku.</p>
            
            <p><strong>2. Spoštujte svoja čustva</strong> - Vaša čustva so informacije, ne slabosti. Ko spoštujete svoja čustva, se povezujete z vašo notranjo modrostjo in močjo.</p>
            
            <p><strong>3. Izrazite svojo kreativnost</strong> - Kreativnost je izraz vaše notranje moči. Naj bo to umetnost, kuhanje, pisanje ali karkoli drugega, kar vas navdihuje - pustite, da se vaša kreativnost izrazi.</p>
            
            <p><strong>4. Spoštujte svoje meje</strong> - Moč pomeni tudi vedeti, kdaj reči "ne". Zdrave meje so izraz samospoštovanja in moči.</p>
            
            <p><strong>5. Verujte vase</strong> - Vaša notranja moč je že v vas. Verujte vase in zaupajte svoji poti.</p>
            
            <p><strong>Kako prepoznati svojo notranjo moč</strong><br>
            Vaša notranja moč se pogosto kaže v trenutkih, ko se počutite najbolj avtentične. To so trenutki, ko ste popolnoma prisotne, ko se počutite povezane s seboj in ko vedete, da ste na pravi poti. Opazujte te trenutke in razumite, kaj jih povzroča.</p>
            
            <p><strong>Kako razviti svojo notranjo moč</strong><br>
            Vaša notranja moč se razvija skozi prakso. Vsak dan, ko se povežete s seboj, ko spoštujete svoja čustva in ko zaupate svoji intuiciji, krepite svojo notranjo moč. To je proces, ki zahteva čas in potrpežljivost.</p>
            
            <p><strong>Preprečevanje pogostih ovir</strong><br>
            Pogosto nas ovirajo strah, samokritika in občutek, da nismo dovolj. Pomembno je razumeti, da so to le misli, ne resnica. Vaša notranja moč je že v vas - vaša naloga je, da se z njo povežete in jo uporabite.</p>
            
            <p><strong>Kako uporabiti svojo notranjo moč v vsakdanjem življenju</strong><br>
            Vaša notranja moč ni nekaj, kar uporabljate le v posebnih trenutkih - gre za moč, ki jo uporabljate vsak dan. Ko se odločite, da boste spoštovali svoje meje, ko se odločite, da boste zaupali svoji intuiciji, ko se odločite, da boste živeli avtentično življenje - to je uporaba vaše notranje moči.</p>
            
            <p><strong>Kako življenje postane več</strong><br>
            Ko se povežete s svojo notranjo močjo, se odprejo možnosti, ki jih prej niste videli. Začnete verovati, da je življenje lahko več - več radosti, več izpolnjevanja, več možnosti. To ni sanje - to je resničnost, ko živite življenje, ki odraža vašo notranjo moč.</p>
            
            <p><strong>Zaključek</strong><br>
            Vaša notranja moč je že v vas. Ni nekaj, kar morate pridobiti - gre za moč, ki že obstaja in čaka, da se z njo povežete. Začnite danes - poslušajte svojo intuicijo, spoštujte svoja čustva in verujte vase. Vaša notranja moč vas bo vodila na poti, ki presega vaše najboljše sanje.</p>
            
            <p><em>"Vaša notranja moč je že v vas. Odkrijte jo, spoštujte jo in uporabite za ustvarjanje življenja, ki vas napolnjuje in navdihuje."</em></p>
            
            <div class="blog-newsletter-cta">
                <p class="blog-newsletter-text">Želite več navdihujočih vsebin, kot je ta?</p>
                <a href="index.html#newsletter" class="blog-newsletter-button">Prijavite se na našo e-novičko</a>
            </div>
        `
    },
    4: {
        category: "Samoodkrivanje",
        date: "20 novembra, 2024",
        title: "Kako prepoznati in spoštovati svoje vrednote za življenje z namenom",
        image: "linear-gradient(135deg, var(--almost-white), var(--pinky))",
        content: `
            <p>Vaše vrednote so temelj vašega življenja. So stvari, ki vas navdihujejo, dajejo smisel vašemu življenju in vas vodijo pri odločitvah. Ko živite življenje, ki je v skladu z vašimi vrednotami, se počutite izpolnjene in navdihnjene.</p>
            
            <p><strong>Zakaj so vrednote pomembne?</strong><br>
            Vaše vrednote so vaš kompas. Vam pomagajo razumeti, kaj je za vas resnično pomembno, in vas vodijo pri odločitvah. Ko živite življenje, ki je v skladu z vašimi vrednotami, se počutite izpolnjene in navdihnjene.</p>
            
            <p><strong>Kako prepoznati svoje vrednote</strong><br>
            <strong>1. Vprašajte se, kaj vas navdihuje</strong> - Kaj vas navdihuje? Kaj vas počuti živahne in navdihnjene? To so pogosto vaše vrednote.</p>
            
            <p><strong>2. Opazujte, kdaj se počutite najbolj izpolnjene</strong> - Kdaj se počutite najbolj izpolnjene? Kaj počutite v tistih trenutkih? To vam pomaga prepoznati vaše vrednote.</p>
            
            <p><strong>3. Razmislite o tem, kaj vas jezi</strong> - Kaj vas jezi? Kaj vas moti? To vam pogosto pokaže, kaj je za vas pomembno.</p>
            
            <p><strong>4. Vprašajte se, kaj bi naredile, če bi vedele, da ne morete spodleteti</strong> - Če bi vedele, da ne morete spodleteti, kaj bi naredile? To je pogosto povezano z vašimi vrednotami.</p>
            
            <p><strong>5. Zapišite seznam</strong> - Vzemite si čas in napišite seznam svojih temeljnih vrednot. To so stvari, ki vas navdihujejo in dajejo smisel vašemu življenju.</p>
            
            <p><strong>Kako spoštovati svoje vrednote</strong><br>
            Ko prepoznate svoje vrednote, pomembno je, da jih spoštujete. To pomeni živeti življenje, ki je v skladu z vašimi vrednotami, in sprejemati odločitve, ki odražajo vaše vrednote.</p>
            
            <p><strong>Kako prepoznati, ko živite v skladu z vašimi vrednotami</strong><br>
            Ko živite življenje, ki je v skladu z vašimi vrednotami, se počutite izpolnjene, navdihnjene in povezane s seboj. Imate občutek, da ste na pravi poti, tudi če je težka. Nasprotno, ko živite življenje, ki ni v skladu z vašimi vrednotami, se počutite izčrpane, neizpolnjene in ločene od sebe.</p>
            
            <p><strong>Kako sprejemati odločitve v skladu z vašimi vrednotami</strong><br>
            Ko se soočite z odločitvijo, vprašajte se: "Ali je ta odločitev v skladu z mojimi vrednotami?" Če je odgovor ne, razmislite o alternativi. Vaše vrednote so vaš vodnik - zaupajte jim.</p>
            
            <p><strong>Kako obravnavati konflikte vrednot</strong><br>
            Včasih se vaše vrednote lahko konfliktirajo. Na primer, morda cenite tako družino kot kariero. Pomembno je razumeti, da ni nujno, da izberete eno ali drugo - lahko najdete način, kako živeti življenje, ki spoštuje obe vrednoti.</p>
            
            <p><strong>Kako vključiti vrednote v vsakdanje življenje</strong><br>
            Vaše vrednote niso samo stvari, o katerih razmišljate - gre za stvari, ki jih živite. Vsak dan imate priložnost živeti v skladu z vašimi vrednotami - v majhnih stvareh, kot je biti prijazna do prodajalca, ali v velikih stvareh, kot je sprejemanje pomembnih odločitev.</p>
            
            <p><strong>Kako življenje postane več</strong><br>
            Ko živite življenje, ki je v skladu z vašimi vrednotami, se odprejo možnosti, ki jih prej niste videli. Začnete verovati, da je življenje lahko več - več radosti, več izpolnjevanja, več možnosti. To ni sanje - to je resničnost, ko živite življenje z namenom.</p>
            
            <p><strong>Zaključek</strong><br>
            Vaše vrednote so temelj vašega življenja. So stvari, ki vas navdihujejo, dajejo smisel vašemu življenju in vas vodijo pri odločitvah. Ko živite življenje, ki je v skladu z vašimi vrednotami, se počutite izpolnjene in navdihnjene. Začnite danes - prepoznajte svoje vrednote in živite življenje, ki jih odraža.</p>
            
            <p><em>"Vaše vrednote so vaš kompas. Ko živite življenje, ki je v skladu z vašimi vrednotami, se počutite izpolnjene in navdihnjene."</em></p>
            
            <div class="blog-newsletter-cta">
                <p class="blog-newsletter-text">Želite več navdihujočih vsebin, kot je ta?</p>
                <a href="index.html#newsletter" class="blog-newsletter-button">Prijavite se na našo e-novičko</a>
            </div>
        `
    },
    5: {
        category: "Skupnost",
        date: "12 novembra, 2024",
        title: "Zakaj je skupnost, ki se ujema z vašo energijo, ključ do življenja, ki si ga zaslužite",
        image: "linear-gradient(135deg, #4a7c28, #2d5016)",
        content: `
            <p>Ali ste kdaj občutili, da živite življenje, ki ni popolnoma vaše? Da se okoli vas dogajajo stvari, ki se ne ujemajo z vašo notranjo energijo? Za ženske je skupnost, ki se ujema z vašo energijo, ključ do življenja, ki presega vaše najboljše sanje.</p>
            
            <p><strong>1. Vam pokaže, da je življenje lahko več</strong><br>
            Ko ste del skupnosti, ki se ujema z vašo energijo, začnete videti možnosti, ki jih prej niste videli. Druge ženske vas spodbujajo, da razmišljate večje, da verujete vase in da vidite, da je življenje lahko več, kot si kdajkoli predstavljate.</p>
            
            <p><strong>2. Razume vašo energijo</strong><br>
            Prava skupnost razume vašo energijo - vaše vrednote, vaše potrebe in vašo notranjo naravo. Ne poskuša vas spremeniti ali prilagoditi - sprejme vas takšne, kot ste, in vas spodbuja, da postanete najboljša različica sebe.</p>
            
            <p><strong>3. Podpira vašo rast</strong><br>
            V skupnosti, ki se ujema z vašo energijo, se počutite varne, da rastete in se razvijate. Imate podporo, ko je težko, in navdih, ko potrebujete motivacijo. Skupaj rastete hitreje kot sami.</p>
            
            <p><strong>4. Razširi vaše možnosti</strong><br>
            Skupnost vas izpostavi novim idejam, novim možnostim in novim načinom razmišljanja. Začnete videti, da je življenje lahko več - več radosti, več izpolnjevanja, več možnosti.</p>
            
            <p><strong>5. Ustvarja skupaj</strong><br>
            Skupnost vam pomaga ustvariti življenje, ki presega vaše najboljše sanje. Skupaj delite modrost, izkušnje in podporo ter ustvarjate življenje, ki vas napolnjuje in navdihuje.</p>
            
            <p><strong>Zakaj je to še posebej pomembno za ženske?</strong><br>
            Ženske potrebujemo prostor, kjer lahko izrazimo svojo avtentičnost brez obsojanja. Potrebujemo skupnost, ki razume našo intuicijo, našo moč in našo potrebo po povezovanju. Ko najdemo skupnost, ki se ujema z našo energijo, se začne transformacija.</p>
            
            <p><strong>Kako najti skupnost, ki se ujema z vašo energijo?</strong><br>
            Ne zadovoljite se s skupnostjo, ki vas ne razume. Iščite skupnost, ki se ujema z vašo energijo - skupnost, ki razume vaše vrednote, podpira vašo rast in vas spodbuja, da vidite, da je življenje lahko več.</p>
            
            <p><strong>Praktični koraki za iskanje prave skupnosti</strong><br>
            Začnite z razmislekom o tem, kaj vas navdihuje. Katera področja vas zanimajo? Kje se počutite najbolj avtentične? Ko to razumete, poiščite skupnosti, ki delijo vaše interese in vrednote. Ne bojte se eksperimentirati - morda boste morali poskusiti več skupnosti, preden najdete tisto, ki se ujema z vašo energijo.</p>
            
            <p><strong>Kako prepoznati pravo skupnost</strong><br>
            V pravi skupnosti se počutite varne, podprte in navdihnjene. Ne počutite se obsojene ali prislobljene, da se spremenite. Namesto tega se počutite sprejete takšne, kot ste, in spodbujane, da postanete najboljša različica sebe.</p>
            
            <p><strong>Kako graditi odnose v skupnosti</strong><br>
            Ko najdete skupnost, ki se ujema z vašo energijo, pomembno je, da gradite odnose. To ne pomeni, da morate biti najboljša prijateljica z vsemi - gre za povezovanje z ljudmi, ki razumejo vašo pot in vas podpirajo.</p>
            
            <p><strong>Kako skupnost spremeni vaše življenje</strong><br>
            Ko ste del skupnosti, ki se ujema z vašo energijo, začnete videti možnosti, ki jih prej niste videli. Začnete verovati, da je življenje lahko več - več radosti, več izpolnjevanja, več možnosti. To ni sanje - to je resničnost, ko najdete pravo skupnost.</p>
            
            <p><strong>Zaključek</strong><br>
            Skupnost, ki se ujema z vašo energijo, je ključ do življenja, ki presega vaše najboljše sanje. Ne zadovoljite se s skupnostjo, ki vas ne razume - iščite tisto, ki vas podpira, navdihuje in spodbuja, da postanete najboljša različica sebe.</p>
            
            <p><em>"Največji dar, ki si ga lahko podarite, je skupnost, ki vas razume, podpira in spodbuja, da postanete najboljša različica sebe."</em></p>
            
            <div class="blog-newsletter-cta">
                <p class="blog-newsletter-text">Želite več navdihujočih vsebin, kot je ta?</p>
                <a href="index.html#newsletter" class="blog-newsletter-button">Prijavite se na našo e-novičko</a>
            </div>
        `
    },
    6: {
        category: "Samoodkrivanje",
        date: "5 novembra, 2024",
        title: "Kako zaupati svoji intuiciji in živeti življenje, ki odraža vašo resnično naravo",
        image: "linear-gradient(135deg, var(--dark-violet), var(--pinky))",
        content: `
            <p>Vaša intuicija je vaš najboljši vodnik. To je glas vaše notranje modrosti, ki vedno ve, kaj je za vas resnično prav. Naučite se ga slišati, zaupati mu in slediti njegovim nasvetom za življenje, ki odraža vašo resnično naravo.</p>
            
            <p><strong>Kaj je intuicija?</strong><br>
            Vaša intuicija je kombinacija vaših čustev, vaše notranje modrosti in vašega globokega razumevanja. To ni glas strahu ali samokritike - to je glas, ki vas vodi k vaši resnični poti.</p>
            
            <p><strong>Kako slišati svojo intuicijo</strong><br>
            <strong>1. Ustvarite tišino</strong> - Vaša intuicija govori tiho. Potrebujete tišino, da jo slišite. Vsak dan poiščite čas za tišino - meditacija, sprehod v naravi ali preprosto sedenje v tišini.</p>
            
            <p><strong>2. Poslušajte svoja čustva</strong> - Vaša čustva so informacije. Ko se počutite, da nekaj ni prav, to je vaša intuicija, ki vam govori. Poslušajte jo.</p>
            
            <p><strong>3. Opazujte svoje telesne občutke</strong> - Vaše telo vedno ve. Ko se počutite napeto ali neprijetno, to je vaša intuicija, ki vam govori. Poslušajte jo.</p>
            
            <p><strong>4. Prakticirajte meditacijo</strong> - Meditacija vas povezuje z vašo notranjo modrostjo in vam pomaga slišati vašo intuicijo.</p>
            
            <p><strong>5. Zaupajte prvemu občutku</strong> - Vaš prvi občutek je pogosto vaša intuicija. Naučite se mu zaupati.</p>
            
            <p><strong>Kako zaupati svoji intuiciji</strong><br>
            Zaupanje vaši intuiciji je proces. Začnite z majhnimi odločitvami - zaupajte svojemu občutku pri majhnih stvareh. Opazujte rezultate - ko sledite svoji intuiciji, kako se počutite? Več kot prakticirate, bolj se boste naučili zaupati.</p>
            
            <p><strong>Kako razlikovati intuicijo od strahu</strong><br>
            Pogosto zamenjujemo intuicijo s strahom. Pomembno je razumeti razliko - strah vas paralizira, medtem ko intuicija vas navdihuje. Ko zaupate svoji intuiciji, se počutite mirne in prepričane, tudi če je odločitev težka. Ko sledite strahu, se počutite napete in negotove.</p>
            
            <p><strong>Kako razviti zaupanje v svojo intuicijo</strong><br>
            Zaupanje v svojo intuicijo se razvija skozi prakso. Začnite z majhnimi odločitvami - zaupajte svojemu občutku pri majhnih stvareh. Opazujte rezultate - ko sledite svoji intuiciji, kako se počutite? Več kot prakticirate, bolj se boste naučili zaupati.</p>
            
            <p><strong>Praktični vaj za razvijanje intuicije</strong><br>
            Vsak dan vzemite si čas za tišino. Meditirajte ali preprosto sedite v tišini in poslušajte svoj notranji glas. Vprašajte se: "Kaj čutim glede te odločitve?" Zaupajte prvemu občutku - pogosto je to vaša intuicija.</p>
            
            <p><strong>Kako uporabiti intuicijo v vsakdanjem življenju</strong><br>
            Vaša intuicija ni nekaj, kar uporabljate le pri velikih odločitvah - gre za vodnik, ki vas vodi vsak dan. Ko se odločite, kaj boste nosile, kaj boste jedle, kako boste preživele dan - vse to lahko vodi vaša intuicija.</p>
            
            <p><strong>Preprečevanje pogostih ovir</strong><br>
            Pogosto nas ovirajo strah, samokritika in občutek, da ne vemo, kaj je prav. Pomembno je razumeti, da vaša intuicija vedno ve - vaša naloga je, da jo slišite in ji zaupate.</p>
            
            <p><strong>Kako življenje postane več</strong><br>
            Ko zaupate svoji intuiciji in živite življenje, ki odraža vašo resnično naravo, se odprejo možnosti, ki jih prej niste videli. Začnete verovati, da je življenje lahko več - več radosti, več izpolnjevanja, več možnosti. To ni sanje - to je resničnost, ko živite življenje, ki odraža vašo resnično naravo.</p>
            
            <p><strong>Zaključek</strong><br>
            Vaša intuicija je vaš najboljši vodnik. To je glas vaše notranje modrosti, ki vedno ve, kaj je za vas resnično prav. Naučite se ga slišati, zaupati mu in slediti njegovim nasvetom. Začnite danes - poslušajte svojo intuicijo in zaupajte svoji poti.</p>
            
            <p><em>"Vaša intuicija vedno ve, kaj je za vas resnično prav. Naučite se jo slišati, ji zaupati in slediti njenim nasvetom. To je pot k bolj avtentičnemu in napolnjujočemu življenju."</em></p>
            
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
                
                // Handle image - check if it's a URL or gradient
                const modalImage = document.querySelector('.blog-modal-image');
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

