# Guide d'Implémentation

## Vue d'ensemble du Projet

### Architecture Complète

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ARCHITECTURE GLOBALE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐              ┌─────────────────┐                  │
│  │   FRONTEND      │  HTTPS/WSS   │   API GATEWAY   │   GRPC/REST     │
│  │ React + TS      │◄────────────►│  (NestJS)       │◄───────────────►│
│  └─────────────────┘              └─────────────────┘                 │
│                                            │                            │
│                                            ▼                            │
│                            ┌──────────────────────────┐               │
│                            │   BACKEND SERVICES       │               │
│                            │   (Microservices)        │               │
│                            ├──────────────────────────┤               │
│                            │ • User Service           │               │
│                            │ • Email Service          │               │
│                            │ • Document Service       │               │
│                            │ • Classification Service │               │
│                            │ • Notification Service   │               │
│                            └──────────────────────────┘               │
│                                            │                            │
│                                            ▼                            │
│                            ┌──────────────────────────┐               │
│                            │   AI AGENT ENGINE        │               │
│                            │   (Python + FastAPI)     │               │
│                            ├──────────────────────────┤               │
│                            │ • Email Analyzer         │               │
│                            │ • PDF Processor          │               │
│                            │ • Document Classifier    │               │
│                            │ • Metadata Extractor     │               │
│                            └──────────────────────────┘               │
│                                            │                            │
│                    ┌───────────────────────┼───────────────────────┐   │
│                    ▼                       ▼                       ▼   │
│            ┌──────────────┐      ┌──────────────┐      ┌──────────────┐│
│            │  POSTGRESQL  │      │    MONGODB   │      │    REDIS     ││
│            │  (Primary)   │      │   (Logs)     │      │   (Cache)    ││
│            └──────────────┘      └──────────────┘      └──────────────┘│
│                    │                                              │      │
│                    ▼                                              ▼      │
│            ┌─────────────────────────────────────────┐  ┌──────────────┐│
│            │    OBJECT STORAGE (MinIO/S3)            │  │ELASTICSEARCH ││
│            │    • PDF Originals                      │  │   (Search)   ││
│            │    • PDF Processed                      │  └──────────────┘│
│            │    • Thumbnails                         │                │
│            └─────────────────────────────────────────┘                │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Plan de Déploiement par Phases

### Phase 1: Infrastructure de Base (Sprint 1-2)

#### Objectifs:
- Configuration de l'environnement de développement
- Mise en place de l'infrastructure Docker/Kubernetes
- Base de données opérationnelles
- CI/CD fonctionnel

#### Livrables:
```bash
# Structure du projet
email-agent-platform/
├── infrastructure/
│   ├── docker-compose.yml          # Dev environment
│   ├── kubernetes/                 # K8s manifests
│   │   ├── namespaces.yaml
│   │   ├── postgres/               # PostgreSQL deployment
│   │   ├── mongodb/                # MongoDB deployment
│   │   ├── redis/                  # Redis deployment
│   │   └── minio/                  # Object storage
│   ├── terraform/                  # Infrastructure as Code
│   └── monitoring/                 # Prometheus + Grafana
├── scripts/
│   ├── setup-dev.sh               # Setup development
│   ├── deploy-staging.sh          # Deploy to staging
│   └── backup-restore.sh          # Backup utilities
└── docs/
    ├── api-spec.yaml              # OpenAPI specification
    ├── database-schema.sql        # Database schema
    └── deployment-guide.md        # Deployment instructions
```

#### Commandes de démarrage:
```bash
# 1. Cloner le repository
git clone https://github.com/your-org/email-agent-platform.git
cd email-agent-platform

# 2. Lancer l'infrastructure de développement
cd infrastructure
docker-compose up -d postgres mongodb redis minio

# 3. Vérifier l'état des services
docker-compose ps
docker-compose logs -f

# 4. Initialiser les bases de données
npm run db:migrate
npm run db:seed
```

### Phase 2: Backend API (Sprint 3-4)

