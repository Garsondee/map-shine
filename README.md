# Map Shine Toolkit

![Version](https://img.shields.io/badge/Version-0.9%20(Beta)-orange)
![Foundry VTT Compatibility](https://img.shields.io/badge/Foundry%20VTT-v13+-green)

<p align="center">
  <img src="https://github.com/Garsondee/map-shine/raw/main/UI.jpg" alt="Map Shine UI">
</p>

Welcome to the Map Shine Toolkit, a module for Foundry Virtual Tabletop designed to provide map makers with a powerful toolkit for adding animations and special effects in the quickest and least technically complex way possible.

> **Note:** This module is currently in **Beta (v0.9)**. It is nearly ready for a full release but is not yet considered stable for wide adoption.

The workflow is simple: create your map as you normally would, then produce additional texture maps with special filename suffixes that correspond to the effects you want to enable. From there, you can activate and tweak each effect in the module's UI to get the exact look you want.

## Features

This toolkit includes a wide range of configurable effects that can be layered and combined.

---

### **Metallic Shine**
Adds dynamic, reflective shine to surfaces using a specular map.
- Fully procedural and animated shine patterns.
- Configurable bloom, starburst, and RGB-split effects tied directly to the shine.
- Procedural noise to break up the pattern for a more organic feel.

<table border="0" cellspacing="15" cellpadding="15" width="100%">
  <tr>
    <td align="center" width="50%">
      <img src="https://github.com/Garsondee/map-shine/raw/main/Metallic%20Shine.gif" alt="Metallic Shine" height="380">
      <br>
      <em>Metallic Shine</em>
    </td>
    <td align="center" width="50%">
      <img src="https://github.com/Garsondee/map-shine/raw/main/Metallic%20Shine%202.gif" alt="Metallic Shine" height="380">
      <br>
      <em>Metallic Shine</em>
    </td>
  </tr>
</table>

---

### **Iridescence**
Creates a shimmering, rainbow-like effect across a masked surface.
- Uses customizable color gradients (includes presets like rainbow, magma, ice, etc.).
- Features animated distortion and noise to create a liquid-like churn.

<p align="center">
  <img src="https://github.com/Garsondee/map-shine/raw/main/Iridescence.gif" alt="Iridescence" height="450">
  <br>
  <em>Iridescence / Pearlescence</em>
</p>

---

### **Light-Reactive Textures**
These effects allow textures to appear or disappear based on the presence of scene lighting, perfect for creating puzzles and hidden secrets.
- **Glow in the Dark**: The texture is only visible in darkness and disappears when light is present.
- **Glow in the Light**: The inverse effect, where the texture only appears when illuminated.

<table border="0" cellspacing="15" cellpadding="15" width="100%">
  <tr>
    <td align="center" width="50%">
      <img src="https://github.com/Garsondee/map-shine/raw/main/Glow%20in%20the%20Dark.gif" alt="Glow in the Dark" height="380">
      <br>
      <em>Glow in the Dark</em>
    </td>
    <td align="center" width="50%">
      <img src="https://github.com/Garsondee/map-shine/raw/main/Glow%20in%20the%20Light.gif" alt="Glow in the Light" height="380">
      <br>
      <em>Glow in the Light</em>
    </td>
  </tr>
</table>

---

### **Ambient / Emissive Glow**
Uses a texture map to add persistent light to parts of a scene without adding a Foundry VTT light source. This is ideal for objects that should glow on their own, like magical runes or bioluminescent fungi.

> **Limitation:** This brightness will currently persist in previously explored areas of the map (areas covered by fog of war). Be careful not to make the effect too bright, as it might look strange.

<p align="center">
  <img src="https://github.com/Garsondee/map-shine/raw/main/Ambient.gif" alt="Ambient / Emissive" height="450">
  <br>
  <em>Ambient / Emissive Glow</em>
</p>

---

### **Atmospheric Effects**
- **Cloud Shadows**: Projects procedurally generated, moving cloud shadows onto the map. Requires an `_Outdoors` mask to define where shadows should appear.
- **Dust Motes**: Renders multi-layered, animated dust particles with configurable density, size, speed, and turbulence.

<table border="0" cellspacing="15" cellpadding="15" width="100%">
  <tr>
    <td align="center" width="50%">
      <img src="https://github.com/Garsondee/map-shine/blob/main/Cloud%20Shadows.gif" alt="Cloud Shadows" height="350">
      <br>
      <em>Cloud Shadows</em>
    </td>
    <td align="center" width="50%">
      <img src="https://github.com/Garsondee/map-shine/blob/main/Dust%20Motes.gif" alt="Dust Motes" height="350">
      <br>
      <em>Dust Motes</em>
    </td>
  </tr>
</table>

---

### **Distortion Effects**
- **Heat Distortion / Haze**: Applies an animated heat-haze effect to masked areas.
- **Lens Distortion**: Simulates the barrel or pincushion distortion of a camera lens.

<table border="0" cellspacing="15" cellpadding="15" width="100%">
  <tr>
    <td align="center" width="50%">
      <img src="https://github.com/Garsondee/map-shine/raw/main/Heat%20Haze.gif" alt="Heat Haze" height="380">
      <br>
      <em>Heat Haze / Turbulent Distortion</em>
    </td>
    <td align="center" width="50%">
      <img src="https://github.com/Garsondee/map-shine/raw/main/Distortion.gif" alt="Lens Distortion" height="380">
      <br>
      <em>Lens Distortion</em>
    </td>
  </tr>
</table>

---

### **Post-Processing Suite**
A collection of screen-space effects to enhance the final look of the scene.

- **Color Correction**: Adjust saturation, brightness, contrast, exposure, gamma, and white balance.
- **Vignette**: A configurable vignette to darken the edges of the screen.
- **Tilt-Shift**: A blur effect that simulates a shallow depth of field.
- **Chromatic Aberration**: Simulates lens fringing by splitting color channels.
- **Global Screen Bloom (Experimental)**: A powerful, screen-wide bloom effect that can create a soft, glowing atmosphere. This feature is experimental due to performance considerations at high resolutions.

<table border="0" cellspacing="15" cellpadding="15" width="100%">
  <tr>
    <td align="center" width="33%">
      <img src="https://github.com/Garsondee/map-shine/raw/main/Vignette.gif" alt="Vignette" height="250">
      <br>
      <em>Vignette</em>
    </td>
    <td align="center" width="33%">
      <img src="https://github.com/Garsondee/map-shine/raw/main/Tilt%20Shift.gif" alt="Tilt Shift" height="250">
      <br>
      <em>Tilt-Shift</em>
    </td>
    <td align="center" width="33%">
      <img src="https://github.com/Garsondee/map-shine/raw/main/RGB%20Split.gif" alt="Chromatic Aberration" height="250">
      <br>
      <em>Chromatic Aberration</em>
    </td>
  </tr>
</table>

---

## How It Works

The toolkit uses a texture-auto-discovery system. [1] For any given background image or tile (e.g., `MyMap.webp`), you create corresponding effect maps with specific suffixes. [1] The module automatically finds these maps and applies the associated effect. [1] For best results, ensure all texture maps have the same dimensions as the base image. [1]

### Texture Suffixes

- `_Specular`
  - **Effect**: Metallic Shine
  - **Description**: Defines reflective surfaces. Black areas are non-reflective. Brightness and color control the shine's appearance (e.g., white looks like glass, colors create a metallic tint).

- `_Iridescence`
  - **Effect**: Iridescence
  - **Description**: Defines areas that receive the shimmering effect. Black areas are ignored, while brighter areas will shimmer.

- `_GroundGlow`
  - **Effect**: Light-Reactive Texture (Glow in the Dark / Light)
  - **Description**: Defines areas that react to light. This map is used for both the "Glow in the Dark" and "Glow in the Light" effects.

- `_Ambient`
  - **Effect**: Ambient / Emissive Glow
  - **Description**: Defines emissive surfaces. This map should be mostly transparent; opaque areas will glow.

- `_Heat`
  - **Effect**: Heat Distortion
  - **Description**: Defines areas that produce a heat haze. Use white for the effect area and black for no effect. Soft-edged brushes work best.

- `_Dust`
  - **Effect**: Dust Motes
  - **Description**: A mask that defines where dust motes are visible. Use white for where you want dust to appear.

- `_Outdoors`
  - **Effect**: Cloud Shadows
  - **Description**: A mask defining exterior areas. Outdoor areas should be solid white and indoor areas solid black. This will eventually be used for other weather effects.

---

### Example Tutorial Layers

Here is an example of a base map and the corresponding effect layers used by Map Shine. The file names show which suffix corresponds to which effect.

**Base Map (`mythica-machina-big-bank-ground.webp`)**
<br><em>This is the main, full-color map image that players will see.</em>
<p align="center">
  <img src="https://github.com/Garsondee/map-shine/raw/main/tutorial-assets/mythica-machina-big-bank-ground.webp" alt="Base Map">
</p>

**Ambient Map (`mythica-machina-big-bank-ground_Ambient.webp`)**
<br><em>Defines emissive surfaces. This map should be mostly transparent; opaque areas will glow.</em>
<p align="center">
  <img src="https://github.com/Garsondee/map-shine/raw/main/tutorial-assets/mythica-machina-big-bank-ground_Ambient.webp" alt="Ambient Map">
</p>

**Dust Map (`mythica-machina-big-bank-ground_Dust.webp`)**
<br><em>A mask that defines where dust motes are visible. Use white for where you want dust to appear.</em>
<p align="center">
  <img src="https://github.com/Garsondee/map-shine/raw/main/tutorial-assets/mythica-machina-big-bank-ground_Dust.webp" alt="Dust Map">
</p>

**GroundGlow Map (`mythica-machina-big-bank-ground_GroundGlow.webp`)**
<br><em>Defines areas that react to light. This map is used for both the "Glow in the Dark" and "Glow in the Light" effects.</em>
<p align="center">
  <img src="https://github.com/Garsondee/map-shine/raw/main/tutorial-assets/mythica-machina-big-bank-ground_GroundGlow.webp" alt="GroundGlow Map">
</p>

**Heat Map (`mythica-machina-big-bank-ground_Heat.webp`)**
<br><em>Defines areas that produce a heat haze. Use white for the effect area and black for no effect.</em>
<p align="center">
  <img src="https://github.com/Garsondee/map-shine/raw/main/tutorial-assets/mythica-machina-big-bank-ground_Heat.webp" alt="Heat Map">
</p>

**Outdoors Map (`mythica-machina-big-bank-ground_Outdoors.webp`)**
<br><em>A mask defining exterior areas. Outdoor areas should be solid white and indoor areas solid black. At the moment this is primarily used by the cloud rendering system, but I plan to add other effects which will differ depending on whether they are outdoors or not.</em>
<p align="center">
  <img src="https://github.com/Garsondee/map-shine/raw/main/tutorial-assets/mythica-machina-big-bank-ground_Outdoors.webp" alt="Outdoors Map">
</p>

**Specular Map (`mythica-machina-big-bank-ground_Specular.webp`)**
<br><em>Defines reflective surfaces. Black areas are non-reflective. Brightness and color control the shine's appearance.</em>
<p align="center">
  <img src="https://github.com/Garsondee/map-shine/raw/main/tutorial-assets/mythica-machina-big-bank-ground_Specular.webp" alt="Specular Map">
</p>

## Configuration & Profiles

This module includes a powerful real-time debugging UI that allows you to tweak every parameter of every effect. To manage your settings, the module also features a robust **Profile Manager**. You can save complex effect configurations as profiles, load them on demand, and even set a default profile to be loaded automatically for a given scene.

## For Map Makers

You are encouraged to use this system for your maps! It will always be free to use for personal and commercial use. If you use this module in maps that you sell or distribute, please include a shout-out to this module and a link to my Patreon and/or the places I sell my maps. Making maps and modules is a full-time job for me, and your support is not just appreciated it's helping me rebuild my life.

**Patreon:** [Mythica Machina](https://www.patreon.com/c/MythicaMachina)

**Foundry VTT Store:** [My Maps on Foundry VTT Store](https://www.foundryvtt.store/creators/mythica-machina)

**DriveThruRPG.com:** [My Maps on DriveThruRPG.com](https://www.drivethrurpg.com/en/publisher/29377/mythicamachina)

## Installation

1.  Inside Foundry VTT, navigate to the **Add-on Modules** tab in the main configuration screen. [1]
2.  Search for "Map Shine" and click the **Install** button. [1]
3.  Activate the module in your game world's module settings. [1]

## Dependencies

- **Illumination Buffer (`illuminationbuffer`)**: This library is required for the light-reactive features (**Glow in the Dark / Light**) to correctly interact with scene lighting.

## Compatibility

This module is compatible with **Foundry VTT Version 13 and newer**.

## Contact & Support

For questions, advice, or to report an issue, you can reach me here:
*   **Discord**: `garsondee`
*   **Patreon**: Message me through my [Patreon page](https://www.patreon.com/c/MythicaMachina).

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
