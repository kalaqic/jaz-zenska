// Course Detail Page JavaScript
const MOC_BESSEDE_WORDS = [
    'MORAM',
    'NE ZELIM',
    'NE MOREM SI PRIVOSCIT',
    'VEDNO / NIKOLI',
    'BOM PROBAL',
    'PROBLEM',
    'NE MOREM CAKATI',
    'NE',
    'KRIV',
    'AMPAK',
    'NE BI SMELA',
    'NE SKRBI',
    'RES TE POGREŠAM',
    'JAZ SEM',
    'JAZ SEM TAKO UTRUJENA (Rabimo biti hvaležni da nas naše teleso opozarja na to)',
    'KRITIKA',
    'TI (Ko govorimo o sebi v tretji osebi)',
    'UPAM',
    'SOVRAŽIM',
    'RAZLAGA',
    'ISKRENO UPORABLJANJE DA/NE (Govorimo da/ne zaradi občutka obveznosti, ker nam je nerodno, se počutimo kot da smo dolžni ali nam nekdo bo zameril)',
    'KAJ JE NAROBE S TABO',
    'IZGOVOR',
    'PRETERIVANJE',
    'NI POŠTENO',
    'NE OBUPAJ, NE ODNEHAJ, NE ZBOLI (Ne uporabljajte besedo zvezo česar ne želite)',
    'UPORABLJAJTE RESNICO'
];

const MOC_BESEDE_UVOD_VIDEO_URL = 'https://player.vimeo.com/video/1179910844?badge=0&autopause=0&player_id=0&app_id=58479';

