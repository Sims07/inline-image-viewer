(() => {
    // Éviter les injections multiples si le script est relancé
    if (window.__cartoPanZoomInstance) {
        window.__cartoPanZoomInstance.destroy();
    }

    // Config géométrie
    const MIN_SCALE = 0.05; 
    const MAX_SCALE = 6; 
    const ZOOM_STEP = 1.1;
    const FIT_MARGIN = 40;

    let scale = 1, tx = 0, ty = 0;
    let dragging = false;
    let lastX = 0, lastY = 0;
    let currentHost = null;
    let currentMap = null;
    let imgClone = null;

    // 1. Recherche du diagramme actif
    function getActiveDiagramContainer() {
        const active = document.querySelector('.diagrammeDisplay');
        if (active) return active; 
        const all = [...document.querySelectorAll('.diagramme-img')];
        return all.find(d => d.offsetParent !== null) || all[0] || null;
    }

    // 2. Création de la structure HTML de la Popup (Modal)
    const modal = document.createElement('div');
    modal.id = 'carto-panzoom-modal';
    Object.assign(modal.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: '#f5f5f7', zIndex: '999999', display: 'none',
        flexDirection: 'column', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    });

    // Barre d'outils supérieure
    const toolbar = document.createElement('div');
    Object.assign(toolbar.style, {
        height: '50px', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', boxShaddow: '0 2px 4px rgba(0,0,0,0.05)', userSelect: 'none'
    });

    const title = document.createElement('div');
    title.innerText = 'Visionneuse d\'Architecture SI (Mega Hopex Mode)';
    title.style.fontWeight = '600';
    title.style.color = '#333';

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '10px';

    function createButton(text, bg, fg) {
        const btn = document.createElement('button');
        btn.innerText = text;
        Object.assign(btn.style, {
            padding: '6px 14px', border: 'none', borderRadius: '4px', cursor: 'pointer',
            backgroundColor: bg, color: fg, fontWeight: '500', fontSize: '13px',
            transition: 'background-color 0.2s'
        });
        return btn;
    }

    const btnFit = createButton('Ajuster (F)', '#007aff', '#fff');
    const btnMinimize = createButton('Réduire', '#8e8e93', '#fff');
    const btnClose = createButton('Fermer (Échap)', '#ff3b30', '#fff');

    btnContainer.append(btnFit, btnMinimize, btnClose);
    toolbar.append(title, btnContainer);

    // Viewport de visualisation
    const viewport = document.createElement('div');
    Object.assign(viewport.style, {
        flex: '1', overflow: 'hidden', position: 'relative',
        cursor: 'default', touchAction: 'none', userSelect: 'none'
    });

    const content = document.createElement('div');
    Object.assign(content.style, {
        position: 'absolute', left: '0px', top: '0px',
        transformOrigin: '0 0', willChange: 'transform'
    });

    viewport.appendChild(content);
    modal.append(toolbar, viewport);
    document.body.appendChild(modal);

    // Bouton d'activation flottant permanent (en bas à droite du site web)
    const floatBtn = document.createElement('button');
    floatBtn.innerHTML = '👁️ Ouvrir la visionneuse';
    Object.assign(floatBtn.style, {
        position: 'fixed', bottom: '20px', right: '20px', zIndex: '999998',
        padding: '12px 20px', backgroundColor: '#007aff', color: '#fff',
        border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: '600',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '14px'
    });
    document.body.appendChild(floatBtn);

    // 3. Logique d'initialisation du schéma actif
    function loadActiveDiagram() {
        currentHost = getActiveDiagramContainer();
        if (!currentHost) {
            alert('Aucun schéma d\'architecture détecté sur la page active.');
            return false;
        }

        const originalImg = currentHost.querySelector('img[usemap]');
        if (!originalImg) {
            alert('Impossible de trouver l\'image du diagramme.');
            return false;
        }

        // Nettoyage de l'ancien contenu du viewport
        content.innerHTML = '';

        // Clonage de l'image d'origine pour préserver l'état du DOM
        imgClone = originalImg.cloneNode(true);
        Object.assign(imgClone.style, {
            maxWidth: 'unset', width: 'auto', height: 'auto', display: 'block'
        });

        // Gestion de l'Image Map (zones cliquables)
        const mapName = originalImg.getAttribute('usemap');
        const useMap = mapName && mapName.trim();
        currentMap = useMap ? document.querySelector(`map[name="${useMap.slice(1)}"]`) : null;

        if (currentMap) {
            // Sauvegarde des coordonnées brutes d'origine si non fait
            const areas = currentMap.querySelectorAll('area[coords]');
            areas.forEach(a => {
                if (!a.dataset.rawCoords) a.dataset.rawCoords = a.getAttribute('coords') || '';
            });
            // On s'assure que la map est bien rattachée au DOM de la page
            if (useMap) imgClone.setAttribute('usemap', useMap);
        }

        content.appendChild(imgClone);
        return true;
    }

    // 4. Moteur de rendu des transformations
    function applyTransform() {
        content.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        if (currentMap) {
            const areas = currentMap.querySelectorAll('area[coords]');
            areas.forEach(a => {
                const raw = a.dataset.rawCoords;
                if (!raw) return;
                const pts = raw.split(',').map(s => parseFloat(s.trim()));
                for (let i = 0; i < pts.length; i += 2) {
                    pts[i] = Math.round(pts[i] * scale + tx);
                    pts[i + 1] = Math.round(pts[i + 1] * scale + ty);
                }
                a.setAttribute('coords', pts.join(','));
            });
        }
    }

    function getImageSize() {
        return {
            w: imgClone ? (imgClone.naturalWidth || imgClone.width) : 0,
            h: imgClone ? (imgClone.naturalHeight || imgClone.height) : 0
        };
    }

    function fitToScreen() {
        const { w, h } = getImageSize();
        const rect = viewport.getBoundingClientRect();
        const vw = rect.width - FIT_MARGIN * 2;
        const vh = rect.height - FIT_MARGIN * 2;
        if (w <= 0 || h <= 0 || vw <= 0 || vh <= 0) return;

        scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(vw / w, vh / h)));
        tx = Math.round((rect.width - w * scale) / 2);
        ty = Math.round((rect.height - h * scale) / 2);
        applyTransform();
    }

    function resetView() { scale = 1; tx = 0; ty = 0; applyTransform(); }

    function zoomAt(clientX, clientY, direction) {
        const rect = viewport.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const prevScale = scale;
        const factor = direction > 0 ? (1 / ZOOM_STEP) : ZOOM_STEP;
        scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
        tx = x - (x - tx) * (scale / prevScale);
        ty = y - (y - ty) * (scale / prevScale);
        applyTransform();
    }

    // 5. Gestion des Événements (Pan & Zoom)
    viewport.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        dragging = true;
        lastX = e.clientX; lastY = e.clientY;
        viewport.style.cursor = 'grabbing';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        tx += e.clientX - lastX;
        ty += e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        applyTransform();
    });

    window.addEventListener('mouseup', () => {
        dragging = false;
        viewport.style.cursor = 'default';
    });

    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        zoomAt(e.clientX, e.clientY, e.deltaY);
    }, { passive: false });

    viewport.addEventListener('dblclick', (e) => {
        e.preventDefault();
        zoomAt(e.clientX, e.clientY, e.shiftKey ? -1 : 1);
    });

    // 6. Gestion de l'affichage de la Modal
    function openModal() {
        if (loadActiveDiagram()) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Bloque le scroll arrière-plan
            setTimeout(fitToScreen, 50); // Laisse le temps au layout de calculer les dimensions
        }
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        // Restauration des coordonnées d'origine pour ne pas impacter le site natif
        if (currentMap) {
            currentMap.querySelectorAll('area[coords]').forEach(a => {
                if (a.dataset.rawCoords) a.setAttribute('coords', a.dataset.rawCoords);
            });
        }
    }

    function minimizeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    // Assignation des boutons
    floatBtn.addEventListener('click', openModal);
    btnFit.addEventListener('click', fitToScreen);
    btnMinimize.addEventListener('click', minimizeModal);
    btnClose.addEventListener('click', closeModal);

    // Raccourcis Clavier (F = Fit, 0 = Reset, Échap = Fermer)
    const handleKeyDown = (e) => {
        if (modal.style.display === 'flex') {
            if (e.key === 'Escape') closeModal();
            else if (e.key.toLowerCase() === 'f') fitToScreen();
            else if (e.key === '0') resetView();
        }
    };
    window.addEventListener('keydown', handleKeyDown);

    window.addEventListener('resize', () => {
        if (modal.style.display === 'flex') fitToScreen();
    });

    // 7. Fonction de destruction pour mise à jour propre du script
    window.__cartoPanZoomInstance = {
        destroy: () => {
            window.removeEventListener('keydown', handleKeyDown);
            modal.remove();
            floatBtn.remove();
        }
    };

    // Ouverture automatique lors du premier lancement
    openModal();
    console.info('[Carto PanZoom - Plein Écran] Chargé. Utilisez le bouton flottant "Ouvrir la visionneuse" à tout moment pour charger le schéma courant.');
})();
