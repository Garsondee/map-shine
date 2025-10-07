# Loading Screen & Transitions - Control Panel Documentation

## Overview
The "Loading Screen & Transitions" accordion in the MapShine debugger provides comprehensive controls for customizing the visual appearance of both the initial world loading screen and scene-to-scene transition overlays.

## Accordion Structure

### 1. **Initial Loading Screen**
Controls specific to the world loading screen that appears when Foundry first loads.

#### Settings:
- **Subheading Text** (`loading-screen-subheading`)
  - Text displayed above the world title
  - Default: "Loading the world..."
  - Scope: World
  - Live Preview: ✅ Updates immediately when preview is active

### 2. **Backgrounds & Overlays**
Background images and overlay settings shared by both loading screen and transitions.

#### Settings:
- **Static Background** (`loading-screen-static-background`)
  - Single image path for background
  - File picker available
  - Scope: World
  - Live Preview: ✅ Updates immediately

- **Use Random Background** (`loading-screen-use-random-background`)
  - Toggle between static and random backgrounds
  - Scope: World
  - Live Preview: ✅ Switches background immediately

- **Background Image List** (`loading-screen-random-backgrounds`)
  - List manager for multiple background images
  - One path per line
  - Randomly selected when "Use Random Background" is enabled
  - Scope: World

- **Enable Background Overlay** (`loading-screen-background-overlay-enabled`)
  - Toggles semi-transparent black overlay for text readability
  - Scope: World
  - Live Preview: ✅ Shows/hides overlay immediately

- **Overlay Opacity** (`loading-screen-background-overlay-opacity`)
  - Controls opacity of the background overlay
  - Range: 0.0 (transparent) to 1.0 (fully black)
  - Step: 0.05
  - Default: 0.75
  - Scope: World
  - Live Preview: ✅ Updates opacity in real-time

### 3. **Scene Transition Content**
Settings specific to the animated overlay shown during scene changes.

#### Settings:
- **Enable Scene Transitions** (`universal.sceneTransition.enabled`)
  - Master toggle for scene transition system
  - Scope: World

- **Fade Out Duration** (`universal.sceneTransition.fadeOutDuration`)
  - Time in milliseconds for fade-out animation
  - Range: 0 to 10000ms
  - Step: 100ms
  - Default: 5000ms
  - Scope: World

- **Fade In Duration** (`universal.sceneTransition.fadeInDuration`)
  - Time in milliseconds for fade-in animation
  - Range: 0 to 10000ms
  - Step: 100ms
  - Default: 5000ms
  - Scope: World

- **Logo Path** (`universal.sceneTransition.logoPath`)
  - Image path for logo displayed during transitions
  - File picker available
  - Default: "modules/map-shine/assets/mm-logo.png"
  - Scope: World
  - Live Preview: ✅ Updates logo immediately

- **Heading** (`universal.sceneTransition.heading`)
  - Main heading text
  - Default: "New Chapter"
  - Scope: World
  - Live Preview: ✅ Updates text immediately

- **Subheading** (`universal.sceneTransition.subheading`)
  - Secondary heading text
  - Default: "The story continues..."
  - Scope: World
  - Live Preview: ✅ Updates text immediately

- **Description** (`universal.sceneTransition.staticDescription`)
  - Additional description text
  - Default: "This is the default description text..."
  - Scope: World

- **Show Scene Name** (`universal.sceneTransition.showSceneName`)
  - Displays the destination scene's navigation name
  - Prevents spoilers by using navigation-friendly names
  - Scope: World

- **Use Random Hint** (`universal.sceneTransition.useRandomHint`)
  - Enables cycling random hints at bottom of screen
  - Scope: World
  - Live Preview: ✅ Starts/stops hint cycling

- **Hint List** (`universal.sceneTransition.randomHints`)
  - List manager for hint text
  - Fisher-Yates shuffle algorithm for randomization
  - Hints cycle every 5 seconds with 1-second fade animations
  - Scope: World
  - Live Preview: ✅ Refreshes hint cycle immediately

### 4. **Typography**
Font assignments for loading screen text elements. These settings are shared with the Pause Screen.

#### Settings:
- **Title Font** (`universal.fontManager.styles.heading1.fontFamily`)
  - Font for main title (world name or scene name)
  - Default: "Lexend"
  - Scope: World
  - Live Preview: ✅ Updates font-family immediately
  - Auto-loads from Google Fonts when changed