#### Services à développer:

##### 1. User Service
```typescript
// Structure du service
src/
├── user/
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.entity.ts
│   ├── user.dto.ts
│   └── user.module.ts
```

**Endpoints principaux:**
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Refresh token
- `GET /api/users/profile` - Profil utilisateur
- `PUT /api/users/profile` - Modification profil
- `POST /api/users/mfa/enable` - Activation MFA

##### 2. Email Service
```typescript
// Connexion IMAP/SMTP
interface EmailProvider {
  connect(config: EmailConfig): Promise<void>;
  fetchEmails(options: FetchOptions): Promise<Email[]>;
  sendEmail(email: EmailData): Promise<void>;
  watchForNewEmails(callback: (email: Email) => void): void;
}

// Gmail API Implementation
class GmailProvider implements EmailProvider {
  private oauth2Client: OAuth2Client;
  
  async connect(config: GmailConfig): Promise<void> {
    this.oauth2Client = new OAuth2Client(config.clientId, config.clientSecret);
    this.oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken
    });
  }
  
  async fetchEmails(options: FetchOptions): Promise<Email[]> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: options.query,
      maxResults: options.limit
    });
    
    return this.parseGmailMessages(response.data.messages || []);
  }
}
```

##### 3. Document Service
```typescript
// Gestion des documents
interface DocumentService {
  uploadDocument(file: File, metadata: DocumentMetadata): Promise<Document>;
  getDocument(id: string): Promise<Document>;
  searchDocuments(query: SearchQuery): Promise<PaginatedResult<Document>>;
  classifyDocument(id: string): Promise<ClassificationResult>;
  extractText(id: string): Promise<ExtractionResult>;
}

// Upload vers Object Storage
class S3DocumentService implements DocumentService {
  private s3Client: S3Client;
  
  async uploadDocument(file: File, metadata: DocumentMetadata): Promise<Document> {
    const key = this.generateDocumentKey(metadata);
    
    const uploadParams = {
      Bucket: this.config.bucketName,
      Key: key,
      Body: file.stream(),
      ContentType: file.mimetype,
      Metadata: {
        'user-id': metadata.userId,
        'organization-id': metadata.organizationId,
        'original-name': file.originalname,
        'upload-timestamp': new Date().toISOString()
      }
    };
    
    await this.s3Client.putObject(uploadParams);
    
    return this.createDocumentRecord(key, metadata);
  }
  
  private generateDocumentKey(metadata: DocumentMetadata): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return `${metadata.organizationId}/${year}/${month}/${uuidv4()}/${metadata.originalName}`;
  }
}
```

### Phase 3: AI Agent Engine (Sprint 5-6)

#### Composants Python:

##### 1. Email Analyzer
```python
# email_analyzer.py
from typing import List, Dict, Optional
import spacy
from transformers import pipeline

class EmailAnalyzer:
    def __init__(self):
        self.nlp = spacy.load("fr_core_news_lg")
        self.classifier = pipeline(
            "text-classification",
            model="your-org/email-classifier-fr"
        )
    
    def analyze_email(self, email_data: Dict) -> EmailAnalysis:
        # Analyse du contenu
        doc = self.nlp(email_data['body_text'])
        
        # Classification
        classification = self.classifier(email_data['body_text'][:512])
        
        # Extraction d'entités
        entities = self.extract_entities(doc)
        
        # Détection de pièces jointes
        attachments = self.detect_attachments(email_data)
        
        return EmailAnalysis(
            category=classification['label'],
            confidence=classification['score'],
            entities=entities,
            attachments=attachments,
            priority=self.calculate_priority(doc),
            tags=self.extract_tags(doc)
        )
    
    def extract_entities(self, doc) -> List[Entity]:
        entities = []
        
        for ent in doc.ents:
            entities.append(Entity(
                text=ent.text,
                label=ent.label_,
                start=ent.start_char,
                end=ent.end_char
            ))
        
        return entities
```

