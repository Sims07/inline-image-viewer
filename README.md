# Visionneuse Interactive pour Schémas d'Architecture SI (Mega Hopex Viewport)

Ce script JavaScript applicatif résout les contraintes d'ergonomie et d'affichage des très grands diagrammes de cartographie SI (générés via Mega Hopex ou des outils similaires) au sein des portails web d'entreprise. Il remplace le défilement natif fastidieux par une interface fluide en plein écran intégrant des fonctions de zoom, de déplacement à la souris (Pan & Zoom) ainsi que le maintien dynamique des liens hypertexte (Image Maps).

## 🚀 Fonctionnalités

- 🔲 **Mode Plein Écran Dédié (Modal Window) :** S'affranchit des contraintes géométriques, des barres d'outils et des menus latéraux du site d'origine pour maximiser la surface d'affichage.
- 🔍 **Zoom Molette & Double-Clic :** Zoom fluide centré précisément sur la position actuelle du curseur de la souris.
- 🖱️ **Pan & Drag (Glisser-Déplacer) :** Navigation naturelle par glissement à la souris (clic gauche maintenu), fonctionnelle sur l'intégralité du schéma, y compris depuis les zones cliquables.
- 🔍 **Zoom au Double-Clic :** Double-clic pour zoomer, centré précisément sur le point cliqué (`Alt` + double-clic pour dézoomer).
- 🎯 **Indicateur de Zoom :** Le niveau de zoom actuel (%) est affiché en permanence dans la barre d'outils.
- 🗺️ **Maintien des Liens Dynamiques (`<map>` / `<area>`) :** Recalcule au pixel près et en temps réel les coordonnées géométriques de chaque zone cliquable lors des déplacements et changements d'échelle. Les liens vers le référentiel d'architecture restent 100% fonctionnels.
- 🧭 **Mini-Carte de Repérage (Minimap) :** Une vignette en bas à gauche du viewport affiche l'ensemble du schéma avec un cadre indiquant la zone actuellement visible. Un simple clic saute directement à un endroit du diagramme, et un **glisser-déposer (drag & drop)** dans la mini-carte permet de parcourir le schéma en continu — très utile en fort zoom sur les grands schémas.
- 🖥️ **Boutons de Contrôle Express :**
  - **Ajuster (Touche `F`) :** Recadre et ajuste instantanément l'ensemble du schéma à la taille de l'écran.
  - **Taille Réelle (Touche `0`) :** Réinitialise l'échelle à 100% (1:1), centrée dans le viewport.
  - **Réduire :** Masque temporairement la visionneuse (sans recharger ni perdre le zoom/la position) pour interagir avec le portail sous-jacent ; un clic sur le bouton flottant (devenu "🔽 Restaurer Visionneuse") la rétablit exactement où vous l'aviez laissée.
  - **Fermer (Touche `Échap`) :** Quitte proprement l'interface et réinitialise le comportement par défaut de la page.
- 🔄 **Détection Automatique (Mode Écoute) :** Un bouton flottant discret reste persistant en bas à droite de l'écran. Lors d'un changement d'onglet ou de schéma sur le site parent, un simple clic dessus projette immédiatement le nouveau diagramme actif dans le viewport.

---

## 🛠️ Installation (Recommandé)

Pour contourner les limitations de saisie et de formatage des navigateurs d'entreprise (Edge/Chrome), utilisez la page d'installation automatisée intégrée.

1. Ouvrez votre page d'installation **https://sims07.github.io/inline-image-viewer/install.html** (déployée via vos GitHub Pages ou serveur interne).
2. Affichez votre barre des favoris si ce n'est pas déjà fait (`Ctrl + Maj + B` sur Windows ou `Cmd + Maj + B` sur Mac).
3. **Glissez et déposez (Drag & Drop)** le bouton bleu **👁️ Visionneuse Carto SI** directement dans votre barre de favoris.
4. Allez sur votre instance de Cartographie SI, puis cliquez sur le favori pour activer instantanément l'outil.

> 🔄 **Mise à jour transparente :** La page d'installation charge dynamiquement la dernière version du fichier `cartosi-viewer.js` et purge les commentaires à la volée. Inutile de recréer votre favori lors des prochaines mises à jour du code source !

### Alternative : Injection Manuelle (Console F12)
Si vous ne disposez pas d'un hébergement pour la page d'installation, vous pouvez copier le code du fichier `cartosi-viewer.js`, ouvrir la console de votre navigateur (`F12` -> onglet **Console**) sur votre portail SI, le coller et appuyer sur `Entrée`.

---

