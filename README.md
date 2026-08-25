# KardX — Plateforme de Cartes de Visite Digitales & CRM Commercial

> **Solution tout-en-un d'identité professionnelle digitale, networking NFC & QR, capture de prospects intelligente et gestion d'équipes.**

---

## 📱 Expérience Web & Mobile Optimisée

KardX est conçu avec une architecture responsive mobile-first et desktop ultra-fluide :
- **Sur Mobile & Tablette :**
  - Barre de navigation tactile ergonomique inférieure (`MobileBottomNav`) avec accès direct aux modules clés.
  - Menu tiroir complet (`Drawer Navigation`) pour les réglages avancés et la gestion d'équipe.
  - Cartes et formulaires adaptés au tactile avec support PWA (*Progressive Web App*) installable en 1 clic sur iOS et Android.
  - Scanner de cartes physiques OCR IA optimisé pour la caméra des smartphones.
  - Support Apple Wallet & Google Wallet pour exporter votre carte directement dans l'application Wallet de votre téléphone.
- **Sur Ordinateur / Grand Écran :**
  - Barre latérale rétractable multi-niveaux.
  - Vue d'ensemble avec tableaux de bord analytiques, Kanban CRM complet et gestion multi-utilisateurs.
  - Prévisualisation temps réel du profil digital avec simulateur de cartes physiques interactif.

---

## 🚀 Fonctionnalités Clés

1. **Cartes Digitales NFC & QR Dynamiques**
   - Personnalisation de design complète (thèmes, badges, couleurs, typographies, widgets).
   - Profil public ultra-rapide avec bouton d'enregistrement vCard et échange de coordonnées instantané.
   - Simulateur de tap NFC et générateur de QR Codes vectoriels haute résolution.

2. **Scanner de Cartes de Visite IA (OCR)**
   - Capture photo instantanée d'une carte papier physique.
   - Extraction automatique des champs (Nom, Prénom, Société, Email, Téléphone, Adresse, Site web).
   - Intégration directe dans le CRM avec déclenchement des règles de routage.

3. **CRM Commercial & Routage Intelligent des Leads**
   - Vues Tableau, Pipeline Kanban, Calendrier des relances et Gestionnaire de tâches.
   - Règles d'assignation automatique par pays, ville, source de scan ou type d'intérêt.
   - Rappels programmés, historique des interactions et export CSV sécurisé.

4. **Gestion d'Équipes & Contrôle d'Accès (RBAC)**
   - Rôles : *Super Admin*, *Admin d'Organisation*, *Manager*, *Collaborateur*.
   - Éditeur en masse (Bulk Editor) pour déployer une charte graphique sur 100+ profils en un clic.
   - Permissions granulaires et assignation des cartes d'entreprise.

5. **Apple Wallet & Signatures Email**
   - Générateur de pass Wallet pour smartphone.
   - Générateur de signatures emails HTML interactives pour Outlook, Gmail et Apple Mail.

---

## 🛠️ Installation & Démarrage

### Prérequis
- Node.js (v18+)
- npm ou yarn

### Lancement en mode développement
```bash
# 1. Cloner le projet
git clone https://github.com/sagbodavidcomlan-droid/Kardx.git
cd Kardx

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur local
npm run dev
```
L'application sera accessible sur `http://localhost:3000`.

### Build pour la production Web
```bash
npm run build
```

---

## 📲 Déploiement Mobile Natif (iOS & Android)

KardX peut être compilé directement en application mobile native via **Capacitor** :

```bash
# 1. Installer Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# 2. Initialiser le projet Capacitor
npx cap init KardX com.kardx.app --web-dir dist

# 3. Builder le projet et synchroniser
npm run build
npx cap add android
npx cap add ios
npx cap sync

# 4. Ouvrir dans Android Studio ou Xcode
npx cap open android
npx cap open ios
```

---

## 🔒 Sécurité & Base de données
- Intégration Firebase Firestore avec règles de sécurité strictes.
- Authentification avec réinitialisation et forçage de changement de mot de passe à la première connexion.