##### 2. PDF Processor
```python
# pdf_processor.py
import fitz  # PyMuPDF
import pdfplumber
from typing import Optional, Dict, List

class PDFProcessor:
    def __init__(self):
        self.ocr_enabled = True
        self.supported_mime_types = ['application/pdf']
    
    def process_pdf(self, file_path: str) -> PDFProcessingResult:
        result = PDFProcessingResult()
        
        # Extraction texte avec PyMuPDF (plus rapide)
        text_content = self.extract_text_pymupdf(file_path)
        
        # Extraction tables avec pdfplumber
        tables = self.extract_tables_pdfplumber(file_path)
        
        # Extraction métadonnées
        metadata = self.extract_metadata(file_path)
        
        # OCR si nécessaire (si peu de texte extrait)
        if len(text_content.strip()) < 100 and self.ocr_enabled:
            text_content = self.perform_ocr(file_path)
            result.ocr_performed = True
        
        result.text = text_content
        result.tables = tables
        result.metadata = metadata
        result.word_count = len(text_content.split())
        
        return result
    
    def extract_text_pymupdf(self, file_path: str) -> str:
        doc = fitz.open(file_path)
        text_parts = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text_parts.append(page.get_text())
        
        doc.close()
        return '\n'.join(text_parts)
    
    def extract_tables_pdfplumber(self, file_path: str) -> List[Table]:
        tables = []
        
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_tables = page.extract_tables()
                
                for table_data in page_tables:
                    if table_data and len(table_data) > 1:
                        tables.append(Table(
                            rows=table_data,
                            page_number=page.page_number
                        ))
        
        return tables
```

##### 3. Document Classifier
```python
# document_classifier.py
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
import joblib

class DocumentClassifier:
    def __init__(self, model_path: str = None):
        self.vectorizer = TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 3),
            stop_words='french'
        )
        
        if model_path:
            self.load_model(model_path)
        else:
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
    
    def train(self, documents: List[str], labels: List[str]):
        # Vectorisation
        X = self.vectorizer.fit_transform(documents)
        
        # Entraînement
        self.model.fit(X, labels)
        
        # Sauvegarde
        joblib.dump(self.vectorizer, 'models/vectorizer.pkl')
        joblib.dump(self.model, 'models/classifier.pkl')
    
    def predict(self, text: str) -> ClassificationResult:
        # Vectorisation
        X = self.vectorizer.transform([text])
        
        # Prédiction
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        confidence = max(probabilities)
        
        return ClassificationResult(
            category=prediction,
            confidence=confidence,
            alternatives=self.get_top_categories(probabilities)
        )
    
    def load_model(self, model_path: str):
        self.vectorizer = joblib.load(f'{model_path}/vectorizer.pkl')
        self.model = joblib.load(f'{model_path}/classifier.pkl')
```

### Phase 4: Frontend (Sprint 7-8)

#### Application React:

##### 1. Configuration du projet
```json
{
  "name": "email-agent-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-query": "^3.39.0",
    "axios": "^1.3.0",
    "react-hook-form": "^7.43.0",
    "date-fns": "^2.29.0",
    "recharts": "^2.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^4.9.0",
    "vite": "^4.1.0",
    "@vitejs/plugin-react": "^3.1.0",
    "eslint": "^8.34.0",
    "prettier": "^2.8.0"
  }
}
```

##### 2. Structure des composants
```
src/
├── components/
│   ├── common/
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── DataTable.tsx
│   │   └── SearchBar.tsx
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── KPICard.tsx
│   │   ├── DocumentChart.tsx
│   │   └── RecentActivity.tsx
│   ├── documents/
│   │   ├── DocumentList.tsx
│   │   ├── DocumentCard.tsx
│   │   ├── DocumentViewer.tsx
│   │   └── DocumentUpload.tsx
│   ├── emails/
│   │   ├── EmailList.tsx
│   │   ├── EmailViewer.tsx
│   │   └── EmailAccountSettings.tsx
│   └── auth/
│       ├── Login.tsx
│       ├── Register.tsx
│       └── MFASetup.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useDocuments.ts
│   ├── useSearch.ts
│   └── useWebSocket.ts
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── document.service.ts
│   └── email.service.ts
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
└── types/
    ├── api.types.ts
    ├── document.types.ts
    └── user.types.ts
```