## ⌨️ Raccourcis Clavier

Lorsque la visionneuse est active au premier plan, vous pouvez piloter l'interface à l'aide des raccourcis suivants :

| Touche | Action |
| :---: | :--- |
| <kbd>F</kbd> | **Fit to screen** : Adapte automatiquement le schéma à la zone d'affichage. |
| <kbd>0</kbd> | **Taille Réelle** : Réinitialise l'échelle à 100% (1:1), centrée dans le viewport. |
| <kbd>Échap</kbd> | **Fermer** : Ferme et décharge la fenêtre modale. |

> ℹ️ Double-clic sur le schéma pour zoomer (centré sur le curseur) ; `Alt` + double-clic pour dézoomer.

---

## 🔍 Fonctionnement Technique (Sous le capot)

Le script s'appuie sur la structure DOM native du portail d'architecture :
1. **Ciblage agnostic des IDs :** Il détecte la vue active en recherchant la classe CSS d'état de visibilité `.diagrammeDisplay` injectée par le framework applicatif d'origine plutôt que de cibler un identifiant technique (`#id`) rigide.
2. **Clonage du nœud graphique :** L'élément `<img>` original est cloné en mémoire pour éviter d'altérer les écouteurs d'événements natifs du site parent.
3. **Calcul matriciel affine :** À chaque interaction utilisateur, la fonction de transformation géométrique applique la formule suivante sur l'ensemble du tableau de points géodésiques des balises HTML `<area>` :
   X' = X × Scale + Tx  
   Y' = Y × Scale + Ty

---

## 🩹 Journal des correctifs

### v1.1 — Correction du Pan & Drag sur les zones cliquables (`<area>`)
Certains utilisateurs ne parvenaient pas à démarrer le glisser-déplacer (Pan) lorsque le clic partait d'une zone couverte par une balise `<area>` du `usemap` (c'est-à-dire une des boîtes cliquables du schéma). Le navigateur interceptait le clic pour démarrer son propre comportement natif de glissement de lien/image, avant que le moteur de Pan & Zoom ne puisse prendre la main.

Correctifs apportés dans `inline-image-viewer.js` :
- Ajout de `e.preventDefault()` dès le `mousedown` sur le viewport, pour empêcher le navigateur d'initier son drag natif.
- Ajout d'un listener `dragstart` neutralisant tout drag HTML5 natif résiduel sur la zone de visualisation.
- Désactivation explicite (`draggable = false`) du drag natif sur l'image clonée et sur chaque `<area>` du `usemap`.

➡️ Le Pan fonctionne désormais de façon homogène sur l'intégralité du schéma, y compris depuis les boîtes cliquables.

### v1.2 — Ergonomie desktop : repérage, zoom précis et continuité de navigation
Quatre améliorations pour un meilleur usage sur poste de travail (desktop) :
- **Raccourci `0` (Taille Réelle) implémenté** : la touche était documentée mais absente du code ; elle réinitialise désormais l'échelle à 100%, centrée dans le viewport.
- **Bouton "Réduire" rendu fonctionnel** : masque la visionneuse sans recharger le diagramme ni perdre le zoom/la position en cours, pour consulter le portail sous-jacent puis reprendre exactement où vous étiez (le bouton flottant devient "🔽 Restaurer Visionneuse").
- **Zoom au double-clic** : centré précisément sur le point cliqué (`Alt` + double-clic pour dézoomer), en complément du zoom molette.
- **Indicateur de zoom** : affichage permanent du niveau de zoom (%) dans la barre d'outils.
- **Mini-carte de repérage (minimap)** : vignette du schéma complet en bas à gauche du viewport, avec un cadre indiquant la zone visible ; cliquer dessus permet de sauter directement à un endroit du diagramme — un vrai gain sur les très grands schémas une fois zoomé.

> Le support tactile (pan au doigt, pincement pour zoomer) n'a volontairement pas été implémenté : l'outil est utilisé exclusivement sur poste de travail desktop.

### v1.3 — Glisser-déposer dans la mini-carte
La mini-carte ne permettait initialement qu'un saut au clic. Elle supporte désormais le **glisser-déposer continu** : cliquer-maintenir puis déplacer la souris dans la mini-carte fait défiler le schéma en temps réel, sans avoir à cliquer répétitivement. Le curseur passe en mode "main" (`grab`/`grabbing`) pour refléter ce comportement, cohérent avec le Pan du viewport principal.

---

## 📄 Licence

Ce projet est sous licence **MIT**. Vous pouvez librement le cloner, le modifier et le distribuer au sein de votre entreprise.