function normalizeWordKey(s) {
    return String(s || '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/** Default Vimeo URLs: any normalized title string you use (chat, Firebase, or full list) can be a key. */
const ISKRENO_VIMEO_URL =
    'https://player.vimeo.com/video/1179913461?badge=0&autopause=0&player_id=0&app_id=58479';
const KAJ_JE_NAROBE_S_TABO_VIMEO_URL =
    'https://player.vimeo.com/video/1179915602?badge=0&autopause=0&player_id=0&app_id=58479';
const IZGOVOR_VIMEO_URL =
    'https://player.vimeo.com/video/1179916794?badge=0&autopause=0&player_id=0&app_id=58479';
const PRETERIVANJE_VIMEO_URL =
    'https://player.vimeo.com/video/1179924385?badge=0&autopause=0&player_id=0&app_id=58479';
const NI_POSTENO_VIMEO_URL =
    'https://player.vimeo.com/video/1179927314?badge=0&autopause=0&player_id=0&app_id=58479';
const NE_OBUPAJ_ODNEHAJ_ZBOLI_VIMEO_URL =
    'https://player.vimeo.com/video/1179928653?badge=0&autopause=0&player_id=0&app_id=58479';
const MOC_BESEDE_WORD_VIDEO_URLS = new Map([
    [normalizeWordKey('RAZLAGA'), 'https://player.vimeo.com/video/1179913002?badge=0&autopause=0&player_id=0&app_id=58479'],
    [normalizeWordKey('IZGOVOR'), IZGOVOR_VIMEO_URL],
    [normalizeWordKey('IZGOVORI'), IZGOVOR_VIMEO_URL],
    [normalizeWordKey('PRETERIVANJE'), PRETERIVANJE_VIMEO_URL],
    [normalizeWordKey('PRETERAVANJE'), PRETERIVANJE_VIMEO_URL],
    [normalizeWordKey('PRETJERAVANJE'), PRETERIVANJE_VIMEO_URL],
    [normalizeWordKey('PRETIRAVANJE'), PRETERIVANJE_VIMEO_URL],
    [normalizeWordKey('NI POŠTENO'), NI_POSTENO_VIMEO_URL],
    [normalizeWordKey('NI POSTENO'), NI_POSTENO_VIMEO_URL],
    [normalizeWordKey('KAJ JE NAROBE S TABO'), KAJ_JE_NAROBE_S_TABO_VIMEO_URL],
    [normalizeWordKey('KAJ JE NAROBE STABO'), KAJ_JE_NAROBE_S_TABO_VIMEO_URL],
    [normalizeWordKey('ISKRENO UPORABLJANJE DA/NE'), ISKRENO_VIMEO_URL],
    [
        normalizeWordKey(
            'ISKRENO UPORABLJANJE DA/NE (Govorimo da/ne zaradi občutka obveznosti, ker nam je nerodno, se počutimo kot da smo dolžni ali nam nekdo bo zameril)'
        ),
        ISKRENO_VIMEO_URL
    ],
    [normalizeWordKey('NE OBUPAJ, NE ODNEHAJ, NE ZBOLI'), NE_OBUPAJ_ODNEHAJ_ZBOLI_VIMEO_URL],
    [
        normalizeWordKey(
            'NE OBUPAJ, NE ODNEHAJ, NE ZBOLI (Ne uporabljajte besedo zvezo česar ne želite)'
        ),
        NE_OBUPAJ_ODNEHAJ_ZBOLI_VIMEO_URL
    ]
]);

function applyMocBesedeDefaultVideoUrls(episodes) {
    if (!Array.isArray(episodes)) return;
    episodes.forEach(ep => {
        const title = String(ep.title || '').trim();
        if (!title) return;
        const mapped = MOC_BESEDE_WORD_VIDEO_URLS.get(normalizeWordKey(title));
        if (mapped && !String(ep.videoUrl || '').trim()) {
            ep.videoUrl = mapped;
        }
    });
}

const MOC_BESSEDE_META = new Map();

function setMocMeta(wordKey, description, exercise) {
    MOC_BESSEDE_META.set(normalizeWordKey(wordKey), {
        description: String(description || ''),
        exercise: String(exercise || '')
    });
}

// Provided episode content (word = one episode)
setMocMeta(
    'MORAM',
    `Beseda MORAM v nas ustvarja obvezo in nas postavlja v situacijo, kot da nimamo izbire. 

Ustvari pritisk in kot odgovor na  ta občutek, se na drugi strani pojavi odpor.

Prav zaradi tega neprijetnega in negativnega občutka velikokrat ne naredimo tiso, kar bi bilo potrebno in dobro za nas, ali pa s tem odlašamo.

Še huje je ko nam kdo drug reče kaj moramo narediti, ali ko mi nekomu rečemo moraš. Takrat se pogosto pojavi dodaten odpor in nekaj ne naredimo rano zato, ker nam je nekdo rekel, da moramo.

Namesto moram raje poiščite drugo besede kot je: sedaj je na vrsti da naredim..., v načrtu imam..., želim si...  danes sem se odločila in bom naredila...`,
    `Izgovorite besedo moram in se poslušajte!

Kakšne občutke beseda moram zbudi v vas?

Kje to čutite in kako!

Sprostite se in nekajkrat globoko vdihnite v ta občutek, nato pa pomislite, kako lahko drugače poveste.

Čez dan bodite pozorni na besedico moram, zapišite si stavke, ki vključujejo besedico moram in jih preoblikujte z drugimi, bolj spodbudnimi besedami.
`
);

setMocMeta(
    'NE ŽELIM',
    `Ko izgovorimo NE ŽELIM in nadaljujemo s tem, kar ne želimo, velikokrat dobimo ravno to. Razumeti moramo, da s tem, ko govorimo o stvareh, ki jih ne želimo, imamo fokus prav na tem, česar ne želimo. Kjer imamo fokus, tja gre naša energija. Kamor gre naša energija, tja gre tudi naša moč in manifestacija. Zatorj namesto Ne Želim, pomislite kaj je tisto kar želite in govorite o stvareh, ki so na popisu vaših želja.`,
    `Napišite vse, kar v svojem življenju ne želite. Sedaj pa na drugi strani lista napišite kaj si želite.

Vaše želje ocenite od 1 do 10, s tem da z 10 ovrednotite najmočnejše, najbolj srčne želje.

Ob željah napišite tudi, kaj ste pripravljeni narediti in kaj je prvi korak, ki ga boste naredili.`
);

setMocMeta(
    'NE MOREM SI PRIVOSCIT',
    `Ko izgovorimo NE MOREM SI PRIVOSCIT izražamo pomanjkanje in za to trditvijo zelo velikokrat stoji tudi negativno prepričanje, da nismo dovolj vredne, da si ne zaslužimo.

Namesto da si govorimo, ne morem si privoščit, raje recimo: »V tem trenutku to ni na mojem prvem mestu, ko pride na vrsto vem, da bom našla način da si to privoščim«

Če delujemo iz vibracije pomanjkanja, privlačimo še več pomanjkanja, zato je pomembno, da imamo fokus na tistem kar lahko in ne na tistem kar ne moremo.

Seveda je zaželeno, da smo pri svojih željah iskreni in se vprašamo kaj si res želim, kaj so moje srčne želje in če je nekaj, kar si resnično, iskreno želite, boste zagotovo našle način, da to dobite.`,
    `Prisluhnite svojim željam, poslušajte svoj notranji glas in se vprašajte kako iskrena je ta vaša želja in kaj ste pripravljene narediti, da se vam uresniči.

Pazite kaj in kako govorite. Vesolje vas posluša. Dajte si možnost in izbiro in namesto ne morem si privoščiti raje recite, to v tem trenutku ni moja prioriteta.

Na ta način boste sprostili pritisk in začutili več lahkotnosti.`
);

setMocMeta(
    'VEDNO / NIKOLI',
    `Besede kot so VEDNO, NIKOLI, VSI, NIHČE..., nikoli ne odražajo objektivnega stanja in v sebi nosijo pretiravanje. Ko izgovorimo VEDNO, NIKOLI, VSI, NIHČE..., naredimo krivico sebi in drugim, naredimo zid in ne damo priložnosti, da bi pa le bilo kaj drugače. Bodimo pozorni in pomislimo, ali je naša trditev točno, oziroma kdaj pa le ni bilo tako, kdo pa le ni naredil tako...?`,
    `Ko izgovoriš besedo VEDNO zapiši izgovorjeno trditev, potem pa poišči situacijo, ki to trditev spodbija.

Primer: Vedno naredim vse narobe – zagotovo je veliko situacij, ko si kaj naredila prav. Zapiši.

Nihče me ne razume! Zagotovo ti je kdaj kdo prisluhnil, te podprel in te razumel. Napiši!`
);

setMocMeta(
    'BOM PROBAL',
    `Ko izgovorimo BOM PROBALA, si že pripravljamo izgovor, če nam ne bo uspelo. Postavljamo dvom in nismo pripravljeni dati vse od sebe. Namesto bom probala raje pomislimo, kaj vse lahko naredimo, da nam bo uspelo in si zagotovimo, da bomo naredili vse, kar je v naši moči, da nam bo uspelo.`,
    `Zapiši si misel – afirmacijo, ki te bo vodila na tvoji poti do ciljev.

Primer:
“Zmagujejo tisti, ki verjamejo, da lahko.” – Paul Tournier`
);

setMocMeta(
    'PROBLEM',
    `Ko govorimo o PROBLEMU, smo na vibraciji, kjer je problem nastal. Zavedati se moramo, da vsaka stvar ima dve plati, da vsak kovane ima dve strani. Če je na eni strani problem, je rešitev vedno na drugi strani. In takoj, ko se pojavi problem, je na drug strani že rešitev, ker vse na svetu ima svojo polarnost, svoj kontrast. Zatorej verjemi, da rešitev že obstaja. Ozavesti kaj je problem, potem pa se obrni k rešitvi.`,
    `Moj izziv- moj problem, moja težav je:

Napiši vse informacije o določenem problemu.

Sedaj pa se obrni k rešitvi z vprašanji, ki te bodo vodila naprej.

Najprej se vprašaj ali je to tvoj problem, je to nekaj, kar lahko rešiš, ali imaš moč, željo in pooblastilo, da to rešuješ.

Če so odgovori da, potem se vprašaj kaj ti ta izziv, problem sporoča, na kaj te opozarja, kaj se lahko naučiš, kaj lahko spremeniš.

Začni iskati kaj dobrega je v vsem tem, kaj ti sporoča, kam te vodi in kaj lahko narediš.

Kaj potrebuješ, kdo ti lahko pomaga, kaj je prvi korak, ki ga lahko narediš takoj?

Naredi si načrt rešitve in pojdi v akcijo.

Na pozabi, ko se pojavi problem, obstaja tudi rešitev.`
);

setMocMeta(
    'NE MOREM CAKATI',
    `Te besede izražajo nestrpnost in neučakanost. Z mislimi in energijo smo nekje v prihodnosti in vse, kar se nam dogaja tukaj in sedaj, gre mimo nas. Ob tem smo v sedanjem trenutku v vibraciji nestrpnosti, nemira, nezadovoljstva in se postavljamo v negativno čustveno stanje.

Zato vam priporočam, da se postavite v sedanji trenutek in povejte, kako se že sedaj veselite, da se bo zgodilo to kar pričakujete.

Sedaj začutite veselje, radost, toplino, ljubezen... in bodite v tem trenutku tukaj in sedaj.`,
    `Začuti kako se boš počutila v trenutku, ko se bo zgodilo tisto kar pričakuješ in ostani čim dlje v tej vibraciji. Namesto v nestrpnosti bodi v miru, v radosti v veselju v trenutku tukaj in sedaj.

Iskreno začuti to radost sedaj in si ta občutek vtisni v telo, naj bo v tebi in naj te spremlja do trenutka v prihodnosti, ko se bo to, kar pričakuješ, tudi zares zgodilo.`
);

setMocMeta(
    'NE',
    `Ta majhna, kratka, pa vendar izredno močna beseda NE ima veliko pomenov. Sedaj že vemo da namesto, da govorimo ne želim, raje povemo kaj želimo.

Tokrat pa govorimo o tem, da je prav in celo potrebno, da včasih rečemo tudi besedico NE. Naučimo se uporabiti NE, kadar je potrebno postavi meje, kadar rečemo JA, čeprav vse v naši notranjosti kliče po besedici NE.

Rečemo ja namesto ne, ker se ne želimo zameriti, ker ne bi radi koga prizadeli, ker si ne upamo, ker...

Prav je, da rečemo ne, je pa zelo pomembno, kako rečemo NE, da povemo, da je ta NE za tokrat in da boste naslednjič sodelovali, naredili, prisluhnili..., če vam bodo čas in vaše zmožnosti to dopuščale.

Ne bojte se reči NE, mehko, sočutno, pa vendar odločno.`,
    `Pomisli kdaj si rekla JA, a si v resnici želela reči NE.

Zapiši kaj te je zaustavilo, zakaj si rekla JA namesto NE.

Kako boš reagirala naslednjič.

Obljubi si, da boš večkrat poslušala sebe in malo bolje premislila predno boš rekla JA ali NE.`
);

setMocMeta(
    'KRIV',
    `Kolikokrat se znajdemo v občutku krivde, ali pa krivimo nekoga drugega. Koliko energije porabimo, ko dokazujemo krivdo, ko iščemo krivca in ko iz te krivde gradimo zamero, jezo, užaljenost... Nepredelana krivica in občutek krivde, ali obsojanje drugih nas zaustavi, nas drži v preteklosti in v slabih občutkih.

Ko smo v krivdi in obsojanju se hitro znajdemo tudi v vlogi žrtve in iščemo krivca izven nas.

Kar se je zgodilo, ne moremo več spremeniti. Seveda nam ni vseeno in tudi ne mislim, da bi morali odobravati nekaj, kar ni v skladu z nami in našimi vrednotami.

Bistvo je v tem, da za vse, kar se je zgodilo, prevzamemo odgovornost, sprejmemo lekcijo, se zahvalimo za izkušnjo in gremo naprej.`,
    `Pomisli na krivdo, krivico, sram, ki te bremeni.

Poglej kaj se je zgodilo, kaj lahko narediš, komu se lahko opravičiš ali oprostiš.

Napiši komu in kaj vse odpuščaš.`
);

setMocMeta(
    'AMPAK',
    `Obstaja besedica, ki velikokrat uniči, izbriše, razveljavi...: Ko nekoga pohvalimo, mu rečemo nekaj lepega, podamo pozitivno mnenje in takoj nadaljujemo z besedico AMPAK, razvrednotimo vse lepo in dobro.

Besedica ampak, nam pove da nismo dovolj dobri, da nismo dovolj, da nismo zadovoljili pričakovanj...

Zatorej povejmo in naredimo piko.

Zaključimo lepo misel, pohvalo spodbudo brez besedice AMPAK. 

V naslednjem stavku, v daljnem pogovoru pa poglejmo kaj se še da narediti, kje so še priložnosti za rast, kako še lahko nekaj izboljšamo, dopolnimo, spremenimo...`,
    `Poslušaj se, ko govoriš in bodi pozorna na besedico AMPAK. Preden jo izgovoriš, se raje zaustavi, naredi piko, vdihni, pomisli in nato nadaljuj pogovor.`
);

function escapeHtmlCourse(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showCourseLoader() {
    const overlay = document.getElementById('courseLoadingOverlay');
    if (overlay) overlay.classList.add('show');
}

function hideCourseLoader() {
    const overlay = document.getElementById('courseLoadingOverlay');
    if (overlay) overlay.classList.remove('show');
}

function buildMocBesedeEpisodes(existingEpisodes = []) {
    const byTitle = new Map((existingEpisodes || []).map(ep => [String(ep.title || '').trim(), ep]));

    const episodes = [
        {
            id: '1',
            title: 'Uvod',
            description: 'Uvod v delavnico Moč besede.',
            videoUrl: MOC_BESEDE_UVOD_VIDEO_URL,
            duration: ''
        }
    ];

    MOC_BESSEDE_WORDS.forEach((word, idx) => {
        const existing = byTitle.get(word);
        const meta = MOC_BESSEDE_META.get(normalizeWordKey(word));
        const fromExisting = existing && existing.videoUrl ? String(existing.videoUrl).trim() : '';
        const fromMap = MOC_BESEDE_WORD_VIDEO_URLS.get(normalizeWordKey(word)) || '';
        episodes.push({
            id: String(idx + 2),
            title: word,
            description: meta?.description || `Epizoda o besedi: ${word}`,
            exercise: meta?.exercise || `Zapišite 3 stavke, kjer besedo "${word}" zavestno zamenjate z bolj podporno in ljubečo različico.`,
            videoUrl: fromExisting || fromMap,
            duration: existing && existing.duration ? String(existing.duration) : ''
        });
    });

    return episodes;
}

async function buildMocBesedeEpisodesFromFirestore() {
    try {
        const ready = await waitForFirestoreReady();
        if (!ready) return null;

        const snap = await db.collection('moc_besede_words').get();
        if (snap.empty) return null;

        const docs = snap.docs.map(doc => {
            const data = doc.data() || {};
            return {
                id: doc.id,
                title: String(data.word || doc.id || '').trim(),
                description: String(data.description || '').trim(),
                exercise: String(data.exercise || '').trim(),
                sort: Number.isFinite(Number(data.sort)) ? Number(data.sort) : 9999,
                videoUrl: String(data.videoUrl || '').trim()
            };
        });

        docs.sort((a, b) => {
            if (a.sort !== b.sort) return a.sort - b.sort;
            return a.title.localeCompare(b.title, 'sl');
        });

        const episodes = [];
        docs.forEach((item, idx) => {
            episodes.push({
                id: String(idx + 1),
                title: item.title,
                description: item.description || `Epizoda o besedi: ${item.title}`,
                exercise: item.exercise || `Zapišite 3 stavke, kjer besedo "${item.title}" zavestno zamenjate z bolj podporno in ljubečo različico.`,
                videoUrl: item.videoUrl || '',
                duration: ''
            });
        });

        return episodes;
    } catch (error) {
        console.error('Error loading moc_besede_words from Firestore:', error);
        return null;
    }
}

// Initialize course data structure
function initCourseData() {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    
    // Add episodes to courses if they don't have them
    courses.forEach(course => {
        if (!course.episodes || course.episodes.length === 0) {
            if (course.id === 'moc-besede') {
                course.episodes = buildMocBesedeEpisodes(course.episodes || []);
            } else {
            course.episodes = [
                {
                    id: '1',
                    title: 'Uvod v tečaj',
                    description: 'Spoznajte osnove in začnite svojo pot.',
                    videoUrl: '',
                    duration: '10 min'
                },
                {
                    id: '2',
                    title: 'Glavna vsebina',
                    description: 'Poglobljeno delo z vsebino tečaja.',
                    videoUrl: '',
                    duration: '20 min'
                }
            ];
            }
        }
    });
    
    localStorage.setItem('courses', JSON.stringify(courses));
}

// Get course ID from URL
function getCourseId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function getWebinarId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('webinar');
}

// Morata se ujemati s STOPNIC_WEBINAR_VIMEO_URL v community.js (Vimeo iframe src)
const STOPNIC_WEBINAR_VIMEO_FALLBACK = 'https://player.vimeo.com/video/1179302920?badge=0&autopause=0&player_id=0&app_id=58479';

function patchStopnicWebinarVideoUrls(webinars) {
    const list = Array.isArray(webinars) ? webinars.map(w => ({ ...w })) : [];
    return list.map(w => {
        const t = String(w.title || '').trim();
        if (t === '25 Stopnic do sreče' || t === '25 Stopnic do srece') {
            return {
                ...w,
                title: '25 Stopnic do sreče',
                videoId: w.videoId || '1179302920',
                videoUrl: w.videoUrl || STOPNIC_WEBINAR_VIMEO_FALLBACK
            };
        }
        return w;
    });
}

function getActiveContentId() {
    const courseId = getCourseId();
    if (courseId) return courseId;
    const webinarId = getWebinarId();
    return webinarId ? `webinar-${webinarId}` : null;
}

function getEpisodeQueryFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('episode');
}

async function resolveInitialEpisodeId(course) {
    const fromUrl = getEpisodeQueryFromUrl();
    if (fromUrl && course.episodes?.some(e => String(e.id) === String(fromUrl))) {
        return String(fromUrl);
    }

    const user = getCurrentUser();
    if (user && user.userId && typeof db !== 'undefined') {
        try {
            const snap = await db.collection('users').doc(user.userId).get();
            const cloud = snap.exists && snap.data().lastCourseResume;
            if (cloud && cloud.courseId === course.id && cloud.episodeId) {
                const eid = String(cloud.episodeId);
                if (course.episodes.some(ep => String(ep.id) === eid)) return eid;
            }
        } catch (e) {
            /* ignore */
        }
    }

    try {
        const resume = JSON.parse(localStorage.getItem('courseLastResume') || 'null');
        if (resume && resume.courseId === course.id && resume.episodeId) {
            const eid = String(resume.episodeId);
            if (course.episodes.some(ep => String(ep.id) === eid)) return eid;
        }
    } catch (e) {
        /* ignore */
    }

    return course.episodes?.[0]?.id != null ? String(course.episodes[0].id) : null;
}

async function persistLastCourseResume(courseId, episodeId) {
    try {
        const payload = { courseId, episodeId: String(episodeId), ts: Date.now() };
        localStorage.setItem('courseLastResume', JSON.stringify(payload));
        const user = getCurrentUser();
        if (!user || !user.userId || typeof db === 'undefined') return;
        await db.collection('users').doc(user.userId).set({
            lastCourseResume: {
                courseId,
                episodeId: String(episodeId),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true });
    } catch (e) {
        console.warn('persistLastCourseResume', e);
    }
}

async function waitForFirestoreReady(maxMs = 5000) {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
        if (typeof db !== 'undefined' && db) return true;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return typeof db !== 'undefined' && !!db;
}

// Load course
async function loadCourse() {
    const courseId = getCourseId();
    const webinarId = getWebinarId();
    const isWebinar = !!webinarId && !courseId;

    if (!courseId && !webinarId) {
        window.location.href = '/dashboard';
        return;
    }

    // Firebase init runs asynchronously in /course; wait a bit so Firestore reads don't fallback too early.
    await waitForFirestoreReady();
    
    let course = null;
    
    if (isWebinar) {
        let webinars = JSON.parse(localStorage.getItem('webinars') || '[]');

        try {
            if (typeof db !== 'undefined') {
                const webinarsSnapshot = await db.collection('webinars').get();
                if (!webinarsSnapshot.empty) {
                    webinars = webinarsSnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            title: data.title,
                            date: data.date,
                            description: data.description,
                            videoId: data.videoId,
                            videoUrl: data.videoUrl
                        };
                    });
                    localStorage.setItem('webinars', JSON.stringify(webinars));
                }
            }
        } catch (error) {
            console.error('Error loading webinars from Firestore:', error);
        }

        webinars = patchStopnicWebinarVideoUrls(webinars);
        localStorage.setItem('webinars', JSON.stringify(webinars));

        let webinar = webinars.find(w => String(w.id) === String(webinarId));
        if (!webinar && String(webinarId) === '2') {
            webinar = webinars.find(w => {
                const t = String(w.title || '').trim();
                return t === '25 Stopnic do sreče' || t === '25 Stopnic do srece';
            });
        }
        if (webinar) {
            course = {
                id: `webinar-${webinar.id}`,
                title: webinar.title || 'Webinar',
                description: webinar.description || '',
                episodes: [
                    {
                        id: '1',
                        title: webinar.title || 'Webinar',
                        description: webinar.description || 'Posnetek webinarja',
                        videoUrl: webinar.videoUrl || '',
                        duration: ''
                    }
                ],
                progress: 0,
                completed: false
            };

            // cache webinar content as a course-like item for progress handling
            const courses = JSON.parse(localStorage.getItem('courses') || '[]');
            const existingIndex = courses.findIndex(c => c.id === course.id);
            if (existingIndex !== -1) courses[existingIndex] = course;
            else courses.push(course);
            localStorage.setItem('courses', JSON.stringify(courses));
        }
    } else {
    // Try to load from Firestore first
    try {
        if (typeof db !== 'undefined') {
            const courseDoc = await db.collection('courses').doc(courseId).get();
            
            if (courseDoc.exists) {
                const data = courseDoc.data();
                course = {
                    id: courseDoc.id,
                    title: data.title,
                    description: data.description,
                    episodes: data.episodes || [],
                    progress: data.progress || 0,
                    completed: data.completed || false
                };
                
                // Update localStorage cache
                const courses = JSON.parse(localStorage.getItem('courses') || '[]');
                const courseIndex = courses.findIndex(c => c.id === courseId);
                if (courseIndex !== -1) {
                    courses[courseIndex] = course;
                } else {
                    courses.push(course);
                }
                localStorage.setItem('courses', JSON.stringify(courses));
                console.log('Loaded course from Firestore');
            }
        }
    } catch (error) {
        console.error('Error loading course from Firestore:', error);
    }
    
    // Fallback to localStorage
    if (!course) {
        initCourseData();
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        course = courses.find(c => c.id === courseId);
        }
    }
    
    // Hard fallback for Moč besede so the page always opens
    if (!course && courseId === 'moc-besede') {
        course = {
            id: 'moc-besede',
            title: 'Moč besede',
            description: '30-dnevna e-delavnica',
            episodes: buildMocBesedeEpisodes(),
            progress: 0,
            completed: false
        };

        // Cache fallback course so progress calculations can find it
        const coursesCache = JSON.parse(localStorage.getItem('courses') || '[]');
        const existing = coursesCache.findIndex(c => c.id === 'moc-besede');
        if (existing !== -1) coursesCache[existing] = course;
        else coursesCache.push(course);
        localStorage.setItem('courses', JSON.stringify(coursesCache));
    }
    
    if (!course) {
        window.location.href = '/dashboard';
        return;
    }

    // Moč besede: prefer Firestore collection moc_besede_words, fallback to local canonical list
    if (course.id === 'moc-besede') {
        const firestoreEpisodes = await buildMocBesedeEpisodesFromFirestore();
        course.episodes = firestoreEpisodes && firestoreEpisodes.length > 1
            ? firestoreEpisodes
            : buildMocBesedeEpisodes(course.episodes || []);
        const uvodEpisode = (course.episodes || []).find(ep => String(ep.title || '').trim().toLowerCase() === 'uvod');
        if (uvodEpisode && !String(uvodEpisode.videoUrl || '').trim()) {
            uvodEpisode.videoUrl = MOC_BESEDE_UVOD_VIDEO_URL;
        }
        applyMocBesedeDefaultVideoUrls(course.episodes);
        // keep local cache in sync with canonical episode list
        const cachedCourses = JSON.parse(localStorage.getItem('courses') || '[]');
        const idx = cachedCourses.findIndex(c => c.id === 'moc-besede');
        if (idx !== -1) cachedCourses[idx] = { ...cachedCourses[idx], episodes: course.episodes };
        else cachedCourses.push({ ...course });
        localStorage.setItem('courses', JSON.stringify(cachedCourses));
    }
    
    // Access check
    const user = getCurrentUser();
    if (user && user.role === 'guest' && isWebinar) {
        showNoAccessPopupCoursePage();
        return;
    }
    if (user && user.role === 'guest' && !isWebinar) {
        let purchased = user.purchasedCourses || [];
        if (typeof db !== 'undefined' && user.userId) {
            try {
                const userDoc = await db.collection('users').doc(user.userId).get();
                if (userDoc.exists && userDoc.data().purchasedCourses) {
                    purchased = userDoc.data().purchasedCourses;
                    const cachedPurchased = Array.isArray(user.purchasedCourses) ? user.purchasedCourses : [];
                    const changed = cachedPurchased.length !== purchased.length || cachedPurchased.some(id => !purchased.includes(id));
                    if (changed) {
                        const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
                        u.purchasedCourses = purchased;
                        localStorage.setItem('currentUser', JSON.stringify(u));
                    }
                }
            } catch (e) { console.error('Error fetching user purchases:', e); }
        }
        if (!purchased.includes(course.id)) {
            showNoAccessPopupCoursePage();
            return;
        }
    }
    
    // Set header title
    document.getElementById('courseHeaderTitle').textContent = course.title;
    if (isWebinar) {
        const progressLabel = document.querySelector('.progress-label');
        const episodesTitle = document.querySelector('.episodes-title');
        if (progressLabel) progressLabel.textContent = 'Napredek vsebine';
        if (episodesTitle) episodesTitle.textContent = 'Vsebina';
    }
    
    // Load episodes
    await loadEpisodes(course);
    
    // Update progress
    await updateCourseProgress(course.id);
    
    if (course.episodes && course.episodes.length > 0) {
        const initialId = await resolveInitialEpisodeId(course);
        if (initialId) {
            await loadEpisodeContent(initialId, course);
        }
    }
}

