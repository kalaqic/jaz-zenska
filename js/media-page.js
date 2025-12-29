// Media Page JavaScript

// Media data
const mediaData = {
    1: {
        image: 'images/inervju.jpg',
        title: 'Intervju v reviji - Marjanca o ženski moči in transformaciji',
        date: 'Marec 2024',
        source: 'Revija Ženska',
        description: `
            <p>V ekskluzivnem intervjuju za revijo Ženska je Marjanca Trščinar Antić delila svojo globoko modrost o ženski moči, transformaciji in poti do avtentičnega jaza.</p>
            
            <p><strong>O ženski moči:</strong> "Vsaka ženska nosi v sebi neizmerno moč. Naša naloga ni, da jo poiščemo zunaj, temveč da se povežemo s tem, kar že imamo v sebi. To je pot samoodkrivanja, ki zahteva pogum in zaupanje vase."</p>
            
            <p><strong>O transformaciji:</strong> "Transformacija ni dogodek, temveč proces. Zahteva čas, potrpežljivost in podporo skupnosti. Ko se ženske zberejo v krogu, se zgodijo čudeži - skupaj smo močnejše, modrejše in pogumnejše."</p>
            
            <p><strong>O svoji poti:</strong> "Moja pot ni bila vedno enostavna. Skozi osebne izzive sem se naučila, da je največja moč v ranljivosti in avtentičnosti. Danes pomagam drugim ženskam odkriti njihovo notranjo moč in živeti življenje, ki jih napolnjuje."</p>
            
            <p>Intervju je bil objavljen v pomladni številki revije in je navdihnil številne bralke na njihovi poti samoodkrivanja.</p>
        `
    }
};

// Initialize media page
document.addEventListener('DOMContentLoaded', function() {
    initMediaNotes();
    initMediaModal();
    initPageTransitionLoader();
});

function initMediaNotes() {
    const notes = document.querySelectorAll('.media-note');
    
    notes.forEach(note => {
        note.addEventListener('click', function() {
            const noteId = this.getAttribute('data-note');
            openMediaModal(noteId);
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

function openMediaModal(noteId) {
    const modal = document.getElementById('mediaModal');
    const data = mediaData[noteId];
    
    if (!modal || !data) return;
    
    // Set modal content
    document.getElementById('modalImage').src = data.image;
    document.getElementById('modalImage').alt = data.title;
    document.getElementById('modalTitle').textContent = data.title;
    document.getElementById('modalDate').textContent = data.date;
    document.getElementById('modalSource').textContent = data.source;
    document.getElementById('modalDescription').innerHTML = data.description;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