##### 3. Exemple de page Dashboard
```typescript
// pages/Dashboard.tsx
import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { useQuery } from 'react-query';
import { DashboardService } from '../services/dashboard.service';
import KPICard from '../components/dashboard/KPICard';
import DocumentChart from '../components/dashboard/DocumentChart';
import RecentActivity from '../components/dashboard/RecentActivity';

const Dashboard: React.FC = () => {
  const { data: metrics, isLoading: metricsLoading } = useQuery(
    'dashboard-metrics',
    () => DashboardService.getMetrics(),
    { refetchInterval: 30000 } // Rafraîchir toutes les 30 secondes
  );
  
  const { data: activity } = useQuery(
    'recent-activity',
    () => DashboardService.getRecentActivity(),
    { refetchInterval: 60000 }
  );
  
  if (metricsLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord
      </Typography>
      
      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Documents aujourd'hui"
            value={metrics?.documentsToday || 0}
            trend={metrics?.documentsTrend}
            icon="document"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Emails analysés"
            value={metrics?.emailsAnalyzed || 0}
            trend={metrics?.emailsTrend}
            icon="email"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Précision moyenne"
            value={`${metrics?.averageAccuracy || 0}%`}
            trend={metrics?.accuracyTrend}
            icon="accuracy"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="À valider"
            value={metrics?.pendingReview || 0}
            trend={metrics?.pendingTrend}
            icon="warning"
            color="warning"
          />
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <DocumentChart
              data={metrics?.chartData}
              title="Évolution des documents"
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <RecentActivity
              activities={activity}
              title="Activité récente"
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
```

### Phase 5: Intégration et Tests (Sprint 9-10)

#### Tests automatisés:

##### Tests Backend (Jest)
```typescript
// __tests__/email.service.test.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../src/email/email.service';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('EmailService', () => {
  let service: EmailService;
  let mockRepository: any;
  
  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: getRepositoryToken(Email),
          useValue: mockRepository,
        },
      ],
    }).compile();
    
    service = module.get<EmailService>(EmailService);
  });
  
  describe('processEmail', () => {
    it('should process a valid email', async () => {
      const emailData = {
        subject: 'Test Email',
        sender: 'test@example.com',
        body: 'This is a test email',
      };
      
      mockRepository.create.mockReturnValue(emailData);
      mockRepository.save.mockResolvedValue({ id: '123', ...emailData });
      
      const result = await service.processEmail(emailData);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('123');
      expect(mockRepository.create).toHaveBeenCalledWith(emailData);
    });
  });
});
```

##### Tests Frontend (React Testing Library)
```typescript
// __tests__/DocumentCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DocumentCard from '../components/documents/DocumentCard';

describe('DocumentCard', () => {
  const mockDocument = {
    id: '123',
    name: 'Test Document.pdf',
    type: 'invoice',
    status: 'processed',
    createdAt: '2024-01-15T10:00:00Z',
    size: 1024000,
  };
  
  it('should render document information', () => {
    render(<DocumentCard document={mockDocument} viewMode="grid" />);
    
    expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
    expect(screen.getByText('Facture')).toBeInTheDocument();
    expect(screen.getByText('15/01/2024')).toBeInTheDocument();
  });
  
  it('should call onAction when download button is clicked', () => {
    const onAction = jest.fn();
    render(
      <DocumentCard 
        document={mockDocument} 
        viewMode="grid" 
        onAction={onAction}
      />
    );
    
    const downloadButton = screen.getByLabelText('Télécharger');
    fireEvent.click(downloadButton);
    
    expect(onAction).toHaveBeenCalledWith('download', '123');
  });
});
```

