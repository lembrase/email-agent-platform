# Interface Utilisateur

## Architecture de l'Interface

### Structure de Navigation
```
┌─────────────────────────────────────────────────────────────────┐
│                        HEADER (Fixed)                           │
│  Logo  ┃  Navigation principale  ┃  Search  ┃  User Profile   │
├────┯────────────────────────────────────────────────────────────┤
│    │                                                             │
│ S  │                    CONTENT AREA                            │
│ I  │                                                             │
│ D  │  ┌─────────────────────────────────────────────────────┐   │
│ E  │  │                  Dashboard Widgets                  │   │
│ B  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│ A  │  │  │Metrics   │  │Charts    │  │Activity  │       │   │
│ R  │  │  │          │  │          │  │          │       │   │
│    │  │  └──────────┘  └──────────┘  └──────────┘       │   │
│    │  │                                                     │   │
│    │  │  ┌─────────────────────────────────────────────────┐ │   │
│    │  │  │              Documents Table                    │ │   │
│    │  │  │  ┌───────────────────────────────────────────┐ │ │   │
│    │  │  │  │Filter│Search│Sort│View│                  │ │ │   │
│    │  │  │  ├───────────────────────────────────────────┤ │ │   │
│    │  │  │  │□ Document│Type│Date│Status│Actions      │ │ │   │
│    │  │  │  │☑ Invoice.pdf│Facture│15/01│Validé│⬇︎⬆︎⬇️   │ │ │   │
│    │  │  │  │□ Contract.pdf│Contrat│14/01│En cours│⬇︎⬆︎⬇️ │ │ │   │
│    │  │  │  └───────────────────────────────────────────┘ │ │   │
│    │  │  └─────────────────────────────────────────────────┘ │   │
│    │  └─────────────────────────────────────────────────────┘   │
└────┴────────────────────────────────────────────────────────────┘
```

## Pages Principales

### 1. Dashboard (Page d'Accueil)

#### Composants principaux:
- **KPI Cards**: Documents traités aujourd'hui, emails analysés, taux de succès
- **Graphiques**: Répartition par type de document, évolution temporelle
- **Activité récente**: Derniers documents traités avec statut
- **Alertes**: Documents en attente de validation, erreurs de traitement

#### Widgets configurables:
```typescript
interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'activity' | 'alerts';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: WidgetConfig;
}

interface KPIWidget extends DashboardWidget {
  type: 'kpi';
  config: {
    metric: 'documents_processed' | 'emails_analyzed' | 'classification_accuracy';
    timeRange: 'today' | 'week' | 'month';
    comparison?: boolean;
  };
}
```

### 2. Gestion des Emails

#### Vue liste:
- **Colonnes**: Email, Objet, Date, Pièces jointes, Statut de traitement
- **Filtres**: Par date, statut, compte email, catégorie détectée
- **Actions**: Retraiter, marquer comme lu, archiver

#### Vue détail email:
```
┌─────────────────────────────────────────────────────────────────┐
│  Email: facture@fournisseur.com  ┃  Date: 15/01/2024 15:30    │
│  Objet: Facture n°FA-2024-001                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Corps de l'email:                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Bonjour,                                                │   │
│  │ Veuillez trouver ci-joint la facture n°FA-2024-001    │   │
│  │ Montant: 1 250,00 EUR                                  │   │
│  │ Échéance: 15/02/2024                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Pièces jointes:                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📄 facture_fournisseur.pdf (250 Ko)                    │   │
│  │    Type: Facture (95% confiance)                       │   │
│  │    ✓ Extraction réussie                                 │   │
│  │    ➜ Voir le document                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Analyse IA:                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Catégorie: Facture fournisseur                          │   │
│  │ Confiance: 95%                                          │   │
│  │ Métadonnées extraites:                                  │   │
│  │   - Numéro: FA-2024-001                                 │   │
│  │   - Montant HT: 1 041,67 EUR                           │   │
│  │   - TVA: 208,33 EUR                                    │   │
│  │   - Montant TTC: 1 250,00 EUR                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Bibliothèque de Documents

#### Vue grille avec aperçu:
```
┌─────────────────────────────────────────────────────────────────┐
│  Filtres: [Type: Tous ▼] [Date: Dernier mois ▼] [Statut: Tous ▼]│
│  Recherche: [_____________________________________] [🔍]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ 📄           │  │ 📑           │  │ 📋           │        │
│  │              │  │              │  │              │        │
│  │ facture.pdf  │  │ contrat.pdf  │  │ devis.pdf    │        │
│  │              │  │              │  │              │        │
│  │ Facture      │  │ Contrat      │  │ Devis        │        │
│  │ 15/01/2024   │  │ 14/01/2024   │  │ 13/01/2024   │        │
│  │ ✓ Validé     │  │ ⏳ En attente│  │ ✓ Validé     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Vue liste détaillée:
- **Colonnes**: Document, Type, Catégorie, Date, Statut, Propriétaire, Actions
- **Tri**: Multi-colonnes avec indicateurs visuels
- **Sélection**: Actions groupées (export, archivage, classification)

