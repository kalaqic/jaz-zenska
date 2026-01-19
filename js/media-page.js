// Media Page JavaScript

// Media data with full content
const mediaData = {
    1: {
        image: 'images/media/zmajcek isce prijatelje.jpg',
        title: 'Projektni teden Zmajček išče prijatelje',
        description: `
            <p>V času od 13. do 17. novembra 2023 so se učenci skupaj z mentorji in gostjo Marjanco Trščinar Antić družili v projektnem tednu Zmajček išče prijatelje.</p>
            <p>Projektnega tedena se je udeležilo kar 45 učencev z 12 mentorji. Udeleženci so v dramski, glasbeni, likovni, tehnični, plesni, ustvarjalni ter delavnici družabnih iger razvijali svoje talente, se pripravljali na nastop na novoletni prireditvi in pridobivali socialne veščine.</p>
            <p>Bili so zelo navdušeni nad pravljico o Zmajčku, saj jim jo je pripovedovala avtorica Marjanca, zato v delavnicah ni bilo težko biti zavzet in ustvarjalen. Seveda so se stkala tudi raznovrstna prijateljstva.</p>
            <p>Oglejte si video z Marjanco na YouTube kanalu.</p>
        `,
        links: [
            {
                url: 'https://dknm.splet.arnes.si/2023/11/14/projektni-teden-zmajcek-isce-prijatelje/',
                text: 'Oglej si Medijski Članek o tem projektu'
            },
            {
                url: 'https://www.youtube.com/watch?v=97CSHAJZdUE',
                text: 'Oglej si video'
            }
        ]
    },
    3: {
        image: 'images/media/obscinska nagrajevalka.jpeg',
        title: 'Občinska nagrajenka Marjanca Trščinar Antić',
        description: `
            <p>»Skupaj lahko spreminjamo svet na bolje tako, da spreminjamo sebe, da sledimo svojim sanjam in postanemo srečnejši. Že Albert Einstein je rekel, da je norost vedno znova delati iste stvari in pričakovati drugačne rezultate,« meni Marjanca Trščinar Antić, ena od najbolj predanih ambasadork turizma v Novem mestu in tudi širše na Dolenjskem.</p>
            <p>Za dolgoletno uspešno delovanje v turizmu je ob letošnjem občinskem prazniku prejela Nagrado Mestne občine Novo mesto.</p>
            <p>Sama že vse življenje sledi svojim sanjam, pa čeprav velikokrat ni bilo lahko. Po poklicu je vzgojiteljica, študirala je pedagogiko in sociologijo, a študija zavoljo ljubezni, ki jo je leta 1984 odpeljala na Korčulo, ni končala. »Tam sem zajadrala v turizem, mož Stane pa je delal kot ladijski mehanik. Dobila sva hčerko Tino in sina Borisa, počasi s krediti zgradila dom. Najverjetneje bi še danes živeli tam, če ne bi bil mož med vojno ranjen in je bil invalidsko upokojen, jaz pa sem tako kot mnogi drugi ostala brez dela. Še danes ne vem, kako smo preživeli, a nikoli nisem obupala. To je bilo obdobje velikih preizkušenj, na drugi strani pa tudi obdobje kaljenja, učenja in povezovanja,« obuja spomine in doda, da je kljub vsemu vedno nekje globoko v sebi vedela, da je na pravi poti in da ji bodo vse te izkušnje prišle še kako prav.</p>
        `,
        link: 'https://svet24.si/lokalno/dolenjska/novice/marjanca-trscinar-antic-1811285',
        linkText: 'Oglej si Medijski Članek o tem'
    },
    4: {
        image: 'images/media/potepanje z babico.jpg',
        title: 'Potepanje z babico',
        description: `
            <p>V današnjem času je težko najti dejavnost, ki bi otroke zanimala bolj kot telefoni in internet; toda če jih popeljemo v naravo, hitro odkrijejo marsikaj zanimivega in celo vznemirljivega. »Potepanja z babico«, ki si jih lahko ogledamo na YouTubu, to potrjujejo.</p>
            <p>Stari starši, pri katerih vnuki pogosto preživljajo proste dni, se sprašujejo, zakaj so otroci nenehno na telefonu, prijateljem tipkajo sporočila, namesto da bi se z njimi v živo pogovarjali. »Otroci po spletu raziskujejo čudesa sveta, ne poznajo pa »čudes«, ki so tako rekoč pred njihovim pragom,« razmišlja Marjanca T. Antić, ki je po poklicu vzgojiteljica, dolgo pa je delala tudi v turizmu. Zdaj s svojimi vnuki, starimi deset, osem, šest in štiri leta, združuje ti dve področji.</p>
            <p>Oglejte si projekt Potepanje z babico, kjer Marjanca skupaj s svojimi vnuki raziskuje naravo in deli doživetja.</p>
        `,
        links: [
            {
                url: 'https://vaskanal.com/vk/arhiv/potepanje-z-babico/',
                text: 'Oglej si Medijski Članek o tem projektu'
            },
            {
                url: 'https://www.youtube.com/@PotepanjezBabico',
                text: 'Obišči YouTube kanal'
            }
        ]
    }
};

// Initialize media page
document.addEventListener('DOMContentLoaded', function() {
    initMediaCards();
    initMediaModal();
});

function initMediaCards() {
    const cards = document.querySelectorAll('.media-card');
    const buttons = document.querySelectorAll('.media-card-button');
    
    // Make entire card clickable
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking the button directly
            if (e.target.classList.contains('media-card-button')) {
                return;
            }
            const mediaId = this.getAttribute('data-media');
            openMediaModal(mediaId);
        });
    });
    
    // Button clicks
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const mediaId = this.getAttribute('data-media');
            openMediaModal(mediaId);
        });
    });
}

function initMediaModal() {
    const modal = document.getElementById('mediaModal');
    const closeButton = document.querySelector('.media-modal-close');
    const overlay = document.querySelector('.media-modal-overlay');
    
    if (!modal) return;
    
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

function openMediaModal(mediaId) {
    const modal = document.getElementById('mediaModal');
    const data = mediaData[mediaId];
    
    if (!modal || !data) return;
    
    // Set modal content
    document.getElementById('modalImage').src = data.image;
    document.getElementById('modalImage').alt = data.title;
    document.getElementById('modalTitle').textContent = data.title;
    document.getElementById('modalDescription').innerHTML = data.description;
    
    // Handle links (single link or multiple links)
    const linksContainer = document.getElementById('modalLinks');
    linksContainer.innerHTML = ''; // Clear previous links
    
    if (data.links && Array.isArray(data.links)) {
        // Multiple links
        data.links.forEach(link => {
            const linkButton = document.createElement('a');
            linkButton.href = link.url;
            linkButton.textContent = link.text;
            linkButton.target = '_blank';
            linkButton.rel = 'noopener noreferrer';
            linkButton.className = 'media-modal-link-button';
            linksContainer.appendChild(linkButton);
        });
    } else if (data.link) {
        // Single link (backward compatibility)
        const linkButton = document.createElement('a');
        linkButton.href = data.link;
        linkButton.textContent = data.linkText || 'Obišči stran';
        linkButton.target = '_blank';
        linkButton.rel = 'noopener noreferrer';
        linkButton.className = 'media-modal-link-button';
        linksContainer.appendChild(linkButton);
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