##### Tests d'Intégration (Cypress)
```typescript
// cypress/e2e/document-management.cy.ts
describe('Document Management', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password');
    cy.visit('/documents');
  });
  
  it('should upload and classify a document', () => {
    // Upload d'un document
    cy.get('[data-testid="upload-button"]').click();
    cy.get('input[type="file"]').selectFile('fixtures/sample-invoice.pdf');
    
    // Vérification du traitement
    cy.get('[data-testid="processing-status"]')
      .should('contain', 'Traitement en cours');
    
    cy.get('[data-testid="processing-status"]')
      .should('contain', 'Classification terminée', { timeout: 10000 });
    
    // Vérification des métadonnées extraites
    cy.get('[data-testid="document-type"]')
      .should('contain', 'Facture');
    
    cy.get('[data-testid="extracted-amount"]')
      .should('contain', '1 250,00 EUR');
  });
  
  it('should search and filter documents', () => {
    // Recherche
    cy.get('[data-testid="search-input"]').type('facture');
    cy.get('[data-testid="search-button"]').click();
    
    // Filtre par type
    cy.get('[data-testid="filter-type"]').click();
    cy.get('[data-testid="filter-option-invoice"]').click();
    
    // Vérification des résultats
    cy.get('[data-testid="document-list"]')
      .should('contain', 'Facture');
    
    cy.get('[data-testid="document-count"]')
      .should('contain', '3 documents trouvés');
  });
});
```

### Phase 6: Production (Sprint 11-12)

#### Déploiement Kubernetes:

##### Configuration Helm:
```yaml
# helm/email-agent/values.yaml
replicaCount: 3

image:
  repository: your-registry/email-agent
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 80

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: app.email-agent.com
      paths:
        - path: /
          pathType: ImplementationSpecific
  tls:
    - secretName: email-agent-tls
      hosts:
        - app.email-agent.com

resources:
  limits:
    cpu: 1000m
    memory: 2Gi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80

postgresql:
  enabled: true
  auth:
    username: emailagent
    password: "changeme"
    database: emailagent
  primary:
    persistence:
      enabled: true
      size: 100Gi

redis:
  enabled: true
  auth:
    enabled: true
    password: "changeme"
  master:
    persistence:
      enabled: true
      size: 8Gi
```

##### Déploiement:
```bash
# 1. Ajouter le repository Helm
helm repo add your-repo https://charts.your-org.com
helm repo update

# 2. Déployer avec Helm
helm install email-agent your-repo/email-agent \
  --namespace email-agent \
  --create-namespace \
  --values production-values.yaml

# 3. Vérifier le déploiement
kubectl get pods -n email-agent
kubectl get services -n email-agent
kubectl get ingress -n email-agent

# 4. Configuration DNS
# Ajouter un enregistrement A pointant vers l'IP du load balancer
```

## Monitoring et Maintenance

### Dashboards Grafana:

#### 1. Infrastructure Metrics
- CPU/Memory usage par service
- Disk I/O et espace disque
- Network traffic
- Container restarts

#### 2. Application Metrics
- Requêtes HTTP par endpoint
- Temps de réponse
- Taux d'erreur
- Active users

#### 3. Business Metrics
- Documents traités par heure
- Classification accuracy
- Email processing time
- User activity

### Alertes Prometheus:

```yaml
# prometheus/rules/email-agent.yml
groups:
  - name: email-agent-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"
      
      - alert: EmailProcessingStuck
        expr: increase(emails_processed_total[10m]) == 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Email processing appears stuck"
          description: "No emails processed in the last 10 minutes"
      
      - alert: DatabaseConnectionsHigh
        expr: pg_stat_database_numbackends > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High number of database connections"
          description: "{{ $value }} connections active"
```

### Procédures de Maintenance:

#### Backup quotidien:
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/email-agent"

# Backup PostgreSQL
pg_dump -h postgres-service -U emailagent emailagent | \
  gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Backup MongoDB
