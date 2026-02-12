# TableOfContents Implementation Comparison

## Current Implementation Issues (Fixed)

The previous IntersectionObserver approach had several limitations during rapid scrolling:

1. **Narrow Detection Zone**: Root margin `-15% 0px -75% 0px` created a small trigger area
2. **Limited Thresholds**: Single `threshold: 0.5` missed partial visibility states
3. **Fast Scroll Blindness**: Rapid scrolling could bypass intersection detection entirely
4. **Timing Gaps**: Observer callbacks may not fire frequently enough during fast scrolls
5. **Gap Handling**: Headings positioned very close together caused active state tracking to fail

## Enhanced Hybrid Approach (Current Implementation)

The latest implementation uses a sophisticated hybrid approach that addresses all identified issues:

### Key Improvements:

1. **Enhanced Detection Logic**:
   - Three-tiered strategy: primary detection → intersection validation → gap handling
   - Direction-aware scrolling detection
   - Extended viewport detection zones (-5% to -40% root margin)

2. **Improved Gap Handling**:
   - Extended detection area up to 70% of viewport height
   - Timestamp-based prioritization for recently visible headings
   - Smart fallback mechanisms for content gaps

3. **Robust State Management**:
   - Scroll direction tracking to predict active headings
   - Manual recheck mechanism after scroll animations complete
   - Extended timeout handling (1200ms) for smooth scrolling completion

4. **Performance Optimizations**:
   - Throttled updates (~60fps) to prevent excessive re-renders
   - Efficient data structures for tracking visible headings
   - Cleanup of obsolete intersection data

## Alternative Approaches (Historical)

### 1. Scroll Event Listener Approach (`TableOfContents.alternative.tsx`)

**Pros:**

- ✅ Reliable during rapid scrolling
- ✅ Direct position calculation
- ✅ Consistent performance regardless of scroll speed

**Cons:**

- ⚠️ Requires manual optimization
- ⚠️ Slightly more complex implementation

### 2. Improved IntersectionObserver (`TableOfContents.improved-io.tsx`)

**Pros:**

- ✅ Leverages browser-native optimization
- ✅ More accurate visibility detection
- ✅ Better battery efficiency on mobile

**Cons:**

- ⚠️ Still susceptible to very fast scrolling
- ⚠️ May miss headings during rapid viewport transitions

## Performance Comparison (Updated)

| Aspect                   | Previous IO | Scroll Events | Improved IO | Current Hybrid |
| ------------------------ | ----------- | ------------- | ----------- | -------------- |
| Rapid Scroll Reliability | ❌ Poor     | ✅ Excellent  | ⚠️ Good     | ✅ Excellent   |
| Gap Handling             | ❌ Poor     | ⚠️ Fair       | ⚠️ Good     | ✅ Excellent   |
| Precision                | ✅ High     | ⚠️ Medium     | ✅ High     | ✅ High        |
| Performance              | ✅ Good     | ⚠️ Optimized  | ✅ Good     | ✅ Optimized   |
| Mobile Battery           | ✅ Best     | ⚠️ Moderate   | ✅ Good     | ✅ Good        |

## Current Implementation Details

The enhanced hybrid approach includes:

1. **Multi-strategy Detection**:
   - Primary: Scroll position relative to heading offsets
   - Secondary: IntersectionObserver validation with timestamps
   - Tertiary: Gap handling with extended viewport detection

2. **Smart Timing**:
   - 16ms throttling for scroll events (~60fps)
   - 1200ms timeout for scroll completion detection
   - Manual recheck mechanism after animations

3. **Enhanced Configuration**:
   - Root margin: `-5% 0px -40% 0px` (wider detection zone)
   - Thresholds: `[0, 0.1, 0.25, 0.5, 0.7, 0.8, 0.9, 1.0]` (granular detection)
   - Direction-aware logic for predictive heading selection

This implementation successfully resolves the issue where the current element doesn't display as selected during rapid scrolling or when headings are positioned closely together.
