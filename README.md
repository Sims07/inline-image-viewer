# Visionneuse Interactive pour Schémas d'Architecture SI (Mega Hopex Viewport)

[![JavaScript](https://img.shields.io/badge/Language-JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/fr/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Purpose: Enterprise Architecture](https://img.shields.io/badge/Purpose-Solution%20Architecture-blue)](#)

Ce script JavaScript applicatif résout les contraintes d'ergonomie et d'affichage des très grands diagrammes de cartographie SI (générés via Mega Hopex ou des outils similaires) au sein des portails web d'entreprise. Il remplace le défilement natif fastidieux par une interface fluide en plein écran intégrant des fonctions de zoom, de déplacement à la souris (Pan & Zoom) ainsi que le maintien dynamique des liens hypertexte (Image Maps).

## 🚀 Fonctionnalités

- 🔲 **Mode Plein Écran Dédié (Modal Window) :** S'affranchit des contraintes géométriques, des barres d'outils et des menus latéraux du site d'origine pour maximiser la surface d'affichage.
- 🔍 **Zoom Molette & Double-Clic :** Zoom fluide centré précisément sur la position actuelle du curseur de la souris.
- 🖱️ **Pan & Drag (Glisser-Déplacer) :** Navigation naturelle par glissement à la souris (clic gauche maintenu).
- 🗺️ **Maintien des Liens Dynamiques (`<map>` / `<area>`) :** Recalcule au pixel près et en temps réel les coordonnées géométriques de chaque zone cliquable lors des déplacements et changements d'échelle. Les liens vers le référentiel d'architecture restent 100% fonctionnels.
- 🖥️ **Boutons de Contrôle Express :**
  - **Ajuster (Touche `F`) :** Recadre et ajuste instantanément l'ensemble du schéma à la taille de l'écran.
  - **Réduire :** Masque temporairement la visionneuse pour interagir avec le portail sous-jacent.
  - **Fermer (Touche `Échap`) :** Quitte proprement l'interface et réinitialise le comportement par défaut de la page.
- 🔄 **Détection Automatique (Mode Écoute) :** Un bouton flottant discret reste persistant en bas à droite de l'écran. Lors d'un changement d'onglet ou de schéma sur le site parent, un simple clic dessus projette immédiatement le nouveau diagramme actif dans le viewport.

---

## 🛠️ Utilisation et Injection (Console F12)

Le script est conçu pour être injecté à la volée dans votre navigateur sans modification de l'infrastructure du site.

1. Connectez-vous sur votre portail de Cartographie SI.
2. Naviguez vers le diagramme ou schéma d'architecture que vous souhaitez analyser.
3. Ouvrez la console développeur de votre navigateur :
   - Sur Windows / Linux : `F12` ou `Ctrl + Maj + I`
   - Sur Mac : `Cmd + Option + I`
4. Copiez l'intégralité du code contenu dans le fichier `cartosi-viewer.js` de ce dépôt.
5. Collez-le dans l'onglet **Console**, puis validez en appuyant sur `Entrée`.

La visionneuse s'initialisera automatiquement par-dessus la page.

---

## ⌨️ Raccourcis Clavier

Lorsque la visionneuse est active au premier plan, vous pouvez piloter l'interface à l'aide des raccourcis suivants :

| Touche | Action |
| :---: | :--- |
| <kbd>F</kbd> | **Fit to screen** : Adapte automatiquement le schéma à la zone d'affichage. |
| <kbd>0</kbd> | **Taille Réelle** : Réinitialise l'échelle à 100% (1:1). |
| <kbd>Échap</kbd> | **Fermer** : Ferme et décharge la fenêtre modale. |

---

## 🔍 Fonctionnement Technique (Sous le capot)

Le script s'appuie sur la structure DOM native du portail d'architecture :
1. **Ciblage agnostic des IDs :** Il détecte la vue active en recherchant la classe CSS d'état de visibilité `.diagrammeDisplay` injectée par le framework applicatif d'origine plutôt que de cibler un identifiant technique (`#id`) rigide.
2. **Clonage du nœud graphique :** L'élément `<img>` original est cloné en mémoire pour éviter d'altérer les écouteurs d'événements natifs du site parent.
3. **Calcul matriciel affine :** À chaque interaction utilisateur, la fonction de transformation géométrique applique la formule suivante sur l'ensemble du tableau de points géodésiques des balises HTML `<area>` :
   <span class="math">X' = X \times Scale + Tx</span>  
   <span class="math">Y' = Y \times Scale + Ty</span>

---

## 📄 Licence

Ce projet est sous licence **MIT**. Vous pouvez librement le cloner, le modifier et le distribuer au sein de votre entreprise.
