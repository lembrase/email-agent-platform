# Sécurité et Conformité

## Architecture de Sécurité Multi-Niveaux

```
┌─────────────────────────────────────────────────────────────────┐
│                    NIVEAU 1: PÉRIMÈTRE                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │    WAF      │  │    CDN      │  │  Rate Limit │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                    NIVEAU 2: RÉSEAU                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │     VPC     │  │    VPN      │  │   Firewall  │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                    NIVEAU 3: APPLICATION                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   HTTPS     │  │    JWT      │  │   OAuth2    │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                    NIVEAU 4: DONNÉES                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Chiffrement │  │    RBAC     │  │  Audit Log  │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                    NIVEAU 5: INFRASTRUCTURE                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Docker    │  │Kubernetes   │  │    HIDS     │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Sécurité des Données

### Chiffrement

#### Données en Transit
- **HTTPS/TLS 1.3** obligatoire pour toutes les communications
- **mTLS** pour les communications entre services internes
- **VPN IPSec** pour les connexions distantes
- **SSH avec clés RSA 4096 bits** pour l'administration

#### Données au Repos
- **PostgreSQL**: Chiffrement AES-256 au niveau disque
- **MongoDB**: Chiffrement des données et des journaux
- **Object Storage**: Chiffrement SSE-S3 avec rotation des clés
- **Backup**: Chiffrement GPG avant archivage

```sql
-- Exemple: Chiffrement colonne sensible PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Colonne email chiffrée
ALTER TABLE emails 
ADD COLUMN content_encrypted BYTEA;

-- Insertion avec chiffrement
INSERT INTO emails (content_encrypted) 
VALUES (pgp_sym_encrypt('contenu sensible', 'cle_secrete'));

-- Lecture avec déchiffrement
SELECT pgp_sym_decrypt(content_encrypted, 'cle_secrete') 
FROM emails WHERE id = 1;
```

### Gestion des Secrets
- **HashiCorp Vault** pour la gestion centralisée des secrets
- **Rotation automatique** des clés API et mots de passe
- **Séparation des environnements** (dev, staging, prod)
- **Principe du moindre privilège** pour l'accès aux secrets

## Authentification et Autorisation

### Modèle RBAC (Role-Based Access Control)

```
┌─────────────────────────────────────────────────────────┐
│                  RÔLES PRINCIPAUX                        │
├─────────────────────────────────────────────────────────┤
│  ADMIN (Full Access)                                    │
│  ├── Gestion utilisateurs                               │
│  ├── Configuration système                             │
│  ├── Accès audit logs                                  │
│  └── Backup/Restore                                    │
│                                                         │
│  MANAGER (Limited Admin)                               │
│  ├── Vue métriques globales                            │
│  ├── Gestion équipe                                    │
│  └── Configuration workflows                           │
│                                                         │
│  USER (Standard)                                       │
│  ├── Ses propres emails/documents                      │
│  ├── Recherche dans ses documents                      │
│  └── Export limité                                     │
│                                                         │
│  VIEWER (Read-Only)                                    │
│  └── Consultation uniquement                           │
└─────────────────────────────────────────────────────────┘
```

### Authentification Multi-Facteurs (MFA)
- **TOTP** (Time-based One-Time Password) avec Google Authenticator
- **WebAuthn** pour l'authentification sans mot de passe
- **Session management** avec refresh tokens sécurisés

### Permissions Granulaires
```javascript
// Exemple de permissions par document
{
  "document_id": "12345",
  "permissions": {
    "view": ["user1", "user2", "group:accounting"],
    "edit": ["user1", "group:managers"],
    "delete": ["user1"],
    "share": ["group:managers"],
    "download": ["user1", "user2"]
  }
}
```

## Conformité Légale et Réglementaire

### RGPD (Règlement Général sur la Protection des Données)

#### Droits des Personnes
1. **Droit d'accès**: Export PDF de toutes les données personnelles
2. **Droit de rectification**: Modification des données inexactes
3. **Droit à l'effacement**: Suppression définitive sur demande
4. **Droit à la portabilité**: Export au format machine-readable
5. **Droit d'opposition**: Refus du traitement automatique

#### Mesures de Conformité
```sql
-- Table d'audit RGPD
CREATE TABLE gdpr_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50), -- 'access', 'deletion', 'modification'
    entity_type VARCHAR(50), -- 'email', 'document', 'user'
    entity_id UUID,
    timestamp TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    legal_basis VARCHAR(100) -- 'consent', 'legitimate_interest', etc.
);