- **Subheading Font** (`universal.fontManager.styles.heading2.fontFamily`)
  - Font for subheadings and secondary text
  - Default: "Lexend"
  - Scope: World
  - Live Preview: ✅ Updates font-family immediately
  - Auto-loads from Google Fonts when changed

- **Hint Font** (`universal.fontManager.styles.hint.fontFamily`)
  - Font for hint text at bottom of screen
  - Default: "Special Elite"
  - Scope: World
  - Live Preview: ✅ Updates font-family immediately
  - Auto-loads from Google Fonts when changed

## Preview System

### Preview Button
- **Location**: Top-right of accordion
- **Icon**: 🎬 Film icon
- **Function**: Shows/hides a non-destructive preview of the transition overlay

### Preview Behavior
1. **Activation**: Click "Preview Transition" button
2. **Overlay Display**: Full-screen transition overlay appears with current settings
3. **Live Updates**: All supported settings update the preview in real-time
4. **Deactivation**: Click "End Transition Preview" to hide overlay

### Live Preview Support
The following settings update the preview overlay in real-time:
- ✅ Background images (static/random)
- ✅ Background overlay (enabled/opacity)
- ✅ Logo path
- ✅ Heading text
- ✅ Subheading text
- ✅ Initial loading screen subheading
- ✅ Hint cycling (toggle/content)
- ✅ Font selections (all three)

## Technical Architecture

### Settings Registration
All settings are registered in the `init` Hook with appropriate scopes:
- **World Settings**: Shared across all users in the world
- **Client Settings**: Per-user preferences (loading screen disable toggle)

### Font Loading System
1. **FontLoader Class**: Manages Google Fonts API integration
2. **Dynamic Loading**: Fonts loaded on-demand when selected
3. **Idempotent**: Multiple calls with same fonts don't create duplicates
4. **Additive**: New fonts added to existing stylesheet

### LoadingUI Component
Unified component used by both:
- **LoadingScreen**: Initial world loading
- **SceneChangeManager**: Scene transitions

**Key Features**:
- Reads all settings from game.settings
- Generates inline CSS with font variables
- Handles hint cycling with Fisher-Yates shuffle
- Manages fade animations and progress bar

### Live Preview Wiring
The `_wireLoadingPreviewLiveUpdates()` method:
1. Checks if preview is active
2. Binds event listeners to relevant controls
3. Updates overlay DOM directly for instant feedback
4. Prevents duplicate bindings with dataset flags

## User Workflow

### Basic Customization
1. Open MapShine debugger
2. Navigate to "Loading Screen & Transitions" accordion
3. Modify desired settings
4. Click "Preview Transition" to see changes
5. Adjust settings in real-time
6. Click "End Transition Preview" when satisfied

### Font Customization
1. Expand "Typography" section
2. Select fonts from dropdown menus
3. Fonts automatically load from Google Fonts
4. Preview updates immediately if active
5. Changes apply to both loading screen and transitions

### Background Customization
1. Expand "Backgrounds & Overlays" section
2. Choose static image OR enable random backgrounds
3. Add multiple images to random list if desired
4. Adjust overlay opacity for text readability
5. Preview shows selected background immediately

## Best Practices

### Performance
- Limit random background list to ~10 images for faster loading
- Use optimized images (WebP recommended, 1920x1080 or higher)
- Keep hint list to reasonable size (~15-20 hints)

### Accessibility
- Maintain sufficient contrast between text and background
- Use readable fonts (avoid overly decorative fonts for body text)
- Keep hint text concise and clear
- Test with background overlay enabled for readability

### User Experience
- Set appropriate fade durations (3-5 seconds recommended)
- Provide meaningful hints that add value
- Use navigation names to avoid spoilers
- Keep subheading text brief and informative

## Troubleshooting

### Preview Not Working
- Ensure SceneChangeManager is initialized
- Check browser console for errors
- Try refreshing Foundry (Ctrl+F5 to clear cache)

### Fonts Not Appearing
- Verify font name matches Google Fonts exactly
- Check browser console for font loading errors
- Ensure internet connection for Google Fonts API
- Try selecting a different font to trigger reload

### Background Not Showing
- Verify image path is correct and accessible
- Check file permissions on server
- Ensure image format is supported (PNG, JPG, WebP)
- Try using a different image to isolate issue

### Live Preview Not Updating
- Ensure preview is active (button shows "End Transition Preview")
- Check that setting is in the live preview support list
- Try toggling preview off and on again
- Verify no JavaScript errors in console
