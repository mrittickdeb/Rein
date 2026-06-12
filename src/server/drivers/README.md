# Drivers

Cross-platform input injection layer used by the server to generate native mouse, keyboard, and touch input events on Windows, Linux, and macOS.

## Structure

### Shared Files

* **constants.ts** – Common constants used across platforms.
* **keyMap.ts** – Maps application key names to platform-specific key codes.
* **types.ts** – Shared TypeScript interfaces and type definitions.
* **utils.ts** – Utility functions for input processing and motion calculations.

### Linux (`linux/`)

Implements input injection using the Linux **uinput** subsystem.

* **index.ts** – Main Linux input injector.
* **keyboard.ts** – Keyboard event injection.
* **touch.ts** – Multi-touch input handling using the Linux MT slot protocol.
* **constants.ts** – Linux-specific constants and event codes.
* **structs.ts** – Native bindings and uinput structures.

### macOS (`mac/`)

Implements input injection using **CoreGraphics** APIs.

* **index.ts** – Main macOS input injector.
* **keyboard.ts** – Keyboard and Unicode text injection.
* **touch.ts** – Touch gesture translation (drag, scroll, pinch zoom).
* **constants.ts** – CoreGraphics constants and event definitions.
* **structs.ts** – Native bindings for CoreGraphics functions.

### Windows (`windows/`)

Implements input injection using **SendInput** and the **Synthetic Pointer API**.

* **index.ts** – Main Windows input injector.
* **keyboard.ts** – Keyboard and Unicode text injection.
* **touch.ts** – Synthetic multi-touch input implementation.
* **constants.ts** – Windows input constants and flags.
* **structs.ts** – Win32 and synthetic pointer bindings.

## Supported Input Types

* Mouse movement
* Mouse buttons
* Mouse wheel scrolling
* Keyboard input
* Key combinations
* Text injection
* Multi-touch input
* Pinch and zoom gestures
* Clipboard shortcuts (copy/paste)