mongodump --host mongodb-service --db emailagent --out $BACKUP_DIR/mongo_$DATE

# Backup Object Storage (MinIO)
mc mirror minio/email-agent-documents $BACKUP_DIR/minio_$DATE

# Chiffrer les backups
gpg --batch --yes --passphrase-file /secrets/backup.passphrase \
  --symmetric --cipher-algo AES256 $BACKUP_DIR/*_$DATE*

# Supprimer les anciens backups (garder 30 jours)
find $BACKUP_DIR -name "*.gpg" -mtime +30 -delete
```

#### Mise à jour en production:
```bash
# Rolling update avec zéro downtime
kubectl set image deployment/email-agent \
  email-agent=your-registry/email-agent:1.1.0 \
  -n email-agent

# Vérifier le rollout
kubectl rollout status deployment/email-agent -n email-agent

# Rollback si nécessaire
kubectl rollout undo deployment/email-agent -n email-agent
```

## Sécurité en Production

### Network Policies:
```yaml
# kubernetes/network-policies/default-deny.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: email-agent
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

### Pod Security Policies:
```yaml
# kubernetes/pod-security-policy/restricted.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

### Secrets Management:
```bash
# Créer les secrets Kubernetes
kubectl create secret generic email-agent-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=jwt-secret="your-jwt-secret" \
  --from-literal=encryption-key="your-encryption-key" \
  --namespace email-agent

# Utiliser dans les pods
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: email-agent-secrets
        key: database-url
```

## Coûts et Scalabilité

### Estimation des coûts (100 utilisateurs):

#### Infrastructure Cloud (AWS):
- **Kubernetes Cluster (EKS)**: 3 nodes t3.medium = $150/mois
- **PostgreSQL (RDS)**: db.t3.medium = $80/mois
- **MongoDB (DocumentDB)**: db.t3.medium = $90/mois
- **Object Storage (S3)**: 500 Go = $25/mois
- **Load Balancer (ALB)**: $25/mois
- **Monitoring (CloudWatch)**: $20/mois
- **Total**: ~$390/mois

#### Alternative On-Premise:
- **Serveurs**: 3x bare-metal = $15,000 (achat)
- **Stockage**: NAS 10 To = $3,000 (achat)
- **Licences**: $5,000/an
- **Total 3 ans**: ~$33,000

### Scalabilité:

#### Horizontal Pod Autoscaler:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: email-agent-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: email-agent
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### Database Sharding:
```sql
-- Partitionnement par organisation
CREATE TABLE documents_2024_01 PARTITION OF documents
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Index partiel pour performances
CREATE INDEX idx_documents_org_type ON documents(organization_id, document_type)
WHERE created_at > NOW() - INTERVAL '6 months';
```

## Conclusion

Cette architecture fournit une base solide pour un système de gestion automatique d'emails professionnels avec les caractéristiques suivantes:

### Avantages clés:
- **Scalabilité**: Architecture microservices avec autoscaling
- **Fiabilité**: Résilience aux pannes avec retry et circuit breakers
- **Performance**: Traitement parallèle et caching optimisé
- **Sécurité**: Chiffrement, authentification MFA, conformité RGPD
- **Maintenabilité**: Code modulaire avec tests automatisés

### Points de vigilance:
- **Complexité**: Nécessite une équipe expérimentée en DevOps
- **Coûts**: Infrastructure cloud significative en production
- **Performance IA**: Nécessite des GPUs pour le training de modèles
- **Conformité**: Audit régulier pour maintenir la certification

### Prochaines étapes:
1. Validation du POC (Proof of Concept) sur 2-3 mois
2. Développement MVP (Minimum Viable Product) sur 6 mois
3. Tests utilisateurs et itérations sur 3 mois
4. Déploiement progressif en production
5. Améliorations continues basées sur les retours

Cette solution est prête à être implémentée par une équipe de développement compétente et offre les fondations pour une plateforme robuste et évolutive.