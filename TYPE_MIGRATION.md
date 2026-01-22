# Type Safety Migration Guide

## Overview

This document describes the transformation of the Living Labs codebase from using widespread `any` types to explicit domain models. This migration improves type safety, catches errors at compile-time, and makes the codebase more maintainable and shareable with other developers.

## What Changed

### Before: Loose Typing
```typescript
// Components accepted any data
const [results, setResults] = useState<any[] | null>(null);
const searchBarRef = useRef<any>(null);

// Functions returned untyped data
async function enrichWithFirestore(mediaIds: string[]) {
  // returned: any
}

// API responses were untyped
const data = await res.json(); // data: any
```

### After: Explicit Domain Models
```typescript
// Components use specific types
const [results, setResults] = useState<SearchResult[] | null>(null);
const searchBarRef = useRef<SearchBarHandle | null>(null);

// Functions have explicit return types
async function enrichWithFirestore(mediaIds: string[]): Promise<EnrichmentResult> {
  // Must return { enriched: EnrichedMedia[], notFound: string[] }
}

// API responses are validated
const rawData = await res.json();
const data: SearchResponse = toSearchResponse(rawData);
```

## New Type System

### Core Domain Models ([types/index.ts](types/index.ts))

#### 1. **Media** - Represents a media item
```typescript
interface Media {
  id: string;
  title: string;
  author: string | null;
  content_url: string | null;
  lab_id: string | null;
  lab_name: string | null;
  published: Date | Timestamp | string | null;
  collection?: 'media';
  score?: number;
}
```

#### 2. **Lab** - Represents a Living Lab organization
```typescript
interface Lab {
  id: string;
  name: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  biography: string | null;
  SDGs: SDG[];
}
```

#### 3. **SearchResult** - Combines Media with search metadata
```typescript
interface SearchResult extends Media {
  score: number; // Required for search results
  pineconeMetadata?: PineconeMetadata;
  previewUrl?: string | null;
  metadata?: Partial<Media>; // Legacy compatibility
  fields?: Partial<Media>; // Legacy compatibility
}
```

### API Boundary Types

#### Request Types
```typescript
interface SearchRequest {
  query: string;
  topK?: number;
}
```

#### Response Types
```typescript
interface SearchResponse {
  results: SearchResult[];
  count: number;
  notFound?: string[];
  pineconeResults?: unknown;
}

interface LabInfoResponse extends Lab {}

interface ApiErrorResponse {
  error: string;
  details?: string;
}
```

### Component Props Types

```typescript
interface SearchBarProps {
  onResults?: (matches: SearchResult[], query: string) => void;
}

interface SearchBarHandle {
  triggerSearch: (query: string) => void;
}

interface ResultPanelProps {
  result: SearchResult;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}

interface MediaDetailPanelProps {
  selectedMedia: SearchResult | null;
  onClose: () => void;
}
```

## Type Guards and Utilities

### Type Guards
Type guards validate data at runtime and provide type narrowing:

```typescript
// Check if unknown data is a Media object
if (isMedia(value)) {
  // TypeScript now knows value is Media
  console.log(value.id); // ✅ No error
}

// Check if data is a SearchResult
if (isSearchResult(value)) {
  console.log(value.score); // ✅ score is available
}
```

### Type Conversion Utilities
Convert and validate API responses:

```typescript
// Safely convert API response to SearchResponse
try {
  const data: SearchResponse = toSearchResponse(rawApiData);
  // data is now validated and typed
} catch (error) {
  // Invalid response structure
}

// Convert to Lab with validation
const lab: Lab = toLabInfo(rawLabData);
```

### Date Utilities
```typescript
// Extract date from various formats
const date = extractDate(value); // Date | null

// Format date consistently
const formatted = formatDate(dateValue); // "January 22, 2026"
```

## Migration Changes by File

### API Routes

