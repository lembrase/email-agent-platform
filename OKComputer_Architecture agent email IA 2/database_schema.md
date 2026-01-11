# Schéma de Base de Données

## Architecture de Base de Données Polyglotte

```
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL (Structured)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │    Users     │  │   Emails     │  │  Documents   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │Organizations │  │ Classifications│  │  Audit Logs  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
├─────────────────────────────────────────────────────────────────┤
│                      MONGODB (Flexible)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │Process Logs  │  │User Settings │  │ML Models     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
├─────────────────────────────────────────────────────────────────┤
│                  REDIS (Cache & Sessions)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │Session Store │  │Classification│  │ Rate Limit   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
├─────────────────────────────────────────────────────────────────┤
│                OBJECT STORAGE (Files)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │PDF Originals │  │PDF Processed │  │Email Attach  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Schéma PostgreSQL Détaillé

### Table: users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    organization_id UUID REFERENCES organizations(id),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(32),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP DEFAULT NULL,
    
    -- Index pour les performances
    INDEX idx_users_email (email),
    INDEX idx_users_organization (organization_id),
    INDEX idx_users_role (role)
);
```

### Table: organizations
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    plan VARCHAR(50) DEFAULT 'basic',
    max_users INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_organizations_domain (domain)
);
```

### Table: email_accounts
```sql
CREATE TABLE email_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    email_address VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    
    -- Configuration IMAP/SMTP
    imap_server VARCHAR(255),
    imap_port INTEGER DEFAULT 993,
    imap_username VARCHAR(255),
    imap_password_encrypted BYTEA, -- Chiffré
    
    smtp_server VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_username VARCHAR(255),
    smtp_password_encrypted BYTEA, -- Chiffré
    
    -- Gmail/Outlook API
    provider VARCHAR(50), -- 'gmail', 'outlook', 'imap'
    access_token_encrypted BYTEA,
    refresh_token_encrypted BYTEA,
    token_expires_at TIMESTAMP,
    
    -- Paramètres de traitement
    is_active BOOLEAN DEFAULT true,
    auto_process BOOLEAN DEFAULT true,
    process_interval_minutes INTEGER DEFAULT 15,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMP,
    
    INDEX idx_email_accounts_user (user_id),
    INDEX idx_email_accounts_org (organization_id),
    UNIQUE KEY unique_email_per_user (user_id, email_address)
);
```

### Table: emails
```sql
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
    message_id VARCHAR(500) UNIQUE NOT NULL,
    
    -- Headers
    sender VARCHAR(255),
    sender_name VARCHAR(255),
    recipients JSONB, -- Array d'objets {email, name}
    cc JSONB,
    bcc JSONB,
    subject VARCHAR(1000),
    
    -- Contenu
    body_text TEXT,
    body_html TEXT,
    
    -- Métadonnées email
    received_at TIMESTAMP,
    sent_at TIMESTAMP,
    priority VARCHAR(20), -- 'high', 'normal', 'low'
    
    -- Analyse IA
    category VARCHAR(100), -- Catégorie détectée
    subcategory VARCHAR(100),
    confidence_score DECIMAL(3,2),
    tags JSONB, -- Tags automatiques
    
    -- Traitement
    processing_status VARCHAR(50) DEFAULT 'pending',
    processing_error TEXT,
    processed_at TIMESTAMP,
    
    -- Relations
    thread_id UUID REFERENCES email_threads(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index pour recherche full-text
    INDEX idx_emails_account (email_account_id),
    INDEX idx_emails_received (received_at),
    INDEX idx_emails_category (category),
    INDEX idx_emails_status (processing_status),
    
    -- Recherche full-text
    FULLTEXT SEARCH INDEX idx_emails_search (subject, body_text)
);
```

### Table: documents
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id),
    
    -- Informations fichier
    original_filename VARCHAR(500),
    stored_filename VARCHAR(500) UNIQUE,
    file_path VARCHAR(1000), -- Chemin dans Object Storage
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    checksum_md5 VARCHAR(32),
    checksum_sha256 VARCHAR(64),
    
    -- Classification
    document_type VARCHAR(100), -- 'invoice', 'contract', 'quote', etc.
    document_subtype VARCHAR(100),
    category_confidence DECIMAL(3,2),
    
    -- Métadonnées extraites (JSON selon type)
    extracted_metadata JSONB,
    
    -- OCR et texte
    extracted_text TEXT,
    ocr_performed BOOLEAN DEFAULT false,
    ocr_confidence DECIMAL(3,2),
    
    -- Validation
    validation_status VARCHAR(50) DEFAULT 'pending',
    validation_errors JSONB,
    requires_manual_review BOOLEAN DEFAULT false,
    
    -- Indexation
    is_indexed BOOLEAN DEFAULT false,
    indexed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index pour les performances
    INDEX idx_documents_email (email_id),
    INDEX idx_documents_org (organization_id),
    INDEX idx_documents_type (document_type),
    INDEX idx_documents_created (created_at),
    
    -- Recherche full-text sur contenu extrait
    FULLTEXT SEARCH INDEX idx_documents_search (extracted_text, extracted_metadata)
);
```

