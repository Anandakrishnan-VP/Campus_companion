

## Problem

The 3D avatar uses `@react-three/drei`'s `<Environment preset="city" />` (line 534), which loads an HDR environment map over the network. This is the primary bottleneck causing the long load time. Additionally, the `<Text>` component from drei (line 245) loads a font file. Combined with the Three.js bundle itself, initial load is heavy.

## Plan

### 1. Remove the Environment preset
Replace `<Environment preset="city" />` with simple additional lights. The environment map is fetched remotely and is unnecessary for this procedural avatar -- the existing lights already provide adequate illumination.

### 2. Remove the `<Text>` import and YUKTI nameplate text
The `Text` component from drei loads a font file over the network. Replace the 3D text with a simple mesh or remove it (the nameplate is barely visible at this scale). Keep the gold plate meshes.

### 3. Add `frameloop="demand"` or keep default but simplify
Keep `frameloop="always"` since we have animations, but add `dpr={[1, 1.5]}` to cap pixel ratio on high-DPI screens for better performance.

### 4. Lazy-load the Canvas
The `<Suspense>` wrapper already exists in `Index.tsx`, but the Avatar3D module eagerly imports Three.js. Use `React.lazy()` for the Avatar3D import in `Index.tsx` so Three.js is code-split and doesn't block initial render.

### Changes

**`src/components/kiosk/Avatar3D.tsx`**:
- Remove `Environment` and `Text` from drei imports
- Remove `<Environment preset="city" />` (line 534)
- Remove `<Text>` element (lines 245-254), keep the gold plate meshes
- Add `dpr={[1, 1.5]}` to the Canvas

**`src/pages/Index.tsx`**:
- Change `import Avatar3D` to `const Avatar3D = lazy(() => import("@/components/kiosk/Avatar3D"))` using React.lazy (it's already wrapped in Suspense)

This eliminates the two network-fetched assets (HDR map + font) that cause the loading delay, and code-splits the heavy Three.js bundle.