#### [`app/api/search-enhanced/route.ts`](app/api/search-enhanced/route.ts)
- ✅ Import types: `SearchRequest`, `SearchResponse`, `EnrichedMedia`, `EnrichmentResult`
- ✅ Type Firestore: `Firestore | null` instead of `any`
- ✅ Function signatures: All helpers use `Record<string, unknown>` instead of `any`
- ✅ Return types: Explicit `Promise<EnrichmentResult>`
- ✅ Error handling: `unknown` instead of `any`

**Before:**
```typescript
let db: any = null;
async function enrichWithFirestore(mediaIds: string[]) {
  const enriched: any[] = [];
  // ...
}
```

**After:**
```typescript
let db: Firestore | null = null;
async function enrichWithFirestore(mediaIds: string[]): Promise<EnrichmentResult> {
  const enriched: EnrichedMedia[] = [];
  // ...
}
```

#### [`app/api/fetch-lab-info/route.ts`](app/api/fetch-lab-info/route.ts)
- ✅ Import types: `LabInfoResponse`, `PineconeMetadata`
- ✅ Type metadata properly with validation
- ✅ Explicit return type: `LabInfoResponse`

**Before:**
```typescript
const labInfo = {
  id: labId,
  name: metadata.name || null,
  // ...
};
```

**After:**
```typescript
const labInfo: LabInfoResponse = {
  id: labId,
  name: typeof metadata.name === 'string' ? metadata.name : null,
  // ... with type checking
};
```

### Components

#### [`components/SearchBar.tsx`](components/SearchBar.tsx)
- ✅ Import domain types: `SearchBarProps`, `SearchBarHandle`, `SearchResult`
- ✅ Remove inline type definitions
- ✅ Type `forwardRef` properly: `forwardRef<SearchBarHandle, SearchBarProps>`
- ✅ Validate API responses: Use `toSearchResponse()`
- ✅ Clean data properly with typed `cleanFirestoreRefs()`

**Before:**
```typescript
const SearchBar = forwardRef<any, SearchBarProps>(({ onResults }, ref) => {
  async function doSearch(q: string) {
    const data = await res.json(); // any
    let matches: any[] = [];
    // ...
  }
});
```

**After:**
```typescript
const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(({ onResults }, ref) => {
  async function doSearch(q: string): Promise<void> {
    const rawData = await res.json();
    const data: SearchResponse = toSearchResponse(rawData);
    let matches: SearchResult[] = [];
    // ...
  }
});
```

#### [`components/ResultPanel.tsx`](components/ResultPanel.tsx)
- ✅ Import types: `ResultPanelProps`, `SearchResult`, `formatDate`
- ✅ Remove inline `Result` type definition
- ✅ Use shared `formatDate()` utility
- ✅ Simplify `resolveTitle()` to only supported properties

**Removed Legacy Properties:**
- `_id` - use `id` only
- `path` - not in domain model
- `record` - Firestore internal
- `doc` - Firestore internal
- `data()` - Firestore method

#### [`components/MediaDetailPanel.tsx`](components/MediaDetailPanel.tsx)
- ✅ Import types: `MediaDetailPanelProps`, `Lab`, `formatDate`, `toLabInfo`
- ✅ Remove inline `LabInfo` type (use `Lab`)
- ✅ Validate API response with `toLabInfo()`
- ✅ Use shared `formatDate()` utility

### Pages

#### [`app/page.tsx`](app/page.tsx)
- ✅ Import types: `SearchResult`, `SearchBarHandle`
- ✅ Type state: `SearchResult[]` instead of `any[]`
- ✅ Type ref: `SearchBarHandle` instead of `any`
- ✅ Handle `undefined` from `.find()`: `media || null`
- ✅ Remove legacy `_id` property

#### [`app/living-lab/page.tsx`](app/living-lab/page.tsx)
- ✅ Import type: `SearchResult`
- ✅ Type callback parameters: `(matches: SearchResult[], query: string)`
- ✅ Remove legacy `_id` property

## Benefits of This Migration

### 1. **Compile-Time Error Detection**

**Before:**
```typescript
// This compiles but crashes at runtime
const title = result.titel; // ❌ Typo, but no error
const wrongProperty = result.doesNotExist; // ❌ No warning
```