### Table: classifications
```sql
CREATE TABLE classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES classifications(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Règles de classification
    keywords JSONB, -- Mots-clés pour auto-classification
    patterns JSONB, -- Regex patterns
    ml_model_id VARCHAR(100),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_classifications_org (organization_id),
    INDEX idx_classifications_parent (parent_id)
);
```

### Table: document_classifications
```sql
CREATE TABLE document_classifications (
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    classification_id UUID REFERENCES classifications(id),
    confidence DECIMAL(3,2),
    is_primary BOOLEAN DEFAULT false,
    classified_by VARCHAR(50), -- 'system', 'user', 'manual'
    user_id UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (document_id, classification_id),
    INDEX idx_doc_class_doc (document_id),
    INDEX idx_doc_class_class (classification_id)
);
```

### Table: audit_logs
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    
    action VARCHAR(100) NOT NULL, -- 'view', 'create', 'update', 'delete', 'export'
    entity_type VARCHAR(50), -- 'email', 'document', 'user', 'classification'
    entity_id UUID,
    
    -- Détails de l'action
    old_values JSONB,
    new_values JSONB,
    
    -- Contexte
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Conformité
    legal_basis VARCHAR(100), -- RGPD
    consent_id UUID,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_audit_org (organization_id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_entity (entity_type, entity_id)
);
```

### Table: processing_logs
```sql
CREATE TABLE processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id),
    
    step VARCHAR(100), -- 'email_parsing', 'pdf_extraction', 'classification'
    status VARCHAR(50), -- 'started', 'completed', 'failed'
    
    -- Performance
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    
    -- Erreurs
    error_message TEXT,
    error_stack TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Détails
    details JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_proc_email (email_id),
    INDEX idx_proc_doc (document_id),
    INDEX idx_proc_step (step),
    INDEX idx_proc_status (status),
    INDEX idx_proc_created (created_at)
);
```

## Schéma MongoDB (Collections)

### Collection: ml_models
```javascript
{
  "_id": ObjectId("..."),
  "name": "document_classifier_v2",
  "version": "2.1.0",
  "type": "classification",
  "architecture": "transformer",
  "training_data": {
    "dataset_id": "ds_12345",
    "size": 50000,
    "last_updated": ISODate("2024-01-15")
  },
  "performance": {
    "accuracy": 0.94,
    "precision": 0.92,
    "recall": 0.95,
    "f1_score": 0.935
  },
  "deployment": {
    "endpoint": "http://ml-service:8080/classify",
    "last_deployed": ISODate("2024-01-15T10:30:00Z"),
    "status": "active"
  },
  "created_at": ISODate("2024-01-15T10:30:00Z")
}
```

### Collection: user_preferences
```javascript
{
  "_id": ObjectId("..."),
  "user_id": "usr_12345",
  "organization_id": "org_67890",
  "dashboard": {
    "layout": "grid",
    "widgets": [
      {
        "type": "chart",
        "title": "Documents par catégorie",
        "position": { "x": 0, "y": 0, "w": 6, "h": 4 }
      }
    ]
  },
  "notifications": {
    "email": {
      "daily_summary": true,
      "processing_errors": true,
      "new_documents": false
    },
    "ui": {
      "real_time_updates": true,
      "sound_alerts": false
    }
  },
  "search": {
    "default_filters": {
      "date_range": "last_30_days",
      "categories": ["invoice", "contract"]
    },
    "saved_searches": [
      {
        "name": "Factures en attente",
        "query": "type:invoice status:pending",
        "created_at": ISODate("2024-01-10")
      }
    ]
  },
  "updated_at": ISODate("2024-01-15T14:20:00Z")
}
```

### Collection: processing_metrics
```javascript
{
  "_id": ObjectId("..."),
  "date": "2024-01-15",
  "organization_id": "org_67890",
  "metrics": {
    "emails_processed": 1247,
    "documents_classified": 892,
    "processing_time": {
      "avg_seconds": 4.2,
      "p95_seconds": 12.8,
      "p99_seconds": 25.3
    },
    "classification_accuracy": {
      "overall": 0.94,
      "by_category": {
        "invoice": 0.97,
        "contract": 0.91,
        "quote": 0.89
      }
    },
    "errors": {
      "total": 23,
      "by_type": {
        "parsing": 5,
        "classification": 8,
        "storage": 3,
        "network": 7
      }
    }
  },
  "created_at": ISODate("2024-01-15T23:59:59Z")
}
```

## Redis Structures

### Sessions Utilisateur
```
Key: session:{session_id}
Type: Hash
TTL: 24 heures
Value: {
  "user_id": "usr_12345",
  "organization_id": "org_67890",
  "role": "user",
  "login_at": "2024-01-15T10:30:00Z",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0..."
}
```

### Cache de Classification
```
Key: classification:{checksum}
Type: Hash
TTL: 7 jours
Value: {
  "category": "invoice",
  "subcategory": "supplier",
  "confidence": 0.95,
  "extracted_data": {...},
  "cached_at": "2024-01-15T10:30:00Z"
}
```

### Rate Limiting
```
Key: rate_limit:{user_id}:{endpoint}
Type: String
Value: Compteur d'appels
```

### Job Queue (Celery)
```
Queue: email_processing
Queue: document_classification  
Queue: pdf_extraction
Queue: notification_sending
```

## Optimisations de Performance

### Index PostgreSQL
```sql
-- Index composites pour requêtes fréquentes
CREATE INDEX idx_documents_search ON documents 
USING GIN (extracted_metadata, document_type);

-- Index partiel pour documents non traités
CREATE INDEX idx_emails_pending ON emails(email_account_id) 
WHERE processing_status = 'pending';

-- Index pour recherche temporelle
CREATE INDEX idx_documents_date_range ON documents 
USING BTREE (created_at DESC) 
WHERE created_at > NOW() - INTERVAL '1 year';
```

### Partitionnement
```sql
-- Partitionnement par date pour les logs
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE audit_logs_2024_02 PARTITION OF audit_logs
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

## Procédures de Maintenance

### Nettoyage des Données Anciennes
```sql
-- Archivage des emails après 2 ans
WITH archived_emails AS (
    DELETE FROM emails 
    WHERE created_at < NOW() - INTERVAL '2 years'
    AND processing_status = 'completed'
    RETURNING *
)
INSERT INTO emails_archive SELECT * FROM archived_emails;
```

### Réindexation
```sql
-- Réindexation hebdomadaire
REINDEX INDEX CONCURRENTLY idx_emails_search;
REINDEX INDEX CONCURRENTLY idx_documents_search;
```

### Analyse des Statistiques
```sql
-- Mise à jour des statistiques pour l'optimiseur
ANALYZE emails;
ANALYZE documents;
ANALYZE audit_logs;
```