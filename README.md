# Map Shine Toolkit

## Watch the Youtube Videos
[![Watch the video](https://img.youtube.com/vi/QvMMHMe4T0/0.jpg)](https://www.youtube.com/watch?v=QvMMHMe4T0)

[![Watch the video](https://img.youtube.com/vi/ddRhagP3Hlg/0.jpg)](https://www.youtube.com/watch?v=ddRhagP3Hlg)


![Version](https://img.shields.io/badge/Version-1.0.15-blue)![Foundry VTT Compatibility](https://img.shields.io/badge/Foundry%20VTT-v13+-green)

<p align="center">
  <img src="https://i.imgur.com/RZQS4qV.jpeg" alt="Map Shine UI">
</p>

Welcome to the Map Shine Toolkit, a module for Foundry Virtual Tabletop designed to provide map makers with a powerful toolkit for adding animations and special effects in the quickest and least technically complex way possible.

The workflow is simple: create your map as you normally would, then produce additional texture maps with special filename suffixes that correspond to the effects you want to enable. From there, you can activate and tweak each effect in the module's UI to get the exact look you want.

## New in Version 1.0: The Map Point Editor

Beyond texture maps, you can now draw effect sources directly onto your scene! The **Map Point Editor** allows you to create groups of points, lines, and polygons that can act as emitters for particle effects like sparks, fire, and dust motes. This gives you precise, texture-independent control over where your effects appear.

<p align="center">
  [Image/GIF of the Map Point Editor in action]
  <br>
  <em>The Map Point Editor allows for precise placement of effect sources.</em>
</p>

---

## Features

This toolkit includes a wide range of configurable effects that can be layered and combined.

### **Surface Effects**

- **Metallic Shine**: Adds dynamic, reflective shine to surfaces using a `_Specular` map. Fully procedural and animated with configurable bloom, starbursts, and chromatic aberration tied directly to the shine.

- **Iridescence**: Creates a shimmering, rainbow-like effect across a masked surface using an `_Iridescence` map. Features customizable color gradients and animated distortion for a liquid-like churn.

- **Water Effects**: A comprehensive suite for bringing water to life using a `_Water` mask.
  - **Animated Waves**: Procedural surface distortion to simulate ripples and waves.
  - **Caustics**: Projects shimmering, animated light patterns onto the water surface.
  - **Surface Foam & Sheen**: Generates procedural open-water foam and a reflective sheen.
  - **Shoreline Effects**: Automatically detects shorelines or uses a `_Shoreline` map to generate foam, shoreline distortion, and particle effects.

<table border="0" cellspacing="15" cellpadding="15" width="100%">
  <tr>
    <td align="center" width="50%">
      [Image/GIF of Water Effects]
      <br>
      <em>Procedural Water Effects</em>
    </td>
    <td align="center" width="50%">
      [Image/GIF of Caustics]
      <br>
      <em>Animated Underwater Caustics</em>
    </td>
  </tr>
</table>

---

### **Shadow & Atmospheric Effects**

- **Cloud Shadows**: Projects procedurally generated, moving cloud shadows onto the map. Requires an `_Outdoors` mask.
- **Canopy Shadows**: Simulates light filtering through a leafy canopy. Uses an `_Canopy` mask with animated distortion to mimic leaves swaying in the wind.
- **Structural Shadows**: Renders hard-edged indoor shadows for things like rafters or beams. Supports parallax shifting and animated light flicker. Requires a `_Structural` mask.
- **Dust Motes**: Renders multi-layered, animated dust particles with configurable density, size, speed, and turbulence. Can be masked with a `_Dust` texture or sourced from the Map Point Editor.

<table border="0" cellspacing="15" cellpadding="15" width="100%">
  <tr>
    <td align="center" width="50%">
      [Image/GIF of Canopy Shadows]
      <br>
      <em>Canopy Shadows</em>
    </td>
    <td align="center" width="50%">
      [Image/GIF of Structural Shadows]
      <br>
      <em>Structural Shadows with Parallax</em>
    </td>
  </tr>
</table>

---

### **Particle Systems**

Create dynamic particle effects using either texture maps or the Map Point Editor.

- **Fire**: A multi-stage effect for realistic flames using a `_Fire` mask, combining animated particles with a powerful bloom glow.
- **Sparks**: Generates sparks that fly off in turbulent, configurable paths from a `_Sparks` mask.
- **Glints**: Creates sparkling glints that appear in areas defined by a `_Prism` map.

<table border="0" cellspacing="15" cellpadding="15" width="100%">
  <tr>
    <td align="center" width="50%">
      [Image/GIF of Fire Particles]
      <br>
      <em>Fire Particle System</em>
    </td>
    <td align="center" width="50%">
      [Image/GIF of Sparks]
      <br>
      <em>Sparks Effect</em>
    </td>
  </tr>
</table>

---

### **Light & Emissive Effects**

- **Ambient / Emissive Glow**: Uses an `_Ambient` map to add persistent light to parts of a scene without adding a Foundry VTT light source.
- **Light-Reactive Textures**: Uses a `_GroundGlow` map to create textures that appear or disappear based on the presence of scene lighting.
  - **Glow in the Dark**: The texture is only visible in darkness.
  - **Glow in the Light**: The texture only appears when illuminated.

---

### **Special & Distortion Effects**

- **Heat Distortion**: Applies an animated heat-haze effect to masked areas using a `_Heat` map.
- **Prism Effect**: Splits the light from the brightest parts of the scene into a prismatic, chromatic aberration effect, controlled by a `_Prism` mask.
- **Lens Distortion**: Simulates the barrel or pincushion distortion of a camera lens.

<p align="center">
  [Image/GIF of Prism Effect]
  <br>
  <em>Prism Effect</em>
</p>

---

### **Post-Processing Suite**

A complete collection of screen-space effects to finalize the look of your scene.

-   **Advanced Color Correction**: A powerful grading tool with stackable adjustments.
    -   **Presets**: Includes a wide range of built-in looks like "Cinematic," "Vintage," and "Cyberpunk," with the ability to save your own favorites.
    -   **Core Adjustments**: Saturation, brightness, contrast, exposure, and gamma.
    -   **Advanced Tools**: Fine-tune with Levels, White Balance, and Global Tinting.
    -   **Curves Editor**: Professional-grade, non-linear control over the tonal range for RGB and individual color channels.
    -   **Selective Color**: Isolate a specific color range and apply adjustments only to that selection (e.g., make all reds more vibrant while desaturating everything else).
    -   **Dynamic Exposure**: Creates a "dazzle" effect when a token moves from an indoor to an outdoor area.
    -   **Scene Illumination Mix-in**: Blends scene lighting back into the final image to create volumetric light effects or recolor light sources.

-   **LUT Color Grading**: Apply professional `.cube` Look-Up Tables for cinematic color grading.

-   **Camera Effects**: Configurable Vignette, Tilt-Shift blur, and Chromatic Aberration.

-   **Global Screen Bloom (Experimental)**: A powerful, screen-wide bloom effect that can create a soft, glowing atmosphere.

<p align="center">
  [Image/GIF of Advanced Color Correction UI/Effect]
  <br>
  <em>The advanced color correction suite offers professional-grade control.</em>
</p>

---

### **Gameplay Integration**

- **Scene Transition**: Overrides the default scene change with an elegant, configurable fade-through-black effect, complete with a logo, custom text, and randomized hints.
- **Pause Effect**: Applies a configurable color grading and animation slowdown effect when the game is paused.
- **Combat Effect**: Smoothly transitions to a different color grade and animation speed when combat begins and ends.

<p align="center">
  [Image/GIF of Scene Transition]
  <br>
  <em>Customizable Scene Transitions</em>
</p>

---

## How It Works

The toolkit primarily uses a texture-auto-discovery system. For any given background image or tile (e.g., `MyMap.webp`), you create corresponding effect maps with specific suffixes. The module automatically finds these maps and applies the associated effect. For best results, ensure all texture maps have the same dimensions as the base image.

Alternatively, many particle effects can now be sourced from the **Map Point Editor**, allowing you to place them without creating new textures.

### Texture Suffixes

-   `_Specular`: **Metallic Shine**. Defines reflective surfaces.
-   `_Iridescence`: **Iridescence**. Defines shimmering surfaces.
-   `_Water`: **Water Effects**. Defines the main water area.
-   `_Shoreline`: **Shoreline Foam**. Overrides automatic shoreline detection for the Water effect.
-   `_GroundGlow`: **Light-Reactive Textures**. Defines areas that glow in light or dark.
-   `_Ambient`: **Ambient / Emissive Glow**. Defines self-illuminated surfaces.
-   `_Heat`: **Heat Distortion**. Defines areas that produce a heat haze.
-   `_Prism`: **Prism Effect & Glint Particles**. Defines areas that split light and spawn glints.
-   `_Fire`: **Fire Particles**. Defines the source area for fire.
-   `_Sparks`: **Sparks Particles**. Defines the source area for sparks.
-   `_Dust`: **Dust Motes**. Defines where dust particles are visible.
-   `_Outdoors`: **Cloud Shadows** & other effects. Defines exterior areas.
-   `_Canopy`: **Canopy Shadows**. Defines areas with leafy tree cover.
-   `_Structural`: **Structural Shadows**. Defines areas with indoor structural shadows.

## Configuration & Profiles

This module includes a powerful real-time debugging UI that allows you to tweak every parameter of every effect. To manage your settings, the module also features a robust **Profile Manager**. You can save complex effect configurations as profiles, load them on demand, and even set a default profile to be loaded automatically for a given scene.

## For Map Makers

You are encouraged to use this system for your maps! It will always be free to use for personal and commercial use. If you use this module in maps that you sell or distribute, please include a shout-out to this module and a link to my Patreon and/or the places I sell my maps. Making maps and modules is a full-time job for me, and your support is not just appreciated it's helping me rebuild my life.

**Patreon:** [Mythica Machina](https://www.patreon.com/c/MythicaMachina)

**Foundry VTT Store:** [My Maps on Foundry VTT Store](https://www.foundryvtt.store/creators/mythica-machina)

**DriveThruRPG.com:** [My Maps on DriveThruRPG.com](https://www.drivethrurpg.com/en/publisher/29377/mythicamachina)

## Installation

1.  Inside Foundry VTT, navigate to the **Add-on Modules** tab in the main configuration screen.
2.  Search for "Map Shine" and click the **Install** button.
3.  Activate the module in your game world's module settings.

## Dependencies

-   **Illumination Buffer (`illuminationbuffer`)**: This library is required for the light-reactive features (**Glow in the Dark / Light**) and advanced post-processing effects to correctly interact with scene lighting.
-   **libWrapper**: Required for the Scene Transition effect to function correctly.

## Compatibility

This module is compatible with **Foundry VTT Version 13 and newer**.

## Contact & Support

For questions, advice, or to report an issue, you can reach me here:
*   **Discord**: `garsondee`
*   **Patreon**: Message me through my [Patreon page](https://www.patreon.com/c/MythicaMachina).

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