**After:**
```typescript
// Compiler catches errors
const title = result.titel; // ❌ Compiler error: Property 'titel' does not exist
const wrongProperty = result.doesNotExist; // ❌ Compiler error
const correctTitle = result.title; // ✅ Works
```

### 2. **Better IDE Support**

- **Autocomplete**: IDE suggests valid properties
- **Inline Documentation**: Hover over types to see JSDoc comments
- **Refactoring**: Rename/find usages works across the codebase
- **Navigation**: Jump to type definitions

### 3. **API Contract Enforcement**

API routes now have explicit contracts that must be satisfied:

```typescript
// This won't compile if return type doesn't match
export async function POST(req: Request) {
  const response: SearchResponse = {
    results: [], // Must be SearchResult[]
    count: 0,
    // missing 'results' would be a compiler error
  };
  return NextResponse.json(response);
}
```

### 4. **Easier Onboarding**

New developers can:
- Read type definitions to understand data structures
- Get instant feedback from compiler
- See what properties are available on objects
- Understand function contracts without reading implementation

### 5. **Prevents Common Mistakes**

```typescript
// Before: Silent bugs
const id = result._id || result.id; // _id might not exist
setSelectedMedia(results.find(r => r.id === id)); // undefined becomes state

// After: Compiler prevents bugs
const id = result._id || result.id; // ❌ Compiler error: _id doesn't exist
const media = results.find(r => r.id === id);
setSelectedMedia(media || null); // ✅ Must handle undefined explicitly
```

## How to Add New Features

### Adding a New Property to Media

1. **Update the domain model:**
```typescript
// types/index.ts
export interface Media {
  id: string;
  title: string;
  // ... existing properties
  newProperty: string | null; // Add this
}
```

2. **Update API routes** to return the new property
3. **Update components** to use it
4. **Compiler will tell you** if you missed any locations!

### Adding a New API Endpoint

1. **Define request/response types:**
```typescript
// types/index.ts
export interface MyNewRequest {
  someField: string;
}

export interface MyNewResponse {
  data: SomeData[];
  success: boolean;
}
```

2. **Use types in API route:**
```typescript
// app/api/my-endpoint/route.ts
import { MyNewRequest, MyNewResponse } from '@/types';

export async function POST(req: Request) {
  const body = await req.json() as MyNewRequest;
  // ... process request
  const response: MyNewResponse = { data: [], success: true };
  return NextResponse.json(response);
}
```

3. **Use types in components:**
```typescript
const res = await fetch('/api/my-endpoint', {
  method: 'POST',
  body: JSON.stringify({ someField: 'value' } satisfies MyNewRequest)
});
const data: MyNewResponse = await res.json();
```

### Adding a New Component

```typescript
// Define props type in types/index.ts or inline
interface MyComponentProps {
  data: SearchResult;
  onAction: (id: string) => void;
}

// Use in component
export function MyComponent({ data, onAction }: MyComponentProps) {
  return (
    <div onClick={() => onAction(data.id)}>
      {data.title}
    </div>
  );
}
```

## Best Practices

### 1. ✅ Use Explicit Types for State
```typescript
// ❌ Bad
const [data, setData] = useState<any>(null);

// ✅ Good
const [data, setData] = useState<SearchResult | null>(null);
```

### 2. ✅ Type Function Parameters and Returns
```typescript
// ❌ Bad
function processResults(results) {
  return results.map(r => r.id);
}

// ✅ Good
function processResults(results: SearchResult[]): string[] {
  return results.map(r => r.id);
}
```

### 3. ✅ Use Type Guards for Runtime Validation
```typescript
// ❌ Bad - assumes data is valid
const data = await fetch('/api/data').then(r => r.json());
doSomething(data); // What if data is wrong shape?

// ✅ Good - validate at boundary
const rawData = await fetch('/api/data').then(r => r.json());
if (isSearchResult(rawData)) {
  doSomething(rawData); // Safe
} else {
  throw new Error('Invalid data');
}
```