// Get watched episodes for a course
async function getWatchedEpisodes(courseId) {
    const user = getCurrentUser();
    if (!user || !user.userId) {
        // Fallback to localStorage
        const watched = JSON.parse(localStorage.getItem('watchedEpisodes') || '{}');
        return watched[courseId] || [];
    }
    
    try {
        // Try to get from Firestore
        if (typeof db !== 'undefined') {
            const progressDoc = await db.collection('userProgress').doc(`${user.userId}_${courseId}`).get();
            
            if (progressDoc.exists) {
                const data = progressDoc.data();
                const watchedEpisodes = (data.watchedEpisodes || []).map(id => String(id));
                
                // Cache in localStorage
                const watched = JSON.parse(localStorage.getItem('watchedEpisodes') || '{}');
                watched[courseId] = watchedEpisodes;
                localStorage.setItem('watchedEpisodes', JSON.stringify(watched));
                
                return watchedEpisodes;
            }
        }
    } catch (error) {
        console.error('Error loading watched episodes from Firestore:', error);
    }
    
    // Fallback to localStorage
    const watched = JSON.parse(localStorage.getItem('watchedEpisodes') || '{}');
    return (watched[courseId] || []).map(id => String(id));
}

// Mark episode as watched/unwatched
async function toggleEpisodeWatched(courseId, episodeId, isWatched) {
    const user = getCurrentUser();
    if (!user || !user.userId) {
        // Fallback to localStorage only
        const watched = JSON.parse(localStorage.getItem('watchedEpisodes') || '{}');
        if (!watched[courseId]) {
            watched[courseId] = [];
        }
        
        if (isWatched) {
            if (!watched[courseId].includes(episodeId)) {
                watched[courseId].push(episodeId);
            }
        } else {
            watched[courseId] = watched[courseId].filter(id => id !== episodeId);
        }
        
        localStorage.setItem('watchedEpisodes', JSON.stringify(watched));
        updateCourseProgress(courseId);
        return;
    }
    
    // Get current watched episodes
    const currentWatched = await getWatchedEpisodes(courseId);
    let newWatched = [...currentWatched];
    const normalizedEpisodeId = String(episodeId);
    
    if (isWatched) {
        if (!newWatched.includes(normalizedEpisodeId)) {
            newWatched.push(normalizedEpisodeId);
        }
    } else {
        newWatched = newWatched.filter(id => String(id) !== normalizedEpisodeId);
    }
    
    // Update localStorage cache
    const watched = JSON.parse(localStorage.getItem('watchedEpisodes') || '{}');
    watched[courseId] = newWatched;
    localStorage.setItem('watchedEpisodes', JSON.stringify(watched));
    
    // Save to Firestore
    try {
        if (typeof db !== 'undefined') {
            const courses = JSON.parse(localStorage.getItem('courses') || '[]');
            const course = courses.find(c => c.id === courseId);
            const totalEpisodes = course?.episodes?.length || 0;
            const progress = totalEpisodes > 0 ? Math.round((newWatched.length / totalEpisodes) * 100) : 0;
            
            await db.collection('userProgress').doc(`${user.userId}_${courseId}`).set({
                userId: user.userId,
                courseId: courseId,
                watchedEpisodes: newWatched,
                progress: progress,
                completed: progress === 100,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
    } catch (error) {
        console.error('Error saving course progress to Firestore:', error);
    }
    
    updateCourseProgress(courseId);
    
    // Update checkbox if it exists
    const checkbox = document.querySelector(`input[onclick*="${episodeId}"]`);
    if (checkbox) {
        checkbox.checked = isWatched;
    }
    
    // Update episode item styling
    const episodeItem = document.querySelector(`[data-episode-id="${episodeId}"]`);
    if (episodeItem) {
        if (isWatched) {
            episodeItem.classList.add('watched');
        } else {
            episodeItem.classList.remove('watched');
        }
    }
}

// Calculate and update course progress
async function updateCourseProgress(courseId) {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    const course = courses.find(c => c.id === courseId);
    if (!course || !course.episodes) return;
    
    const watched = await getWatchedEpisodes(courseId);
    const totalEpisodes = course.episodes.length;
    const watchedCount = watched.length;
    const progress = totalEpisodes > 0 ? Math.round((watchedCount / totalEpisodes) * 100) : 0;
    
    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
    if (progressPercentage) {
        progressPercentage.textContent = progress + '%';
    }
    
    // Update course completion status
    course.progress = progress;
    course.completed = progress === 100;
    localStorage.setItem('courses', JSON.stringify(courses));
    
    return progress;
}

// Load episodes list
async function loadEpisodes(course) {
    const episodesList = document.getElementById('episodesList');
    const courseId = course.id;
    const watched = await getWatchedEpisodes(courseId);
    
    if (!course.episodes || course.episodes.length === 0) {
        episodesList.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 20px;">Ni epizod.</p>';
        return;
    }
    
    episodesList.innerHTML = course.episodes.map((episode, index) => {
        const isWatched = watched.includes(episode.id);
        return `
            <div class="episode-item ${isWatched ? 'watched' : ''}" onclick="loadEpisodeContent('${episode.id}', null, this)" data-episode-id="${episode.id}">
                <input type="checkbox" class="episode-checkbox" ${isWatched ? 'checked' : ''} onclick="event.stopPropagation(); toggleEpisodeWatched('${courseId}', '${episode.id}', this.checked); const course = getCurrentCourse(); if (course) loadEpisodes(course);" />
                <div class="episode-content">
                    <div class="episode-number">Epizoda ${index + 1}</div>
                    <div class="episode-title">${episode.title}</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Update progress
    await updateCourseProgress(courseId);
    syncEpisodesPanelForViewport();
}

// Get current course
function getCurrentCourse() {
    const courseId = getActiveContentId();
    if (!courseId) return null;
    
    const courses = JSON.parse(localStorage.getItem('courses') || '[]');
    return courses.find(c => c.id === courseId);
}

function isMobileViewport() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function setEpisodesPanelOpen(open) {
    const panel = document.querySelector('.course-episodes');
    const btn = document.getElementById('episodesToggleBtn');
    if (!panel || !btn) return;

    if (isMobileViewport()) {
        panel.classList.toggle('mobile-collapsed', !open);
        btn.textContent = open ? 'Skrij epizode' : 'Izberi epizodo';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    } else {
        panel.classList.remove('mobile-collapsed');
        btn.textContent = 'Izberi epizodo';
        btn.setAttribute('aria-expanded', 'false');
    }
}

window.toggleEpisodesPanel = function() {
    const panel = document.querySelector('.course-episodes');
    if (!panel) return;
    const isOpen = !panel.classList.contains('mobile-collapsed');
    setEpisodesPanelOpen(!isOpen);
};

function syncEpisodesPanelForViewport() {
    if (isMobileViewport()) {
        setEpisodesPanelOpen(false);
    } else {
        setEpisodesPanelOpen(true);
    }
}

// Load episode content
async function loadEpisodeContent(episodeId, course = null, element = null) {
    if (!course) {
        const courseId = getActiveContentId();
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        course = courses.find(c => c.id === courseId);
    }
    
    if (!course || !course.episodes) return;
    
    const episode = course.episodes.find(e => e.id === episodeId);
    if (!episode) return;
    
    // Update active episode
    if (element) {
        document.querySelectorAll('.episode-item').forEach(item => {
            item.classList.remove('active');
        });
        element.classList.add('active');
    } else {
        document.querySelectorAll('.episode-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-episode-id') === episodeId) {
                item.classList.add('active');
            }
        });
    }
    
    // Check episode position
    const episodeIndex = course.episodes.findIndex(e => e.id === episodeId);
    const hasPrevious = episodeIndex > 0;
    const hasNext = episodeIndex < course.episodes.length - 1;
    const previousEpisode = hasPrevious ? course.episodes[episodeIndex - 1] : null;
    const nextEpisode = hasNext ? course.episodes[episodeIndex + 1] : null;
    
    // Check if current episode is watched
    const watched = await getWatchedEpisodes(course.id);
    const isWatched = watched.includes(episodeId);
    const isWebinarCourse = String(course.id).startsWith('webinar-');
    const savedExerciseNote = isWebinarCourse ? '' : await getEpisodeExerciseNote(course.id, episodeId);
    const actionDone = !!String(savedExerciseNote || '').trim();
    const commentsHtml = await buildCommentsHtml(course, episode);
    const exerciseText = episode.exercise || `Izberite eno situacijo danes in namesto izraza "${episode.title}" uporabite bolj podporno besedo.`;
    
    // Load content
    const contentArea = document.getElementById('courseContentArea');
    contentArea.innerHTML = `
        <div class="course-content-title">${episode.title}</div>
        <div class="course-video">
            ${episode.videoUrl ? `
                <iframe
                    src="${episode.videoUrl}"
                    title="${escapeHtmlCourse(episode.title || 'Video')}"
                    frameborder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen
                    style="position:absolute;top:0;left:0;width:100%;height:100%;"
                ></iframe>
            ` : '<p class="course-video-placeholder">Ta video je zaseben.</p>'}
        </div>

        <div class="episode-nav-bar">
            <button class="episode-nav-btn" ${hasPrevious ? '' : 'disabled'} onclick="${hasPrevious ? `goToEpisode('${course.id}', '${previousEpisode.id}')` : ''}">← Prejšnja</button>
            <button class="episode-nav-btn" ${hasNext ? '' : 'disabled'} onclick="${hasNext ? `goToEpisode('${course.id}', '${nextEpisode.id}')` : ''}">Naslednja →</button>
        </div>

        <div class="course-description">${escapeHtmlCourse(episode.description || 'Opis epizode bo kmalu na voljo.')}</div>

        ${!isWebinarCourse ? `
        <div class="episode-exercise">
            <h4>Vaja:</h4>
            <p>${escapeHtmlCourse(exerciseText)}</p>
            <label class="exercise-note-label" for="exerciseNoteInput">Moji zapiski</label>
            <textarea id="exerciseNoteInput" class="exercise-note-input" rows="5" placeholder="Sem napiši svoje zapiske o tej vaji...">${escapeHtmlCourse(savedExerciseNote)}</textarea>
            <button type="button" class="save-exercise-note-btn" onclick="saveEpisodeExerciseNote('${course.id}', '${episode.id}')">Shrani svoje zapiske</button>
            <div id="exerciseNoteStatus" class="exercise-note-status ${actionDone ? 'done' : ''}">
                ${actionDone ? 'Vaja je označena kot narejena.' : 'Ko shraniš zapiske, se vaja označi kot narejena.'}
            </div>
        </div>
        ` : ''}

        <div class="episode-comments">
            <h4>Moj komentar</h4>
            ${commentsHtml}
        </div>

        <div class="episode-actions">
            ${hasNext ? `
                <button class="next-episode-btn" onclick="markAsWatchedAndNext('${course.id}', '${episodeId}', '${nextEpisode.id}')">
                    ✓ Označi kot ogledano in pojdi na naslednjo epizodo →
                </button>
            ` : `
                <button class="finish-course-btn" onclick="finishCourse('${course.id}', '${episodeId}')">
                    🎉 Zaključi ta tečaj
                </button>
            `}
        </div>
    `;

    void persistLastCourseResume(course.id, episodeId);

    // Keep episode list collapsed on mobile after selection
    if (isMobileViewport()) {
        setEpisodesPanelOpen(false);
    }
}

window.goToEpisode = function(courseId, targetEpisodeId) {
    const course = getCurrentCourse();
    if (!course || course.id !== courseId) return;
    const targetEl = document.querySelector(`[data-episode-id="${targetEpisodeId}"]`);
    loadEpisodeContent(targetEpisodeId, course, targetEl || null);
};

function getCurrentEpisodeIdFromUI() {
    const active = document.querySelector('.episode-item.active');
    if (active) {
        return active.getAttribute('data-episode-id');
    }
    return null;
}

function goToAdjacentEpisode(direction) {
    const course = getCurrentCourse();
    if (!course || !Array.isArray(course.episodes) || course.episodes.length === 0) return;

    const currentEpisodeId = getCurrentEpisodeIdFromUI() || String(course.episodes[0].id);
    const currentIndex = course.episodes.findIndex(e => String(e.id) === String(currentEpisodeId));
    if (currentIndex === -1) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= course.episodes.length) return;

    const targetEpisode = course.episodes[targetIndex];
    const targetEl = document.querySelector(`[data-episode-id="${targetEpisode.id}"]`);
    loadEpisodeContent(String(targetEpisode.id), course, targetEl || null);
}

async function getExerciseNotes(courseId) {
    const user = getCurrentUser();
    if (!user || !user.userId) {
        const local = JSON.parse(localStorage.getItem('exerciseNotes') || '{}');
        const notes = local[courseId] || {};
        return notes && typeof notes === 'object' ? notes : {};
    }
    try {
        if (typeof db !== 'undefined') {
            const progressDoc = await db.collection('userProgress').doc(`${user.userId}_${courseId}`).get();
            if (progressDoc.exists) {
                const notesRaw = progressDoc.data().exerciseNotes || {};
                const notes = {};
                Object.keys(notesRaw || {}).forEach(k => {
                    notes[String(k)] = String(notesRaw[k] || '');
                });
                const local = JSON.parse(localStorage.getItem('exerciseNotes') || '{}');
                local[courseId] = notes;
                localStorage.setItem('exerciseNotes', JSON.stringify(local));
                return notes;
            }
        }
    } catch (e) {
        console.error('Error loading exercise notes:', e);
    }
    const local = JSON.parse(localStorage.getItem('exerciseNotes') || '{}');
    const notes = local[courseId] || {};
    return notes && typeof notes === 'object' ? notes : {};
}

async function getEpisodeExerciseNote(courseId, episodeId) {
    const notes = await getExerciseNotes(courseId);
    return String(notes[String(episodeId)] || '');
}

window.saveEpisodeExerciseNote = async function(courseId, episodeId) {
    const user = getCurrentUser();
    const normalized = String(episodeId);
    const input = document.getElementById('exerciseNoteInput');
    const status = document.getElementById('exerciseNoteStatus');
    if (!input) return;
    const noteValue = String(input.value || '');

    const current = await getExerciseNotes(courseId);
    const next = { ...(current || {}) };
    if (noteValue.trim()) {
        next[normalized] = noteValue;
    } else {
        delete next[normalized];
    }

    const local = JSON.parse(localStorage.getItem('exerciseNotes') || '{}');
    local[courseId] = next;
    localStorage.setItem('exerciseNotes', JSON.stringify(local));

    try {
        if (user && user.userId && typeof db !== 'undefined') {
            await db.collection('userProgress').doc(`${user.userId}_${courseId}`).set({
                userId: user.userId,
                courseId: courseId,
                exerciseNotes: next,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        if (status) {
            if (noteValue.trim()) {
                status.textContent = 'Vaja je označena kot narejena.';
                status.classList.add('done');
            } else {
                status.textContent = 'Zapiski so prazni. Vaja ni označena kot narejena.';
                status.classList.remove('done');
            }
        }
        alert('Zapiski so shranjeni.');
    } catch (e) {
        console.error('Error saving exercise note:', e);
        alert('Pri shranjevanju zapiskov je prišlo do napake.');
    }
};

async function buildCommentsHtml(course, episode) {
    const user = getCurrentUser();
    if (!user || !user.userId) {
        return '<p style="color: var(--text-light);">Prijavite se za komentarje.</p>';
    }

    const episodeKey = `${course.id}_${episode.id}`;
    let myComment = '';
    let allComments = [];

    try {
        if (typeof db !== 'undefined') {
            const myDocId = `${episodeKey}_${user.userId}`;
            const myDoc = await db.collection('episodeComments').doc(myDocId).get();
            if (myDoc.exists) {
                myComment = myDoc.data().comment || '';
            }

            if (user.role === 'admin') {
                const snap = await db.collection('episodeComments').where('episodeKey', '==', episodeKey).get();
                allComments = snap.docs.map(d => d.data());
            }
        }
    } catch (e) {
        console.error('Error loading comments:', e);
    }

    let adminSection = '';
    if (user.role === 'admin') {
        adminSection = `
            <div class="admin-comments-list">
                <h5>Komentarji uporabnic</h5>
                ${(allComments && allComments.length > 0) ? allComments.map(c => `
                    <div class="admin-comment-item">
                        <div class="admin-comment-meta">${escapeHtmlCourse(c.userName || c.userEmail || 'Uporabnica')}</div>
                        <div>${escapeHtmlCourse(c.comment || '')}</div>
                    </div>
                `).join('') : '<p style="color: var(--text-light); margin: 0;">Za to epizodo še ni komentarjev.</p>'}
            </div>
        `;
    }

    return `
        <textarea id="episodeCommentInput" class="episode-comment-input" rows="4" placeholder="Napiši svoj komentar...">${escapeHtmlCourse(myComment)}</textarea>
        <button type="button" class="save-comment-btn" onclick="saveEpisodeComment('${course.id}', '${episode.id}')">Shrani komentar</button>
        ${adminSection}
    `;
}

window.saveEpisodeComment = async function(courseId, episodeId) {
    const user = getCurrentUser();
    if (!user || !user.userId) return;
    const input = document.getElementById('episodeCommentInput');
    if (!input) return;
    const comment = (input.value || '').trim();
    const episodeKey = `${courseId}_${episodeId}`;

    try {
        if (typeof db !== 'undefined') {
            const docId = `${episodeKey}_${user.userId}`;
            await db.collection('episodeComments').doc(docId).set({
                episodeKey: episodeKey,
                courseId: courseId,
                episodeId: String(episodeId),
                userId: user.userId,
                userName: user.name || '',
                userEmail: user.email || '',
                comment: comment,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        alert('Komentar je shranjen.');
    } catch (e) {
        console.error('Error saving comment:', e);
        alert('Pri shranjevanju komentarja je prišlo do napake.');
    }
};

async function markAsWatchedAndNext(courseId, currentEpisodeId, nextEpisodeId) {
    // Mark current episode as watched
    await toggleEpisodeWatched(courseId, currentEpisodeId, true);
    
    // Update checkbox in episodes list
    const currentCheckbox = document.querySelector(`input[onclick*="${currentEpisodeId}"]`);
    if (currentCheckbox) {
        currentCheckbox.checked = true;
    }
    
    // Update episode item styling
    const currentEpisodeItem = document.querySelector(`[data-episode-id="${currentEpisodeId}"]`);
    if (currentEpisodeItem) {
        currentEpisodeItem.classList.add('watched');
    }
    
    // Reload episodes list to update styling
    const course = getCurrentCourse();
    if (course) {
        await loadEpisodes(course);
        
        // Load next episode
        setTimeout(() => {
            const nextEpisodeElement = document.querySelector(`[data-episode-id="${nextEpisodeId}"]`);
            if (nextEpisodeElement) {
                loadEpisodeContent(nextEpisodeId, course, nextEpisodeElement);
            }
        }, 100);
    }
}

async function finishCourse(courseId, episodeId) {
    // Mark last episode as watched
    await toggleEpisodeWatched(courseId, episodeId, true);
    
    // Update checkbox in episodes list
    const currentCheckbox = document.querySelector(`input[onclick*="${episodeId}"]`);
    if (currentCheckbox) {
        currentCheckbox.checked = true;
    }
    
    // Update episode item styling
    const currentEpisodeItem = document.querySelector(`[data-episode-id="${episodeId}"]`);
    if (currentEpisodeItem) {
        currentEpisodeItem.classList.add('watched');
    }
    
    // Reload episodes list to update styling
    const course = getCurrentCourse();
    if (course) {
        await loadEpisodes(course);
    }
    
    // Show congratulations popup
    showCongratulationsPopup();
}

function showCongratulationsPopup() {
    const popup = document.createElement('div');
    popup.className = 'congratulations-popup';
    popup.innerHTML = `
        <div class="congratulations-content">
            <div class="congratulations-icon">🎉</div>
            <h2 class="congratulations-title">Čestitamo!</h2>
            <p class="congratulations-message">Uspešno ste zaključili ta tečaj!</p>
            <a href="/dashboard" class="congratulations-btn">Nazaj na domačo stran</a>
        </div>
    `;
    document.body.appendChild(popup);
    
    // Remove popup when clicking outside
    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            popup.remove();
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    showCourseLoader();
    loadCourse().finally(() => {
        hideCourseLoader();
    });
    syncEpisodesPanelForViewport();
    window.addEventListener('resize', syncEpisodesPanelForViewport);
});

document.addEventListener('keydown', function(e) {
    // Avoid hijacking keyboard navigation while typing in form fields/content editable
    const target = e.target;
    const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
    const isTypingContext = tag === 'input' || tag === 'textarea' || (target && target.isContentEditable);
    if (isTypingContext) return;

    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToAdjacentEpisode(-1);
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToAdjacentEpisode(1);
    }
});

function showNoAccessPopupCoursePage() {
    const overlay = document.createElement('div');
    overlay.id = 'noAccessCourseModal';
    overlay.className = 'no-access-course-overlay';
    overlay.innerHTML = `
        <div class="no-access-course-box">
            <h3>Nimate dostopa do te vsebine</h3>
            <p>Kupite ta tečaj v spletni trgovini ali se pridružite celotni skupini za 119 € in dobite dostop do vsega!</p>
            <div class="no-access-course-btns">
                <a href="/spletna-trgovina" class="no-acc-btn no-acc-btn-primary">Kupi tečaj</a>
                <a href="/jaz-zenska" class="no-acc-btn no-acc-btn-secondary">Celotna skupina (119 €)</a>
            </div>
            <a href="/dashboard" class="no-acc-back">← Nazaj na učilnico</a>
        </div>
    `;
    const style = document.createElement('style');
    style.textContent = `
        .no-access-course-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.75); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .no-access-course-box { background: var(--white); border-radius: 20px; padding: 40px; max-width: 440px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
        .no-access-course-box h3 { font-family: 'Playfair Display', serif; font-size: 24px; color: var(--dark-violet); margin: 0 0 16px; }
        .no-access-course-box p { color: var(--text-dark); font-size: 16px; line-height: 1.7; margin: 0 0 28px; }
        .no-access-course-btns { display: flex; flex-direction: column; gap: 12px; }
        .no-acc-btn { display: block; text-align: center; padding: 14px 24px; border-radius: 50px; font-size: 16px; font-weight: 600; text-decoration: none; transition: all 0.3s ease; }
        .no-acc-btn-primary { background: linear-gradient(135deg, #99627A 0%, #643843 100%); color: white; box-shadow: 0 6px 24px rgba(100,56,67,0.35); }
        .no-acc-btn-primary:hover { transform: translateY(-2px); }
        .no-acc-btn-secondary { background: var(--main-white); color: var(--dark-violet); border: 2px solid var(--mid-violet); }
        .no-acc-btn-secondary:hover { background: rgba(153,98,122,0.1); }
        .no-acc-back { display: inline-block; margin-top: 20px; color: var(--mid-violet); font-weight: 600; font-size: 14px; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);
}
