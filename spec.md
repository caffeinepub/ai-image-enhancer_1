# Specification

## Summary
**Goal:** Enhance the PixelBoost image editing experience by removing blur from the enhanced image display, adding canvas-based upscaling, and introducing a comprehensive set of editing tools in a unified panel.

**Planned changes:**
- Remove any CSS/canvas blur filters currently applied to the enhanced image in the ImageComparison component
- Implement multi-step canvas upscaling (at least 2x) with a sharpening convolution kernel applied post-upscale
- Add brightness slider (−100 to +100, default 0) to the editing panel
- Add contrast slider (−100 to +100, default 0) to the editing panel
- Add saturation/color boost slider (0 to 200, default 100) to the editing panel
- Add sharpening filter toggle or intensity slider using a convolution kernel on canvas ImageData
- Add noise reduction toggle or slider using box blur/median smoothing on canvas pixel data
- Add crop tool allowing the user to drag a selection rectangle and confirm to crop on canvas
- Add rotate tool with 90° clockwise/counter-clockwise buttons and a free-rotation slider (−45 to +45°)
- Consolidate all controls into a single cohesive editing panel below/alongside the enhanced image, styled with the existing amber/charcoal theme
- Add a Reset button to restore all controls to their default values
- Ensure the Download button exports the final adjusted/cropped/rotated image

**User-visible outcome:** Users can view their enhanced image sharp and upscaled, then fine-tune it using brightness, contrast, saturation, sharpening, and noise reduction sliders, crop and rotate the image, and download the final result — all from a single unified editing panel.
