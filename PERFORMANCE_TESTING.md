# Performance Testing Guide

## Quick Start

1. **Apply Database Indexes** (if not already done):
   ```bash
   # If using Supabase CLI locally
   supabase migration up
   
   # Or apply via Supabase Dashboard:
   # 1. Go to SQL Editor
   # 2. Run the migration file: supabase/migrations/20250102120000_add_performance_indexes.sql
   ```

2. **Verify Indexes Are Applied**:
   - Go to Supabase Dashboard → SQL Editor
   - Run: `scripts/check-indexes.sql`
   - You should see 12 indexes listed

3. **Test Performance**:
   - Navigate to `/admin/test-performance` in your app
   - Click "Run All Tests" to test all queries
   - Or test individual queries one by one

## What to Look For

### Good Performance
- **< 100ms**: Excellent! Queries are very fast
- **100-500ms**: Good performance, acceptable for most use cases
- **500-1000ms**: Acceptable but could be improved

### Needs Optimization
- **> 1000ms**: Slow query - will show warning in console
- Check if indexes are applied
- Check network latency
- Consider adding more specific indexes

## Performance Monitor

The performance monitor appears in the bottom-right corner of admin pages:
- Shows real-time query performance
- Tracks average, max, and slow query counts
- Displays last 20 queries with color coding:
  - Green: < 500ms
  - Orange: 500-1000ms
  - Red: > 1000ms

## Testing Scenarios

### 1. First Load (Cold Cache)
- Navigate to `/admin/albums`
- Check console for query time
- Should be fast if indexes are applied

### 2. React Query Caching
- Navigate to `/admin/albums`
- Navigate away to another page
- Navigate back to `/admin/albums`
- Second load should be instant (served from cache)

### 3. Multiple Queries
- Use the Performance Test page
- Run all tests multiple times
- Second run should be faster (React Query cache)

## Expected Improvements

After applying indexes, you should see:
- **60-80% faster queries** on filtered/ordered queries
- **Faster slug lookups** (using composite indexes)
- **Better performance** as data grows

## Troubleshooting

### Queries Still Slow?

1. **Check if indexes are applied**:
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND indexname LIKE 'idx_albums_%';
   ```

2. **Check query execution plan**:
   - In Supabase Dashboard → SQL Editor
   - Run: `EXPLAIN ANALYZE SELECT ...` with your query
   - Look for "Index Scan" vs "Seq Scan"

3. **Network latency**:
   - Check if you're far from Supabase region
   - Consider using connection pooling

4. **Data size**:
   - Indexes help more with larger datasets
   - With < 100 records, improvement may be minimal

## Performance Metrics

The app logs all queries with:
- `🔍 [DB]` prefix for normal queries
- `⚠️ [DB] SLOW QUERY` for queries > 1000ms

Check browser console to see all query times.