### 4. Configuration des Comptes Email

#### Liste des comptes:
```
┌─────────────────────────────────────────────────────────────────┐
│  Mes comptes email  ┃  [+ Ajouter un compte]                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📧 mon.email@gmail.com                                  │   │
│  │    Gmail / Connecté                                     │   │
│  │    Dernier sync: il y a 5 minutes                       │   │
│  │    1 247 emails traités                                 │   │
│  │    [Modifier] [Tester] [Désactiver]                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📧 pro@entreprise.fr                                    │   │
│  │    IMAP/SMTP / Erreur de connexion                      │   │
│  │    ⚠️ Mot de passe peut-être expiré                     │   │
│  │    [Modifier] [Tester] [Résoudre]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### Formulaire d'ajout de compte:
- **Étape 1**: Choix du provider (Gmail, Outlook, IMAP/SMTP)
- **Étape 2**: Authentification (OAuth2 ou mot de passe)
- **Étape 3**: Paramètres de traitement (fréquence, filtres)
- **Étape 4**: Test de connexion et validation

### 5. Paramètres de Classification

#### Gestion des catégories:
```
┌─────────────────────────────────────────────────────────────────┐
│  Catégories de classification  ┃  [+ Ajouter une catégorie]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📄 Factures                                             │   │
│  │    Mots-clés: facture, invoice, billing, payment        │   │
│  │    Patterns: FA-\d{4}-\d{3}, FAC-\d+                   │   │
│  │    Actions: [Modifier] [Dupliquer] [Supprimer]          │   │
│  │                                                         │   │
│  │   └─ 📄 Factures fournisseur                           │   │
│  │       Mots-clés: supplier, vendor, achat               │   │
│  │       Actions: [Modifier] [Supprimer]                   │   │
│  │                                                         │   │
│  │   └─ 📄 Factures client                                │   │
│  │       Mots-clés: client, customer, vente               │   │
│  │       Actions: [Modifier] [Supprimer]                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### Configuration des règles:
- **Mots-clés**: Liste de termes pour la détection automatique
- **Expressions régulières**: Patterns pour extraire des références
- **Modèles ML**: Paramètres du modèle de classification
- **Seuils de confiance**: Niveaux pour validation automatique

### 6. Tableau de Bord Admin

#### Vue d'ensemble système:
- **Métriques globales**: Emails/heure, documents classifiés, taux d'erreur
- **Utilisation des ressources**: CPU, mémoire, stockage
- **Activité utilisateurs**: Connexions, actions, exports
- **Santé des services**: Statut des composants, temps de réponse

#### Gestion des erreurs:
```
┌─────────────────────────────────────────────────────────────────┐
│  Erreurs de traitement  ┃  [Export CSV] [Vider la liste]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ⚠️ Erreur de classification                            │   │
│  │    Document: facture_123.pdf                            │   │
│  │    Erreur: Timeout lors de l'extraction du texte      │   │
│  │    Date: 15/01/2024 14:30                               │   │
│  │    [Retry] [Ignorer] [Voir les détails]                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Composants UI Réutilisables

### 1. DocumentCard
```typescript
interface DocumentCardProps {
  document: Document;
  viewMode: 'grid' | 'list';
  showPreview?: boolean;
  onSelect?: (id: string) => void;
  onAction?: (action: string, id: string) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  viewMode,
  showPreview = true,
  onSelect,
  onAction
}) => {
  return (
    <Card className={`document-card ${viewMode}`}>
      {showPreview && (
        <CardMedia className="document-preview">
          <PdfThumbnail src={document.thumbnailUrl} />
        </CardMedia>
      )}
      <CardContent>
        <Typography variant="h6">{document.name}</Typography>
        <Chip label={document.type} color="primary" size="small" />
        <Typography variant="body2" color="textSecondary">
          {document.date} • {document.status}
        </Typography>
      </CardContent>
      <CardActions>
        <IconButton onClick={() => onAction('view', document.id)}>
          <VisibilityIcon />
        </IconButton>
        <IconButton onClick={() => onAction('download', document.id)}>
          <DownloadIcon />
        </IconButton>
        <IconButton onClick={() => onAction('share', document.id)}>
          <ShareIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};
```

### 2. SearchBar
```typescript
interface SearchBarProps {
  placeholder?: string;
  filters?: Filter[];
  onSearch: (query: string, filters: ActiveFilter[]) => void;
  onSaveSearch?: (name: string, query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Rechercher des documents...",
  filters = [],
  onSearch,
  onSaveSearch
}) => {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  
  return (
    <Paper className="search-bar">
      <InputBase
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onSearch(query, activeFilters)}
      />
      <FilterMenu
        filters={filters}
        activeFilters={activeFilters}
        onChange={setActiveFilters}
      />
      <IconButton onClick={() => onSearch(query, activeFilters)}>
        <SearchIcon />
      </IconButton>
    </Paper>
  );
};
```

### 3. ClassificationTrainer
```typescript
interface ClassificationTrainerProps {
  category: ClassificationCategory;
  samples: Document[];
  onTrain: (categoryId: string, samples: string[]) => void;
}

