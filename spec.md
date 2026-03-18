# AI Image Enhancer

## Current State
The app has a Motoko backend with chunked image upload, assembly, and enhancement pipeline (standard + anime modes). The frontend has a hero banner, image uploader, enhancement mode toggle, image comparison view, and download functionality.

## Requested Changes (Diff)

### Add
- Backend: A persistent visit counter (`var visitCount : Nat`) with a `recordVisit()` update function and `getVisitCount()` query function.
- Frontend: An animated visit counter displayed prominently above the main content (below the sticky header). The counter should animate (count up) on every page load. Style it to be visually striking and cool.

### Modify
- App.tsx: On mount, call `recordVisit()` and `getVisitCount()` to get the current count, then animate the counter from 0 to the fetched value.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `visitCount` stable var and `recordVisit`/`getVisitCount` functions to `main.mo`.
2. Create a `VisitCounter` React component with a counting-up animation using `useEffect` and `requestAnimationFrame`, styled with a glowing badge effect.
3. Wire the component in `App.tsx` — call `recordVisit` on mount, fetch the count, pass to the counter component.