-- Anonymisation automatique après X mois
CREATE OR REPLACE FUNCTION anonymize_old_data()
RETURNS void AS $$
BEGIN
    UPDATE emails 
    SET 
        sender = 'anonymized@domain.com',
        subject = 'Anonymized',
        content = 'Anonymized'
    WHERE created_at < NOW() - INTERVAL '12 months'
    AND is_anonymized = false;
END;
$$ LANGUAGE plpgsql;
```

### Conservation et Archivage
- **Données personnelles**: 12-24 mois maximum après traitement
- **Documents financiers**: 7-10 ans (obligation légale)
- **Logs de sécurité**: 12 mois minimum
- **Données anonymisées**: Conservation illimitée autorisée

### Certification et Audit
- **ISO 27001**: Système de gestion de la sécurité de l'information
- **SOC 2 Type II**: Contrôles de sécurité et confidentialité
- **Penetration Testing**: Tests d'intrusion trimestriels
- **Vulnerability Scanning**: Analyse hebdomadaire automatique

## Sécurité Opérationnelle

### Monitoring et Détection des Menaces

```yaml
# Configuration Prometheus AlertManager

groups:
  - name: security_alerts
    rules:
      - alert: MultipleFailedLogins
        expr: rate(auth_failed_total[5m]) > 5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Multiple failed login attempts"
          
      - alert: SuspiciousEmailActivity
        expr: rate(emails_processed_total[5m]) > 1000
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Unusual email processing rate"
          
      - alert: DatabaseConnectionAnomaly
        expr: pg_stat_database_numbackends > 100
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High database connection count"
```

### Journalisation et Audit

#### Logs de Sécurité
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "security",
  "event": "user_login",
  "user_id": "usr_12345",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "mfa_method": "totp",
  "result": "success",
  "session_id": "sess_abc123"
}
```

#### Types de Logs
- **Authentification**: Login/logout, échecs, MFA
- **Autorisation**: Tentatives d'accès non autorisé
- **Données**: Accès aux emails/documents sensibles
- **Admin**: Changements de configuration
- **Système**: Erreurs, crashes, performance

### Backup et Recovery

#### Stratégie de Backup
- **Base de données**: Backup quotidien + WAL archiving
- **Object Storage**: Réplication multi-région
- **Configuration**: Versionnement Git avec chiffrement

#### Procédure de Recovery
```bash
# Exemple: Restauration PostgreSQL depuis backup
#!/bin/bash
BACKUP_DATE="2024-01-15"

# Arrêt du service
docker-compose stop postgres

# Restauration depuis le backup chiffré
gpg --decrypt backups/postgres-${BACKUP_DATE}.sql.gz.gpg | \
    gunzip | \
    docker exec -i postgres psql -U postgres -d email_agent

# Vérification de l'intégrité
docker-compose exec postgres pg_dump -U postgres --schema-only email_agent
```

### Continuité des Services
- **HA Database**: PostgreSQL avec patroni/etcd
- **Load Balancing**: Nginx/CloudFlare
- **Failover**: Kubernetes multi-zone
- **DR Plan**: Site de récupération secondaire

## Formation et Sensibilisation

### Programme de Formation
1. **Utilisateurs**: Sécurité des mots de passe, phishing
2. **Développeurs**: OWASP Top 10, sécurité du code
3. **Administrateurs**: Réponse aux incidents, forensics
4. **Direction**: Gouvernance, conformité, risques

### Politiques de Sécurité
- **Password Policy**: 12+ caractères, complexité élevée
- **Clean Desk Policy**: Pas de documents sensibles visibles
- **BYOD Policy**: Appareils personnels contrôlés
- **Incident Response**: Procédure de réponse aux incidents

### Tests de Sécurité Réguliers
- **Phishing Simulation**: Tests mensuels
- **Social Engineering**: Tests trimestriels
- **Security Drills**: Simulations d'incidents
- **Tabletop Exercises**: Scenarios de crise