const ClassificationTrainer: React.FC<ClassificationTrainerProps> = ({
  category,
  samples,
  onTrain
}) => {
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  
  return (
    <div className="classification-trainer">
      <Typography variant="h6">
        Entraîner la catégorie: {category.name}
      </Typography>
      
      <DocumentGrid
        documents={samples}
        selectedIds={selectedSamples}
        onSelectionChange={setSelectedSamples}
        selectable
      />
      
      <Button
        variant="contained"
        color="primary"
        onClick={() => onTrain(category.id, selectedSamples)}
        disabled={selectedSamples.length === 0}
      >
        Entraîner avec {selectedSamples.length} documents
      </Button>
    </div>
  );
};
```

## Design System

### Palette de Couleurs
```css
:root {
  --primary-main: #1976d2;
  --primary-light: #42a5f5;
  --primary-dark: #1565c0;
  
  --secondary-main: #dc004e;
  --secondary-light: #e33371;
  --secondary-dark: #9a0036;
  
  --success-main: #2e7d32;
  --warning-main: #ed6c02;
  --error-main: #d32f2f;
  
  --grey-50: #fafafa;
  --grey-100: #f5f5f5;
  --grey-200: #eeeeee;
  --grey-300: #e0e0e0;
  --grey-400: #bdbdbd;
  --grey-500: #9e9e9e;
  --grey-600: #757575;
  --grey-700: #616161;
  --grey-800: #424242;
  --grey-900: #212121;
}
```

### Typographie
```css
--font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-family-secondary: 'JetBrains Mono', 'Fira Code', monospace;

--font-size-h1: 2.5rem;    /* 40px */
--font-size-h2: 2rem;      /* 32px */
--font-size-h3: 1.75rem;   /* 28px */
--font-size-h4: 1.5rem;    /* 24px */
--font-size-h5: 1.25rem;   /* 20px */
--font-size-h6: 1rem;      /* 16px */
--font-size-body1: 1rem;   /* 16px */
--font-size-body2: 0.875rem; /* 14px */
--font-size-caption: 0.75rem; /* 12px */
```

### Espacement
```css
--spacing-1: 0.5rem;   /* 8px */
--spacing-2: 1rem;     /* 16px */
--spacing-3: 1.5rem;   /* 24px */
--spacing-4: 2rem;     /* 32px */
--spacing-5: 2.5rem;   /* 40px */
--spacing-6: 3rem;     /* 48px */
```

## Responsive Design

### Breakpoints
```css
--breakpoint-xs: 0px;
--breakpoint-sm: 600px;
--breakpoint-md: 960px;
--breakpoint-lg: 1280px;
--breakpoint-xl: 1920px;
```

### Adaptations Mobile
- **Sidebar**: Devient un drawer latéral
- **Tableaux**: Cards avec scroll horizontal
- **Formulaires**: Full-width avec labels au-dessus
- **Navigation**: Bottom navigation bar

## Accessibilité

### Standards respectés:
- **WCAG 2.1 AA**: Contraste minimum 4.5:1
- **ARIA Labels**: Tous les composants interactifs
- **Keyboard Navigation**: Tab order logique
- **Screen Readers**: Descriptions alternatives
- **Focus Management**: Indicateurs de focus visibles

### Exemple de composant accessible:
```typescript
const AccessibleDocumentCard: React.FC<DocumentCardProps> = (props) => {
  return (
    <article
      role="article"
      aria-label={`Document ${props.document.name} de type ${props.document.type}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          props.onAction?.('view', props.document.id);
        }
      }}
    >
      <h3>{props.document.name}</h3>
      <p>
        Type: <span aria-label={getDocumentTypeLabel(props.document.type)}>
          {props.document.type}
        </span>
      </p>
      <button
        aria-label={`Télécharger ${props.document.name}`}
        onClick={(e) => {
          e.stopPropagation();
          props.onAction?.('download', props.document.id);
        }}
      >
        <DownloadIcon aria-hidden="true" />
      </button>
    </article>
  );
};
```