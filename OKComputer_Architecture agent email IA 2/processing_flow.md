# Flux de Traitement Complet

## Diagramme de Flux Global

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FLUX DE TRAITEMENT                             │
└─────────────────────────────────────────────────────────────────────────┘

1. RÉCEPTION EMAIL
   └─➤ Service Email Monitoring (IMAP)
        └─➤ Vérification toutes les X minutes
             └─➤ Nouvel email détecté
                  └─➤ Téléchargement email brut

2. PRÉ-TRAITEMENT
   └─➤ Email Parser
        ├─➤ Extraction headers (From, To, Subject, Date)
        ├─➤ Détection pièces jointes
        ├─➤ Extraction corps texte/HTML
        └─➤ Stockage en base (PostgreSQL)

3. ANALYSE PAR AGENT IA
   └─➤ Email Analyzer Agent
        ├─➤ Classification type email
        │    ├─➤ Facture fournisseur
        │    ├─➤ Contrat client
        │    ├─➤ Devis/commande
        │    ├─➤ Rapport technique
        │    └─➤ Communication interne
        │
        ├─➤ Extraction métadonnées
        │    ├─➤ Numéro de référence
        │    ├─➤ Date facture/contrat
        │    ├─➤ Montant (si applicable)
        │    ├─➤ Entreprises mentionnées
        │    └─➤ Projet/rubrique budgétaire
        │
        └─➤ Score de confiance

4. TRAITEMENT DES PIÈCES JOINTES
   └─➤ Attachment Processor
        ├─➤ Filtrage (PDF uniquement)
        ├─➤ Vérification taille et sécurité
        ├─➤ Upload vers Object Storage (MinIO/S3)
        └─➤ Extraction texte et métadonnées PDF

5. CLASSIFICATION PDF
   └─➤ Document Classifier
        ├─➤ Analyse contenu textuel
        ├─➤ Détection patterns visuels
        ├─➤ Classification hiérarchique:
        │    ├── Catégorie principale
        │    │   ├─➤ Factures
        │    │   ├─➤ Contrats
        │    │   ├─➤ Devis
        │    │   ├─➤ Rapports
        │    │   └─➤ Autres documents
        │    │
        │    └── Sous-catégorie
        │        ├─➤ Par type (fournisseur, client)
        │        ├─➤ Par période (mensuel, annuel)
        │        └─➤ Par projet/département
        │
        └─➤ Tags automatiques

6. EXTRACTION AVANCÉE (selon type)
   └─➤ Specific Extractors
        ├─➤ FACTURE:
        │    ├─➤ Numéro facture
        │    ├─➤ Date émission
        │    ├─➤ Date échéance
        │    ├─➤ HT, TVA, TTC
        │    ├─➤ Fournisseur
        │    └─➤ Références commande
        │
        ├─➤ CONTRAT:
        │    ├─➤ Numéro contrat
        │    ├─➤ Date signature
        │    ├─➤ Date fin validité
        │    ├─➤ Parties prenantes
        │    └─➤ Type contrat
        │
        └─➤ DEVIS:
             ├─➤ Numéro devis
             ├─➤ Date validité
             ├─➤ Montant total
             └─➤ Client

7. VALIDATION ET VÉRIFICATION
   └─➤ Validation Engine
        ├─➤ Vérification cohérence données
        ├─➤ Détection doublons
        ├─➤ Validation format dates/montants
        ├─➤ Cross-validation avec base existante
        └─➤ Marquage "À vérifier" si doute

8. STOCKAGE ET ARCHIVAGE
   └─➤ Storage Manager
        ├─➤ PostgreSQL - Métadonnées structurées
        │    ├─➤ Email: headers, analyse, tags
        │    ├─➤ Document: type, classification, métadonnées
        │    ├─➤ Relations: email ↔ document(s)
        │    └─➤ Historique: actions, modifications
        │
        ├─➤ MongoDB - Données flexibles
        │    ├─➤ Logs détaillés de traitement
        │    ├─➤ Configurations utilisateur
        │    └─➤ Cache de classification
        │
        └─➤ Object Storage - Fichiers
             ├─➤ PDF originaux (version archivage)
             ├─➤ PDF avec OCR (si nécessaire)
             └─➤ Structure: /{user_id}/{year}/{month}/{doc_id}/

9. NOTIFICATIONS ET ALERTES
   └─➤ Notification Service
        ├─➤ Email de confirmation (optionnel)
        ├─➤ Notification UI en temps réel
        ├─➤ Alertes si erreur de traitement
        └─➤ Résumé quotidien/hebdomadaire

10. INDEXATION ET RECHERCHE
    └─➤ Search Engine
         ├─➤ Indexation Elasticsearch (optionnel)
         ├─➤ Index PostgreSQL (pg_trgm)
         ├─➤ Mots-clés extraits automatiquement
         └─➤ Recherche full-text activée
```

## Détail des Processus Clés

### Processus de Classification Automatique

```python
# Pseudo-code de classification

def classify_document(pdf_content, email_metadata):
    # 1. Extraction des features
    text_features = extract_text_features(pdf_content)
    visual_features = extract_visual_features(pdf_content)
    email_features = extract_email_features(email_metadata)
    
    # 2. Classification multi-niveaux
    main_category = predict_main_category(text_features)
    sub_category = predict_sub_category(text_features, main_category)
    
    # 3. Extraction de métadonnées spécifiques
    if main_category == "FACTURE":
        metadata = extract_invoice_metadata(pdf_content)
    elif main_category == "CONTRAT":
        metadata = extract_contract_metadata(pdf_content)
    # ... etc
    
    # 4. Calcul du score de confiance
    confidence = calculate_confidence(text_features, visual_features)
    
    return {
        "category": main_category,
        "subcategory": sub_category,
        "metadata": metadata,
        "confidence": confidence,
        "requires_review": confidence < 0.7
    }
```

### Gestion des Erreurs et Retry

```python
# Stratégie de retry avec backoff exponentiel

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def process_email_with_retry(email_id):
    try:
        return process_email(email_id)
    except TemporaryError as e:
        logger.warning(f"Retry processing email {email_id}: {e}")
        raise
    except PermanentError as e:
        logger.error(f"Permanent error for email {email_id}: {e}")
        mark_as_failed(email_id, str(e))
        return None
```

## Performance et Scalabilité

### Traitement Parallèle
- **Workers Celery**: 4-8 workers selon charge CPU
- **File d'attente prioritaire**: Emails urgents traités en premier
- **Batch processing**: Traitement par lots de 10-20 emails

### Optimisations
- **Cache Redis**: Résultats de classification fréquents
- **Lazy loading**: PDFs chargés uniquement si nécessaire
- **Compression**: PDFs compressés avant stockage
- **Archivage**: Documents anciens déplacés vers stockage froid

### Monitoring en Temps Réel
- **Métriques Prometheus**:
  - Emails traités par heure
  - Temps moyen de traitement
  - Taux d'erreur par étape
  - Utilisation CPU/mémoire

## Gestion des Cas d'Erreur

### Erreurs Courantes
1. **Email corrompu**: Marqué comme "Non traitable"
2. **PDF protégé**: Tentative avec OCR, sinon marqué manuel
3. **Classification échec**: Marqué "À classifier manuellement"
4. **Stockage plein**: Alertes admin, mise en file d'attente
5. **Timeout traitement**: Retry avec backoff, puis marqué erreur

### Tableau de Bord d'Administration
- Vue en temps réel des erreurs
- Possibilité de retraiter manuellement
- Configuration des seuils de retry
- Export des emails en erreur pour analyse