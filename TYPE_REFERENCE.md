# Type System Quick Reference

## Import Types

```typescript
import { 
  // Domain Models
  Media, Lab, SearchResult, SDG,
  
  // API Types
  SearchRequest, SearchResponse, LabInfoResponse,
  
  // Component Props
  SearchBarProps, SearchBarHandle,
  ResultPanelProps, MediaDetailPanelProps,
  
  // Type Guards
  isMedia, isSearchResult, isLab,
  
  // Utilities
  toSearchResponse, toLabInfo,
  extractDate, formatDate
} from '@/types';
```

## Common Patterns

### Component State
```typescript
const [results, setResults] = useState<SearchResult[] | null>(null);
const [selectedMedia, setSelectedMedia] = useState<SearchResult | null>(null);
const [labInfo, setLabInfo] = useState<Lab | null>(null);
```

### Refs
```typescript
const searchBarRef = useRef<SearchBarHandle | null>(null);
```

### API Calls
```typescript
// Fetch and validate
const response = await fetch('/api/search-enhanced', {
  method: 'POST',
  body: JSON.stringify({ query, topK: 5 } satisfies SearchRequest)
});

const rawData = await response.json();
const data: SearchResponse = toSearchResponse(rawData);
```

### Type Guards
```typescript
if (isSearchResult(value)) {
  // value is now SearchResult
  console.log(value.score);
}
```

### Error Handling
```typescript
try {
  // operation
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
}
```

### Optional Properties
```typescript
const labName = result?.metadata?.lab_name ?? 'Unknown';
const published = formatDate(result.published);
```

### Array Operations
```typescript
// Find with null fallback
const media = results.find(r => r.id === id) || null;

// Filter with type guard
const validResults = data.filter(isSearchResult);

// Map with typing
const ids: string[] = results.map(r => r.id);
```

## Domain Models

### SearchResult (Primary)
```typescript
{
  id: string;           // Required
  title: string;        // Required
  author: string | null;
  content_url: string | null;
  lab_id: string | null;
  lab_name: string | null;
  published: Date | Timestamp | string | null;
  score: number;        // Required for search results
  collection?: 'media';
  previewUrl?: string | null;
  metadata?: Partial<Media>;
  fields?: Partial<Media>;
  pineconeMetadata?: PineconeMetadata;
}
```

### Lab
```typescript
{
  id: string;
  name: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  biography: string | null;
  SDGs: SDG[];
}
```

## API Contracts

### Search Request
```typescript
POST /api/search-enhanced
Body: { query: string, topK?: number }
```

### Search Response
```typescript
{
  results: SearchResult[];
  count: number;
  notFound?: string[];
  pineconeResults?: unknown;
}
```

### Lab Info Request
```typescript
GET /api/fetch-lab-info?id={labId}
```

### Lab Info Response
```typescript
Lab // Same as Lab type
```

## Component Props

### SearchBar
```typescript
interface SearchBarProps {
  onResults?: (matches: SearchResult[], query: string) => void;
}

// Ref methods
interface SearchBarHandle {
  triggerSearch: (query: string) => void;
}
```

### ResultPanel
```typescript
interface ResultPanelProps {
  result: SearchResult;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}
```

### MediaDetailPanel
```typescript
interface MediaDetailPanelProps {
  selectedMedia: SearchResult | null;
  onClose: () => void;
}
```

## Utilities

### Date Formatting
```typescript
const formatted = formatDate(dateValue);
// Returns: "January 22, 2026" or null
```

### Date Extraction
```typescript
const date = extractDate(value);
// Returns: Date object or null
```

### Type Conversion
```typescript
const searchResponse = toSearchResponse(rawApiData);
const labInfo = toLabInfo(rawLabData);
```

## TypeScript Tips

### Satisfies Operator
```typescript
// Ensures type without widening
const request = { query: 'test', topK: 5 } satisfies SearchRequest;
```

### Non-Null Assertion (use sparingly)
```typescript
const value = maybeValue!; // Only if you're 100% sure it exists
```

### Type Narrowing
```typescript
if (typeof value === 'string') {
  // value is string here
}

if (value !== null) {
  // value is not null here
}
```

### Const Assertions
```typescript
const constants = ['media', 'labs'] as const;
type CollectionType = typeof constants[number]; // 'media' | 'labs'
```

## Common Mistakes to Avoid

### ❌ Don't use `any`
```typescript
const data: any = await fetch(...); // Bad
```

### ✅ Use proper types
```typescript
const rawData = await fetch(...);
const data: SearchResponse = toSearchResponse(rawData); // Good
```

### ❌ Don't ignore undefined
```typescript
const media = results.find(r => r.id === id);
setMedia(media); // Error: undefined not assignable
```

### ✅ Handle undefined
```typescript
const media = results.find(r => r.id === id);
setMedia(media || null); // Good
```

### ❌ Don't use non-existent properties
```typescript
const id = result._id; // Error: _id doesn't exist
```

### ✅ Use defined properties
```typescript
const id = result.id; // Good
```

## Debugging Type Issues

### Check Type in IDE
Hover over variable to see inferred type

### Explicit Type Annotation
```typescript
const result: SearchResult = data; // Forces type check
```

### Type Assertions (last resort)
```typescript
const result = data as SearchResult; // Use sparingly
```

### Satisfies Operator (preferred)
```typescript
const result = data satisfies SearchResult; // Better: checks but doesn't override
```

## Files Overview

- **[types/index.ts](types/index.ts)** - All type definitions
- **[TYPE_MIGRATION.md](TYPE_MIGRATION.md)** - Detailed migration guide
- **[REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)** - Summary of changes

## When to Update Types

1. **Adding new API endpoint** → Add request/response types
2. **Adding new component** → Add props interface
3. **Changing data structure** → Update domain model
4. **Adding new field** → Update relevant interface

## Questions?

See [TYPE_MIGRATION.md](TYPE_MIGRATION.md) for detailed examples and troubleshooting.
