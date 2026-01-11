# Email Agent Platform

Une plateforme complète de gestion automatique d'emails professionnels avec agent IA intégré.

## 🚀 Fonctionnalités

- **Connexion Email**: Support IMAP/SMTP, Gmail API, Outlook API
- **Analyse IA**: Classification automatique des emails et documents
- **Extraction PDF**: Traitement et extraction de texte/métadonnées
- **Archivage**: Stockage structuré avec métadonnées enrichies
- **Recherche**: Full-text search avec filtres avancés
- **Interface Web**: UI moderne et intuitive
- **Sécurité**: Chiffrement, MFA, conformité RGPD
- **Scalabilité**: Architecture microservices avec autoscaling

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│  React + TypeScript + Material-UI                        │
├─────────────────────────────────────────────────────────┤
│                      API GATEWAY                         │
│  NestJS + Authentication + Rate Limiting                │
├─────────────────────────────────────────────────────────┤
│                  BACKEND SERVICES                        │
│  User Service │ Email Service │ Document Service        │
├─────────────────────────────────────────────────────────┤
│                    AI AGENT ENGINE                       │
│  Email Analyzer │ PDF Processor │ Document Classifier   │
├─────────────────────────────────────────────────────────┤
│                      DATA LAYER                          │
│  PostgreSQL │ MongoDB │ Redis │ Object Storage         │
└─────────────────────────────────────────────────────────┘
```

## 🛠 Stack Technique

### Frontend
- **React 18** avec TypeScript
- **Material-UI** pour les composants
- **React Query** pour la gestion d'état serveur
- **React Router** pour la navigation
- **Vite** pour le bundling

### Backend
- **NestJS** avec TypeScript
- **TypeORM** pour l'ORM
- **PostgreSQL** pour les données structurées
- **MongoDB** pour les logs et données flexibles
- **Redis** pour le cache et les sessions
- **Bull** pour les job queues

### AI Engine (Python)
- **FastAPI** pour l'API
- **spaCy** pour le NLP
- **Transformers** pour les modèles ML
- **PyMuPDF** pour le traitement PDF
- **scikit-learn** pour la classification

### Infrastructure
- **Docker** pour la conteneurisation
- **Kubernetes** pour l'orchestration
- **MinIO** pour le stockage d'objets
- **Nginx** pour le reverse proxy
- **Prometheus + Grafana** pour le monitoring

## 🚀 Démarrage Rapide

### Prérequis

- Docker et Docker Compose
- Node.js 18+ et npm
- Python 3.9+
- kubectl (pour Kubernetes, optionnel)

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/your-org/email-agent-platform.git
cd email-agent-platform
```

2. **Lancer l'infrastructure avec Docker Compose**
```bash
docker-compose up -d
```

3. **Vérifier l'état des services**
```bash
docker-compose ps
docker-compose logs -f
```

4. **Accéder à l'application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api
- AI Engine: http://localhost:8000
- AI Documentation: http://localhost:8000/docs
- MinIO Console: http://localhost:9001

### Configuration

Copier le fichier `.env.example` et modifier les variables selon votre environnement :

```bash
cp .env.example .env
```

**Variables importantes :**
```env
# Database
DATABASE_URL=postgresql://emailagent:password@localhost:5432/emailagent
MONGODB_URL=mongodb://admin:password@localhost:27017/emailagent
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Object Storage
S3_ENDPOINT=localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET_NAME=email-agent

# Gmail/Outlook API (optionnel)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
```

## 📁 Structure du Projet