### 4. ✅ Prefer `unknown` Over `any` for Errors
```typescript
// ❌ Bad
try {
  // ...
} catch (error: any) {
  console.log(error.message); // What if error isn't an Error?
}

// ✅ Good
try {
  // ...
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.log(message);
}
```

### 5. ✅ Use Utility Types for Partial Updates
```typescript
// ❌ Bad - duplicates properties
interface UpdateMediaRequest {
  id: string;
  title?: string;
  author?: string;
  // ... repeat all properties
}

// ✅ Good - reuse existing types
type UpdateMediaRequest = { id: string } & Partial<Media>;
```

## Common Patterns

### Optional Chaining with Type Safety
```typescript
// Before: any lets you access non-existent properties
const name = result?.metadata?.lab?.name?.value; // Compiles but might crash

// After: Compiler only allows defined properties
const name = result?.metadata?.lab_name; // ✅ Only if lab_name is in type
```

### Array Filtering with Type Guards
```typescript
const mixed: unknown[] = [validResult, null, invalidData];

// Filter and narrow types
const valid: SearchResult[] = mixed.filter(isSearchResult);
```

### Discriminated Unions for Different Response Types
```typescript
type ApiResponse = 
  | { success: true; data: SearchResult[] }
  | { success: false; error: string };

function handleResponse(response: ApiResponse) {
  if (response.success) {
    // TypeScript knows response.data exists
    console.log(response.data);
  } else {
    // TypeScript knows response.error exists
    console.log(response.error);
  }
}
```

## Troubleshooting

### "Property does not exist on type"
```
Property '_id' does not exist on type 'SearchResult'
```
**Solution:** The property was removed during migration. Use `id` instead of `_id`.

### "Type 'undefined' is not assignable"
```
Argument of type 'SearchResult | undefined' is not assignable to 'SearchResult | null'
```
**Solution:** Handle the `undefined` case explicitly:
```typescript
const result = array.find(predicate);
setState(result || null); // ✅ Convert undefined to null
```

### "Cannot find module '@/types'"
**Solution:** Ensure your `tsconfig.json` has path mapping:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Runtime Error After Compile Success
**Problem:** API returns different structure than expected type.

**Solution:** Use type guards and conversion utilities:
```typescript
const rawData = await res.json();
try {
  const data = toSearchResponse(rawData); // Validates structure
} catch (error) {
  // Handle invalid response
}
```

## Testing Strategy

### 1. **Compile-Time Testing**
The TypeScript compiler is your first test:
```bash
npm run build # Will fail if types don't match
```

### 2. **Runtime Validation**
Use type guards in critical paths:
```typescript
if (!isSearchResult(data)) {
  throw new Error('Invalid search result');
}
```

### 3. **Unit Tests**
Test type conversions:
```typescript
test('toSearchResponse validates response structure', () => {
  expect(() => toSearchResponse({})).toThrow();
  expect(() => toSearchResponse({ results: [] })).not.toThrow();
});
```

## Next Steps

1. **Review the changes**: Read through modified files to understand the new patterns
2. **Run the app**: `npm run dev` and test functionality
3. **Check for errors**: `npm run build` to see if there are any remaining type issues
4. **Update tests**: Add tests for type guards and conversion utilities
5. **Document patterns**: Add JSDoc comments to complex types
6. **Extend gradually**: Add more specific types as you discover edge cases

## Questions?

- **Q: Should I use `interface` or `type`?**
  - A: Use `interface` for object shapes that might be extended. Use `type` for unions, intersections, and complex types.

- **Q: When should I use `any`?**
  - A: Almost never! Use `unknown` for truly unknown data, then narrow with type guards.

- **Q: What if third-party libraries don't have types?**
  - A: Create `.d.ts` declaration files or use `@ts-ignore` as a last resort with a comment explaining why.

- **Q: How do I type complex nested structures?**
  - A: Break them into smaller interfaces and compose them together.

---

**Remember:** The goal is to make errors surface at compile-time rather than runtime. When the compiler complains, it's helping you find bugs before users do!
