[![Watch the Promo](https://img.youtube.com/vi/yHcFO6to8E8/0.jpg)](https://www.youtube.com/watch?v=yHcFO6to8E8)


WAMP is a browser-based guitar and audio practice rig built with React, TypeScript, and the Web Audio API. It combines a pedalboard, rack utilities, preset workflow, cabinet IR management, MIDI mapping, drum pads, metronome, tuner, looper controls, amp voicing, output recording, and a hideable CPU monitor in one browser app.

This README is based on the current implementation in the app plus the completed items in [ROADMAP.md](./ROADMAP.md).

## What WAMP Can Do

- Run a live input signal through a draggable pedal chain
- Save and reload full rig snapshots including rack state
- Switch between factory presets and user-created presets
- Compare two rig snapshots with A/B recall
- Organize presets with categories, tags, and favorites
- Control input trim, master output, and instant mute
- Use a built-in tuner with confidence and signal tracking plus a tempo-aware metronome
- Record and replay a post-effects loop
- Record and export the wet output of the full rig
- Import, queue, enable, blend, rename, and delete cabinet IRs
- Switch amp voicing between clean, crunch, and lead channels
- Apply a global pre-chain noise gate from the rack
- Trigger browser drum pads and optionally route them through the pedal chain
- Capture 1 second of microphone audio into a selected drum pad
- Map transport and rig functions to external MIDI controls
- Open a hideable top-right CPU and latency monitor overlay
- Persist presets, last session state, theme choice, IR library, and MIDI mappings in the browser
- Swap between multiple visual themes

## Implemented Feature Set

### Pedals

Current pedal lineup:

- Noise Gate
- Compressor
- Boost / Pre
- Distortion
- Phaser
- Flanger
- Chorus
- Octaver
- Auto-Wah
- Pitch Shifter
- Harmonizer
- Delay
- Reverb
- Freeze
- Tremolo
- EQ
- Graphic EQ
- Cab Sim
- Limiter
- Volume

Pedal workflow features:

- Add pedals from the `+` menu
- Drag pedals left to right to reorder the chain
- Lock pedal position to keep a slot fixed during reordering
- Duplicate a pedal
- Copy and paste settings between pedals of the same type
- Bypass or enable each pedal with its footswitch
- Remove pedals from the chain
- Jump to pedals through the signal overview mini-map

### Rack Tools

Current rack tool modules:

- Amp channel selector
- Cab IR Manager
- Global input noise gate
- Recorder / export
- Looper
- Metronome / tuner
- Drum pads
- MIDI mapper in the header control area
- CPU / latency monitor as a hideable top-right overlay

### Presets And Persistence

- Factory presets included: `Clean`, `Crunch`, `Lead`, `Ambient`, `Heavy`, `Surf`
- User presets can be saved from the current rig
- User presets can store a category and comma-separated tags
- Presets can be marked as favorites and filtered from the pedalboard flight case
- Presets store both pedal chain state and rack state
- Last session restores from browser storage
- A/B compare stores two temporary rig snapshots for fast recall

### UI And Workflow Improvements

- Input and output device selection
- Keyboard shortcuts for transport and performance actions
- Panic-style global mute
- Input and output level metering
- Hideable CPU / latency monitor in the top-right corner of the app
- Theme presets for multiple studio looks
- Better empty states and contextual workflow tips

## Manual / Guideline

### 1. Starting The App

1. Open WAMP in a supported desktop browser.
2. Choose your input device from the `Input` selector.
3. If your browser supports output routing, choose an output device from `Output`.
4. Press `START` to grant microphone access and initialize audio.
5. If audio is suspended by browser policy, resume it when prompted.

Guidelines:

- Device labels may stay generic until microphone permission is granted.
- Output device switching depends on browser support for audio sink selection.
- WAMP works best in a Chromium-based browser with microphone permission enabled.

### 2. Building A Signal Chain

1. Click the `+` pedal to open the effect menu.
2. Add pedals in the order you want them to process the signal.
3. Drag pedals by the top handle area to reorder them.
4. Use each pedal's knobs to shape tone and dynamics.
5. Click the footswitch to bypass or re-enable a pedal.

Guidelines:

- The chain runs left to right.
- Start simple: gate or compressor first, gain shaping next, ambience later.
- Use `Volume` or `Limiter` near the end of the chain when you want output control.

### 3. Managing Individual Pedals

Each pedal includes quick actions in the title bar:

- `L` locks or unlocks pedal position
- `D` duplicates the pedal
- `C` copies that pedal's settings
- `P` pastes settings into another pedal of the same type
- `x` removes the pedal

Guidelines:

- Locked pedals stay anchored while unlocked pedals move around them.
- Paste is only available when the copied source and destination pedal types match.
- Duplicating is useful for stacked gain, EQ staging, and layered time effects.

### 4. Using The Mini-Map

When the chain contains pedals, WAMP shows a signal overview strip above the board.

- Click any block to scroll directly to that pedal
- Locked pedals are marked as locked
- Bypassed pedals are visually marked as bypassed

Guidelines:

- Use the mini-map once the board gets long enough that dragging and scanning slows you down.

### 5. Using Presets

1. Load a preset from the preset dropdown.
2. Adjust the rig as needed.
3. Click `Save` to store the current chain and rack state as a new user preset.
4. Assign a preset category and optional comma-separated tags when saving.
5. Mark frequently used presets as favorites.
6. Delete a user preset with `Del` when it is selected.

Guidelines:

- Factory presets are read-only.
- If the engine is not running, selecting a preset queues it for the next audio start instead of loading it immediately.
- Saved presets include pedal settings, bypass states, master/input settings, metronome state, global gate settings, drum pad routing, and cabinet IR selection data.
- Preset filters let you narrow the list by favorites and category directly from the pedalboard case.

### 6. Using Preset A/B Compare

1. Dial in one rig state and press `Store A`.
2. Change the rig and press `Store B`.
3. Press `A` or `B` to recall either snapshot.

Guidelines:

- A/B compare is snapshot-based, not a dedicated saved preset system.
- Store both sides manually before comparing.

### 7. Header Controls

Available live controls in the header:

- `Input Trim`
- `Master`
- `Mute`
- Input level meter
- Output level meter
- MIDI mapper

Guidelines:

- Use `Input Trim` to improve gain staging before the pedal chain.
- Use `Mute` as the immediate panic button for feedback or unexpected volume spikes.
- Output level reflects post-chain level.

### 8. Amp Channel Selector

The amp channel rack slot provides:

- `Clean`, `Crunch`, and `Lead` channel voicing
- `Presence` control
- `Amp Level` trim

Guidelines:

- This stage sits before the pedalboard and gives the rack a broader amp identity.
- `Presence` changes the top-end bite of the amp voicing.
- `Amp Level` trims the amp stage before the rest of the rig output.

### 9. Metronome And Tuner

The metronome/tuner rack slot provides:

- Metronome start/stop
- BPM entry
- Tap tempo
- Apply BPM to delay and tremolo
- Live tuner note and cents readout
- Confidence and signal-strength feedback
- A short recent-note trail for pitch stability context

Guidelines:

- Tap tempo needs at least two taps.
- Applying BPM updates delay time to quarter-note timing and tremolo rate to a BPM-derived value.
- The tuner is best with a clean, sustained single note.

### 10. Recorder / Export

The recorder rack slot captures the wet output after the full rig.

1. Press `Record output` to start capturing the processed output.
2. Press `Stop capture` to finish recording.
3. Press `Export last take` to download the most recent recording.

Guidelines:

- The recorder captures the full processed output, including rack voicing, pedals, IR, and other downstream rack tools.
- Export format depends on browser `MediaRecorder` support.

### 11. Looper

The looper records after the full effects chain.

1. Press `Record` to begin capturing the wet signal.
2. Press again to stop and save the loop.
3. Press `Play` to hear the loop.
4. Use `Stop loop` or `Clear` when needed.
5. Adjust playback level with the looper level slider.

Guidelines:

- The looper is post-FX, so it captures the processed tone, not the dry input.
- Recording is disabled while a loop is already playing.

### 12. Cab IR Manager

1. Import a WAV or other browser-decodable audio file.
2. Load it immediately if audio is running, or queue it for the next start.
3. Enable or bypass the active IR.
4. Blend dry and wet signal with `Cab Blend`.
5. Rename or delete saved IRs from the library.
6. Use `Clear active` to remove the current IR selection.

Guidelines:

- IRs are stored locally in the current browser profile.
- Saved IR entries can be reused across sessions and presets on the same browser profile.
- The rack IR system is separate from the in-chain `Cab Sim` pedal.

### 13. Global Input Gate

The rack input gate works before the pedalboard.

Controls:

- Gate on/off
- Threshold
- Release
- Reduction

Guidelines:

- Use it for noisy pickups or high-gain front-end cleanup.
- If picking feels choked, lower the threshold or reduce the gate amount.

### 14. Drum Pads

The drum pad rack includes:

- Sixteen trigger pads
- Keyboard triggering
- Optional routing through the pedal chain
- One-second microphone capture into the selected pad

Guidelines:

- Click a pad to trigger it.
- Shift-click a pad to select it for mic capture.
- Use `Through pedal chain` if you want pads processed by the current pedalboard.
- Default key layout: `QWER`, `ASDF`, `ZXCV`, `UIOP`.

### 15. MIDI Mapping

The MIDI mapper can learn bindings for:

- Transport start/stop
- Mute
- Master volume
- Input trim
- Metronome toggle
- Tap tempo
- Looper record
- Looper play/stop
- Compare A
- Compare B

Guidelines:

- Turn MIDI mapping on, select a MIDI input, then press `Learn` for a target and move a control.
- Continuous controls are best used for `Master Volume` and `Input Trim`.
- MIDI support depends on the browser Web MIDI API and user permission.

### 16. CPU / Latency Monitor

The CPU monitor lives in the top-right corner of the app and can be shown or hidden at any time.

It displays:

- Estimated DSP load
- Base latency
- Output latency
- Average frame timing
- Sample rate
- Active node estimate

Guidelines:

- This is an in-app performance estimate, not a system-wide hardware CPU meter.
- Use it to compare relative rig complexity and browser load while building patches.

### 17. Themes

Included themes:

- The Stack
- Cyberpunk
- Sunset Static
- Polar Signal

Guidelines:

- Theme selection is cosmetic and persists locally in the browser.

### 18. Keyboard Shortcuts

- `Space`: start or stop audio when focus is not in a form field
- `M`: toggle metronome
- `T`: tap tempo
- `R`: looper record / stop record
- `P`: looper play / stop playback

## Persistence Model

WAMP currently stores data in browser-local storage and IndexedDB:

- User presets
- Last session rig snapshot
- Rack state
- Theme selection
- MIDI mappings
- Cabinet IR library

This means your data persists across refreshes on the same browser profile, but it is not account-based or cross-device synced.

## Known Limitations

- The tuner is optimized for single sustained notes and is less stable on noisy or heavily processed input.
- Preset A/B compare stores temporary snapshots of the current rig; it does not bind directly to named preset slots.
- The browser-side noise gate is lightweight and may need manual threshold/release tuning in noisy setups.
- Octaver, pitch shifter, harmonizer, freeze, and related pitch-based effects are lightweight browser implementations and may sound rougher on dense chords or fast playing.
- The amp channel selector is a broad browser-side voicing stage rather than a deep component-level amp model.
- Cabinet IR libraries are local to the current browser profile.
- Preset favorites, categories, and tags are stored locally in the current browser profile.
- MIDI mapping depends on Web MIDI support and granted device access.
- Output recording depends on browser `MediaRecorder` support and supported audio container formats.
- The CPU monitor is an in-app estimate based on app-side timing and graph size, not a hardware CPU reading.
- Output device selection depends on browser support for `AudioContext.setSinkId`.

## Roadmap Status

Completed roadmap items already represented in the app include:

- Tool registry for rack modules
- Expanded preset schema with rack state
- Saved rack tool state
- Better persistence separation
- Duplicate pedal
- Copy / paste pedal settings
- Preset A/B compare
- Global mute / panic button
- Input trim control
- Transport and tap-tempo hotkeys
- Signal-chain mini-map
- Lock pedal position
- Better empty states and tips
- Tuner
- IR library manager
- Global noise gate rack tool
- MIDI / external controller mapping
- Amp channel selector
- Recorder / export tool
- CPU / latency monitor
- Noise Gate, Boost / Pre, Phaser, Flanger, Graphic EQ, Limiter
- Octaver, Auto-Wah, Cab Sim, Pitch Shifter, Harmonizer, Freeze
- Advanced pitch tracking features
- Preset categories, tags, and favorites

Still planned or not yet implemented:

- Input monitor / gain staging meter as a dedicated rack tool
- Output safety / limiter monitor
- Preset rename in UI, notes, import/export, and recent recall
- Live mode, scene/song mode, spillover strategy, and deeper performance features

## Tech Stack

- React 19
- TypeScript
- Vite
- Web Audio API
- `@dnd-kit` for pedal drag-and-drop

## Local Development

### Install

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Browser Requirements

For the best experience, use a modern desktop browser with support for:

- `getUserMedia`
- Web Audio API
- `enumerateDevices`
- IndexedDB
- Web MIDI API for MIDI mapping
- Audio sink selection support if you want output device routing

## Project Note

In this Codex workspace environment, Vite commands may fail inside the sandbox with `spawn EPERM` even when the project itself is valid.

![WAMP_logo](https://github.com/user-attachments/assets/5dec99b4-ed9e-4a9e-a74f-f9cbbb29ee12)