```
email-agent-platform/
├── backend/                    # Backend API (NestJS)
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── users/             # User management
│   │   ├── emails/            # Email processing
│   │   ├── documents/         # Document management
│   │   └── common/            # Shared utilities
│   ├── test/                  # Tests
│   └── Dockerfile
│
├── frontend/                  # Frontend (React)
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API services
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── Dockerfile
│
├── ai-engine/                 # AI Engine (Python)
│   ├── src/
│   │   ├── analyzers/         # Email analyzers
│   │   ├── processors/        # Document processors
│   │   ├── classifiers/       # ML classifiers
│   │   └── utils/             # Utility modules
│   ├── models/                # Trained models
│   └── Dockerfile
│
├── infrastructure/            # Infrastructure as Code
│   ├── kubernetes/            # K8s manifests
│   ├── nginx/                 # Nginx configuration
│   ├── postgres/              # Database initialization
│   └── monitoring/            # Monitoring setup
│
├── docs/                     # Documentation
├── scripts/                  # Utility scripts
├── docker-compose.yml        # Docker Compose configuration
└── README.md
```

## 🔧 Développement

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### AI Engine

```bash
cd ai-engine
pip install -r requirements.txt
python main.py
```

### Tests

**Backend tests:**
```bash
cd backend
npm test
npm run test:e2e
```

**Frontend tests:**
```bash
cd frontend
npm test
```

## 🚀 Déploiement en Production

### Kubernetes

1. **Créer le namespace**
```bash
kubectl apply -f infrastructure/kubernetes/namespace.yaml
```

2. **Déployer PostgreSQL**
```bash
kubectl apply -f infrastructure/kubernetes/postgres-deployment.yaml
```

3. **Déployer Redis**
```bash
kubectl apply -f infrastructure/kubernetes/redis-deployment.yaml
```

4. **Déployer l'application**
```bash
kubectl apply -f infrastructure/kubernetes/backend-deployment.yaml
kubectl apply -f infrastructure/kubernetes/frontend-deployment.yaml
kubectl apply -f infrastructure/kubernetes/ai-engine-deployment.yaml
```

### Helm (Recommandé)

```bash
# Ajouter le repository Helm
helm repo add email-agent https://charts.your-org.com

# Déployer l'application
helm install email-agent email-agent/email-agent \
  --namespace email-agent \
  --create-namespace \
  --values production-values.yaml
```

## 📊 Monitoring

### Métriques

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3002 (admin/admin)
- **Application Metrics**: http://localhost:3001/metrics
- **AI Engine Metrics**: http://localhost:9090/metrics

### Logs

```bash
# Logs Docker Compose
docker-compose logs -f backend
docker-compose logs -f ai-engine

# Logs Kubernetes
kubectl logs -f deployment/backend -n email-agent
kubectl logs -f deployment/ai-engine -n email-agent
```

## 🔒 Sécurité

### Bonnes Pratiques

1. **Changer les mots de passe par défaut**
2. **Activer le MFA pour tous les utilisateurs**
3. **Utiliser HTTPS en production**
4. **Limiter l'accès aux bases de données**
5. **Auditer régulièrement les logs**

### Conformité RGPD

- **Droit à l'effacement**: Implémenté via API DELETE
- **Portabilité**: Export CSV/PDF disponible
- **Audit**: Toutes les actions sont journalisées
- **Chiffrement**: Données chiffrées en transit et au repos

## 📈 Scalabilité

### Horizontal Pod Autoscaler

```yaml
# Configuration de l'autoscaling
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Database Sharding

```sql
-- Partitionnement par date
CREATE TABLE emails_2024_01 PARTITION OF emails
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

- **Documentation**: https://docs.email-agent.com
- **Support Email**: support@email-agent.com
- **Issues**: https://github.com/your-org/email-agent-platform/issues

## 🎯 Roadmap

### Q1 2024
- [ ] Support multi-langues
- [ ] Intégration ERP (SAP, Oracle)
- [ ] Application mobile

### Q2 2024
- [ ] Analytics avancés
- [ ] Modèles ML personnalisés
- [ ] API publique

### Q3 2024
- [ ] Marketplace d'intégrations
- [ ] Solution white-label
- [ ] Fonctionnalités enterprise

---

**Développé avec ❤️ par l'équipe Email Agent Platform**