(function() {
    var context = {container:'', win: '', doc:''};
    var { container, win, doc } = context;
    // ==========================================
    // 1. RECHERCHE DE LA FRAME CONTENANT LE SCHÉMA
    // ==========================================
    function findDiagramContext(root = window.top) {
        try {
            const found = root.document.querySelector('.diagrammeDisplay');
            if (found) {
                return { container: found, win: root, doc: root.document };
            }
            // Fouille récursive des cadres (frames / iframes)
            for (let i = 0; i < root.frames.length; i++) {
                const innerFound = findDiagramContext(root.frames[i]);
                if (innerFound) return innerFound;
            }
        } catch (e) {
            // Sécurité cross-origin
        }
        return null;
    }

    context = findDiagramContext();
    if (!context) {
        console.error("Conteneur .diagrammeDisplay introuvable dans aucune des frames.");
        alert("Aucun schéma d'architecture détecté sur la page.");
        return;
    }
    refreshContext();
    

    // Nettoyage de l'ancienne instance si elle existe dans cette frame
    if (win.__cartoPanZoomInstance) {
        win.__cartoPanZoomInstance.destroy();
    }

    // ==========================================
    // 2. INJECTION DU BOUTON FLOTTANT DANS LA FRAME
    // ==========================================
    const floatBtn = doc.createElement('button');
    floatBtn.innerText = '👁️ Visionneuse Carto';
    Object.assign(floatBtn.style, {
        position: 'fixed', bottom: '20px', right: '20px', 
        zIndex: '2147483647', // Priorité maximale dans le cadre
        padding: '12px 22px', backgroundColor: '#007aff', color: '#fff',
        border: '2px solid #ffffff', borderRadius: '50px', cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(0,0,0,0.4)', fontWeight: 'bold',
        fontFamily: 'Segoe UI, -apple-system, sans-serif', fontSize: '13px',
        transition: 'transform 0.2s, background-color 0.2s',
        display: 'block'
    });
    floatBtn.onmouseover = () => floatBtn.style.backgroundColor = '#0062cc';
    floatBtn.onmouseout = () => floatBtn.style.backgroundColor = '#007aff';
    doc.body.appendChild(floatBtn);

    // ==========================================
    // 3. INJECTION DE LA MODALE PLEIN ÉCRAN
    // ==========================================
    const modal = doc.createElement('div');
    Object.assign(modal.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(20, 20, 20, 0.97)', zIndex: '2147483646',
        display: 'none', flexDirection: 'column', overflow: 'hidden',
        fontFamily: 'Segoe UI, -apple-system, sans-serif'
    });
    doc.body.appendChild(modal);

    // Barre d'outils supérieure
    const toolbar = doc.createElement('div');
    Object.assign(toolbar.style, {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 20px', backgroundColor: '#1c1c1e', color: '#fff',
        borderBottom: '1px solid #2c2c2e'
    });
    modal.appendChild(toolbar);

    const title = doc.createElement('div');
    title.innerText = 'Visionneuse Cartographie SI — Mode Plein Écran';
    title.style.fontWeight = '600';
    toolbar.appendChild(title);

    const controls = doc.createElement('div');
    controls.style.display = 'flex'; controls.style.gap = '10px';
    toolbar.appendChild(controls);

    const btnFit = doc.createElement('button'); btnFit.innerText = 'Ajuster (F)';
    const btnClose = doc.createElement('button'); btnClose.innerText = 'Fermer (Échap)';

    [btnFit, btnClose].forEach(btn => {
        Object.assign(btn.style, {
            padding: '6px 14px', backgroundColor: '#2c2c2e', color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500'
        });
    });
    btnClose.style.backgroundColor = '#ff3b30';
    controls.appendChild(btnFit);
    controls.appendChild(btnClose);

    // Zone de Pan & Zoom
    const viewport = doc.createElement('div');
    viewport.style.cssText = 'flex: 1; position: relative; overflow: hidden; cursor: grab;';
    modal.appendChild(viewport);

    const content = doc.createElement('div');
    content.style.cssText = 'position: absolute; transform-origin: 0 0; left: 0px; top: 0px;';
    viewport.appendChild(content);

    // ==========================================
    // 4. MOTEUR DE PAN & ZOOM
    // ==========================================
    let scale = 1, tx = 0, ty = 0, isDragging = false, startX = 0, startY = 0;
    let imgClone = null, currentMap = null;

    function updateTransform() {
        content.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    }

    viewport.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault(); // FIX: empêche le navigateur de démarrer un drag natif (lien/image)
                             // lorsque le clic part d'une zone <area> du usemap
        isDragging = true; viewport.style.cursor = 'grabbing';
        startX = e.clientX - tx; startY = e.clientY - ty;
    });

    // FIX: filet de sécurité — neutralise tout drag HTML5 natif déclenché
    // par le navigateur sur l'image ou les liens <area> qu'elle contient
    viewport.addEventListener('dragstart', (e) => e.preventDefault());

    win.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        tx = e.clientX - startX; ty = e.clientY - startY;
        updateTransform();
    });

    win.addEventListener('mouseup', () => { isDragging = false; viewport.style.cursor = 'grab'; });

    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
        const zoom = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        if (scale * zoom < 0.1 || scale * zoom > 10) return;
        tx = mouseX - (mouseX - tx) * zoom;
        ty = mouseY - (mouseY - ty) * zoom;
        scale *= zoom;
        updateTransform();
    }, { passive: false });

    function fitToScreen() {
        if (!imgClone || imgClone.naturalWidth === 0) return;
        scale = Math.min(viewport.clientWidth / imgClone.naturalWidth, viewport.clientHeight / imgClone.naturalHeight, 1);
        tx = (viewport.clientWidth - imgClone.naturalWidth * scale) / 2;
        ty = (viewport.clientHeight - imgClone.naturalHeight * scale) / 2;
        updateTransform();
    }

    // ==========================================
    // 5. GESTION DES ÉVÉNEMENTS D'OUVERTURE
    // ==========================================
    function loadDiagram() {
        const originalImg = container.querySelector('img[usemap]');
        if (!originalImg) { 
            alert("Image du diagramme introuvable dans le conteneur."); 
            return false; 
        }
        
        content.innerHTML = '';
        imgClone = originalImg.cloneNode(true);
        Object.assign(imgClone.style, { maxWidth: 'unset', width: 'auto', height: 'auto', display: 'block' });
        imgClone.draggable = false; // FIX: désactive le drag HTML5 natif sur l'image clonée
        
        const mapName = originalImg.getAttribute('usemap');
        if (mapName) {
            currentMap = doc.querySelector('map[name="' + mapName.trim().slice(1) + '"]');
            if (currentMap) {
                const areas = currentMap.querySelectorAll('area[coords]');
                areas.forEach(a => {
                    if (!a.dataset.rawCoords) a.dataset.rawCoords = a.getAttribute('coords') || '';
                    a.draggable = false; // FIX: désactive aussi le drag natif sur chaque area cliquable
                });
                imgClone.setAttribute('usemap', mapName);
            }
        }
        content.appendChild(imgClone);
        return true;
    }

    function openModal() { 
        context = findDiagramContext();
        if(context.container !== '') {
            refreshContext();
        }
        
        if (!context) {
            console.error("Conteneur .diagrammeDisplay introuvable dans aucune des frames.");
            alert("Aucun schéma d'architecture détecté sur la page.");
            return;
        }
        if (loadDiagram()) { 
            modal.style.display = 'flex'; 
            doc.body.style.overflow = 'hidden'; 
            floatBtn.style.display = 'none'; // Masque le bouton quand le plein écran est actif
            setTimeout(fitToScreen, 50); 
        } 
    }
    
    function refreshContext() {
        container = context.container;
        win = context.win;
        doc = context.doc;
    }

    function closeModal() { 
        modal.style.display = 'none'; 
        doc.body.style.overflow = ''; 
        floatBtn.style.display = 'block'; // Réaffiche le bouton bleu au retour
    }

    // Association des clics
    floatBtn.addEventListener('click', openModal);
    btnFit.addEventListener('click', fitToScreen); 
    btnClose.addEventListener('click', closeModal);

    const handleKeyDown = (e) => { 
        if (modal.style.display === 'flex') { 
            if (e.key === 'Escape') closeModal(); 
            else if (e.key.toLowerCase() === 'f') fitToScreen(); 
        } 
    };

    win.addEventListener('keydown', handleKeyDown);
    win.addEventListener('resize', () => { if (modal.style.display === 'flex') fitToScreen(); });

    win.__cartoPanZoomInstance = { 
        destroy: () => { 
            win.removeEventListener('keydown', handleKeyDown); 
            modal.remove(); 
            floatBtn.remove();
        } 
    };

    console.log("Visionneuse prête. Bouton bleu injecté avec succès.");
})();
