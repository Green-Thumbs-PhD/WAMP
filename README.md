[![Watch the Promo](https://img.youtube.com/vi/yHcFO6to8E8/0.jpg)](https://www.youtube.com/watch?v=yHcFO6to8E8)

^^^Watch the Promo^^^


WAMP is a browser-based guitar and audio practice rig built with React, TypeScript, and the Web Audio API. It combines a pedalboard, amp-rack utilities, preset workflow, cabinet IR management, MIDI mapping, drum pads, an 8-lane drum sequencer, metronome, tuner, output recording, live scene controls, an expanded looper and backing-track practice workstation, amp voicing, theme presets, and a hideable CPU monitor in one browser app.

This README is based on the current implementation in the app plus the completed items and limitations tracked in [ROADMAP.md](./ROADMAP.md).

Shortcut and control-input documentation lives in [HOTKEYS.md](./HOTKEYS.md).

## What WAMP Can Do

- Run a live input signal through a draggable pedal chain
- Save and reload full rig snapshots including pedal chain state and rack state
- Switch between factory presets and user-created presets
- Rename user presets and edit categories, tags, descriptions, and notes
- Import and export preset bundles for backup or sharing
- Quickly recall recent presets and favorite important presets
- Compare two temporary rig snapshots with A/B recall
- Build live setlists with scene / song mode, cue text, and live-mode scene stepping
- Use preset-load options for mute-on-load and tail-safe spillover behavior
- Control input trim, dedicated mic mute, master output, and global output mute
- Use a built-in tuner with confidence and signal tracking plus a tempo-aware metronome
- Monitor input gain staging with dB readouts, headroom, target zones, input history, trim actions, and mic mute
- Monitor output safety with peak hold, warning zones, output history, output trim actions, panic mute, and reset hold
- Record and replay a post-effects loop with visual trim editing and selectable loop length
- Load backing tracks and repeat marked song sections without leaving the app
- Record, review, clear, and export the wet output of the full rig
- Import, queue, enable, blend, rename, and delete cabinet IRs
- Switch amp voicing between clean, crunch, and lead channels
- Apply a global pre-chain noise gate from the rack
- Trigger 16 browser drum pads from the UI or keyboard
- Run an 8-lane, 16-step drum sequencer with each lane assignable to any drum pad
- Capture 1 second of microphone audio into a selected drum pad
- Import and export drum pad sessions as JSON
- Optionally route drum pads through the pedal chain
- Map transport and rig functions to external MIDI controls
- Reorder and minimize rack tools in the rack dock
- Open a hideable top-right CPU and latency monitor overlay
- Persist presets, last session state, performance settings, theme choice, IR library, and MIDI mappings in the browser
- Swap between four visual themes: The Stack, Cyberpunk, Ghetto Blaster, and Polar Signal

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

- Metronome / tuner
- Amp channel selector
- Cab IR Manager
- Global input noise gate
- Input monitor / output safety
- Recorder / export
- Looper / backing-track practice station
- Drum pads / sequencer
- MIDI mapper in the header control area
- CPU / latency monitor as a hideable top-right overlay

Rack workflow features:

- Rack tools render from the rack tool registry
- Rack tools can be reordered by dragging rack slots
- Rack slots can be minimized to reduce visual clutter
- Rack order and minimized state persist locally as performance settings
- Optional tools are controlled by feature-flag style config

### Presets And Persistence

- Factory presets included: `Clean`, `Crunch`, `Lead`, `Ambient`, `Heavy`, `Surf`
- User presets can be saved from the current rig
- User presets store pedal chain state and rack state
- User presets can store categories, comma-separated tags, descriptions, and notes
- User presets can be renamed from the UI
- User presets can be marked as favorites and filtered from the pedalboard flight case
- Presets can be imported and exported individually or as a library bundle
- Recently used presets appear as quick-recall buttons
- Last session restores from browser storage
- A/B compare stores two temporary rig snapshots for fast recall
- Scene / song mode stores local setlist entries with song title, preset assignment, and cue text
- Performance settings store live mode, mute-on-preset-load, spillover strategy, rack tool order, and minimized rack tools

### UI And Workflow Improvements

- Input and output device selection
- Manual audio device scan from the header
- Keyboard shortcuts for transport and performance actions
- Live-mode keyboard controls for previous scene, next scene, and panic mute
- Separate mic mute and global output mute
- Input and output level metering
- Hideable CPU / latency monitor in the top-right corner of the app
- Four theme presets with persistent local selection
- Better empty states and contextual workflow tips

## Manual / Guideline

### 1. Starting The App

1. Open WAMP in a supported desktop browser.
2. Choose your input device from the `Input` selector.
3. If your browser supports output routing, choose an output device from `Output`.
4. Use `Scan Audio Connections` if you have plugged in an interface, headset, or other device after the page was already open.
5. Press `START` to grant microphone access and initialize audio.
6. If audio is suspended by browser policy, resume it when prompted.

Guidelines:

- Device labels may stay generic until microphone permission is granted.
- Output device switching depends on browser support for audio sink selection.
- WAMP works best in a Chromium-based browser with microphone permission enabled.
- Many rack tools are hidden until audio is running because they depend on live audio state.

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
- Use the rack input monitor and output safety monitor while building higher-gain rigs.

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
3. Click `Save New` to store the current chain and rack state as a new user preset.
4. Assign a preset category, optional comma-separated tags, a short description, and notes when saving.
5. Mark frequently used presets as favorites.
6. Use `Save Details` to rename a user preset or update its metadata.
7. Use `Export Preset`, `Export Library`, or `Import Presets` to move preset data in and out of the browser.
8. Delete a user preset with `Delete` when it is selected.

Guidelines:

- Factory presets are read-only.
- If the engine is not running, selecting a preset queues it for the next audio start instead of loading it immediately.
- Saved presets include pedal settings, bypass states, master/input settings, metronome state, global gate settings, drum pad routing, and cabinet IR selection data.
- Preset filters let you narrow the list by favorites and category directly from the pedalboard case.
- Preset export bundles include local cabinet IR identifiers and rack state, but not portable IR binary payloads.

### 6. Using Preset A/B Compare

1. Dial in one rig state and press `Store A`.
2. Change the rig and press `Store B`.
3. Press `A` or `B` to recall either snapshot.

Guidelines:

- A/B compare is snapshot-based, not a dedicated saved preset system.
- Store both sides manually before comparing.
- A/B snapshots are temporary and are not the same thing as exported presets.

### 7. Scene / Song Mode And Live Mode

Scene / song mode lets you build a local setlist from presets.

1. Select a preset.
2. Press `Add Current To Set`.
3. Add or edit a song title.
4. Pick the preset assigned to the scene if you want to change it.
5. Add cue text for performance reminders.
6. Use `Up`, `Down`, and `Remove` to manage the setlist order.
7. Use `Prev Scene` and `Next Scene` to step through the set.

Live mode provides:

- Larger stage-oriented controls
- A current-song cue banner
- Previous / next scene keyboard actions
- Panic mute keyboard action
- Optional mute-on-preset-load behavior
- `Cut immediately` or `Tail-safe wait` spillover strategy

Guidelines:

- Live mode shortcuts only work when live mode is enabled.
- `[` recalls the previous scene.
- `]` recalls the next scene.
- `\` toggles main output mute / panic mute.
- Tail-safe spillover waits briefly for tails to decay before swapping presets, but it is not a full dual-engine crossfade.

### 8. Header Controls

Available live controls in the header:

- `Input Trim`
- `Mute MIC`
- `Master`
- `Mute ALL`
- `Scan Audio Connections`
- Input and output selectors
- Input level meter
- Output level meter
- MIDI mapper
- Preset A/B compare storage and recall

Guidelines:

- Use `Input Trim` to improve gain staging before the pedal chain.
- Use `Mute MIC` when you want to silence the incoming instrument or microphone without killing backing tracks or other playback.
- Use `Mute ALL` as the immediate panic button for feedback or unexpected volume spikes.
- Use `Scan Audio Connections` after connecting or powering on a new interface or headset.
- Output level reflects post-chain level.

### 9. Rack Layout Controls

The rack tool dock supports quick layout changes:

1. Drag a rack slot to reorder it.
2. Press `minimize` on a rack slot to collapse that module.
3. Press `minimize` again to reopen it.

Guidelines:

- Rack layout state is stored locally with performance settings.
- The input monitor and output safety views currently live together in one combined rack slot.
- Rack layout persistence covers order and minimized state, not per-tool visibility toggles.

### 10. Amp Channel Selector

The amp channel rack slot provides:

- `Clean`, `Crunch`, and `Lead` channel voicing
- `Presence` control
- `Amp Level` trim

Guidelines:

- This stage sits before the pedalboard and gives the rack a broader amp identity.
- `Presence` changes the top-end bite of the amp voicing.
- `Amp Level` trims the amp stage before the rest of the rig output.

### 11. Metronome And Tuner

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

### 12. Input Monitor / Output Safety

The combined monitor rack slot provides an input side and an output side.

Input monitor features:

- Live input dB readout
- Headroom readout
- Input trim percentage
- Low / target / hot meter zones
- Input history bars
- `Trim -10%`
- `Trim +10%`
- `Mute Input`

Output safety features:

- Current output dB readout
- Peak hold readout
- Master percentage
- Safe / warning / danger zones
- Output history bars
- `Trim -3 dB`
- `Trim -6 dB`
- `Panic mute`
- `Reset hold`

Guidelines:

- Keep input peaks in the healthy target zone before the chain.
- Use output safety before increasing master level on high-gain or heavy ambience patches.
- Panic mute toggles the main output mute.

### 13. Recorder / Export

The recorder rack slot captures the wet output after the full rig.

1. Press `Record` to start capturing the processed output.
2. Watch the large elapsed-time display and recording timeline visualizer while recording.
3. Press `Stop` to finish recording.
4. Press `Play take` to review the current take.
5. Press `Export` to download the current recording.
6. Press `Clear take` to remove the current take and reset the timeline.

Guidelines:

- The recorder captures the full processed output, including rack voicing, pedals, IR, and other downstream rack tools.
- The current recorder keeps one active take at a time.
- Export format depends on browser `MediaRecorder` support.
- Planned improvements include pre-roll, auto-stop, multi-take shelves, trim/fade export editing, dual-lane recording views, take naming, and loudness prep.

### 14. Looper And Backing Tracks

The looper rack tool is a full practice workstation. It records after the full effects chain and also lets you load songs or loops into the same rig.

Looper workflow:

1. Choose a loop capture length from the `Loop Length` selector.
2. Press `Record` to capture the wet signal.
3. Stop recording manually or let the selected loop length end automatically.
4. Press `Play` to loop the phrase.
5. Use the waveform and `Loop Start` / `Loop End` controls to trim the loop visually.
6. Press `Apply Trim` to commit the trimmed loop, or `Reset Trim` to restore the full capture.
7. Set the loop playback `Level` to blend it against the live rig.

Backing-track workflow:

1. Press `Load Track` and choose a song, jam track, or loop.
2. Use `Play`, `Pause`, `Stop`, and the track-position slider for transport.
3. Set `Track Vol` to blend the backing track against your live rig.
4. Adjust `Speed` for slower practice or faster review.
5. Use `Section Start` and `Section End` to mark a passage.
6. Turn on `Repeat Section` to keep looping that practice segment.

Guidelines:

- The looper is post-FX, so it captures the processed tone, not the dry input.
- Backing tracks and section repeat markers are meant for practicing through the same WAMP rig without needing another player app.
- Visual trim and section markers are currently slider-based waveform editing, which keeps the workflow lightweight and browser-friendly.
- Backing tracks are loaded from local files for the current session and are not stored in presets.

### 15. Cab IR Manager

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
- Presets save IR selection metadata, but full IR files are not embedded in preset exports.

### 16. Global Input Gate

The rack input gate works before the pedalboard.

Controls:

- Gate on/off
- Threshold
- Release
- Reduction

Guidelines:

- Use it for noisy pickups or high-gain front-end cleanup.
- If picking feels choked, lower the threshold or reduce the gate amount.

### 17. Drum Pads And Sequencer

The drum pad rack includes:

- Sixteen trigger pads
- Keyboard triggering
- Optional routing through the pedal chain
- One-second microphone capture into the selected pad
- Factory kit choices: `Default`, `Trance Giant`, `808 Heat`, `909 Club`, `Linn Pop`
- Drum session import and export
- An 8-lane, 16-step sequencer
- Per-lane pad assignment to any of the 16 pads
- Pattern clear
- Sequencer BPM entry
- Assigned-instrument preview buttons

Guidelines:

- Click a pad to trigger it.
- Shift-click a pad to select it for mic capture.
- Use `Capture 1s from mic` to overwrite the selected pad with a short live sample.
- Use the sequencer on the right side of the module to build repeating drum patterns against the current rack BPM.
- Assign each lane to the pad/instrument you want that lane to play.
- Use `Export Drum Session` when you want to preserve a kit, pattern, and lane assignment.
- Use `Through pedal chain` if you want pads processed by the current pedalboard.
- Default key layout: `QWER`, `ASDF`, `ZXCV`, `UIOP`.

### 18. MIDI Mapping

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
- MIDI mappings support both `Note` and `CC` messages.
- Continuous controls are best used for `Master Volume` and `Input Trim`.
- Discrete `CC` mappings use a threshold-style press behavior: values `64` and above count as pressed, and values below `64` count as released.
- MIDI support depends on the browser Web MIDI API and user permission.
- Current MIDI mapping does not expose live scene stepping or every pedal/rack control.

### 19. CPU / Latency Monitor

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

### 20. Themes

Included themes:

- The Stack
- Cyberpunk
- Ghetto Blaster
- Polar Signal

Guidelines:

- Theme selection is cosmetic and persists locally in the browser.
- The current theme is stored in local storage and does not sync across devices.
- Live mode hides the theme strip to simplify the interface.

### 21. Keyboard Shortcuts

Global shortcuts:

- `Space`: start or stop audio when focus is not in a form field
- `M`: toggle metronome
- `T`: tap tempo
- `R`: looper record / stop record
- `P`: looper play / stop playback

Live mode shortcuts:

- `[`: recall previous scene in the current setlist
- `]`: recall next scene in the current setlist
- `\`: toggle main output mute / panic mute

Drum pad trigger keys:

- `Q`, `W`, `E`, `R`
- `A`, `S`, `D`, `F`
- `Z`, `X`, `C`, `V`
- `U`, `I`, `O`, `P`

Focused control keys:

- `ArrowUp` / `ArrowRight`: increase the focused knob by one step
- `ArrowDown` / `ArrowLeft`: decrease the focused knob by one step
- `PageUp`: increase the focused knob by two steps
- `PageDown`: decrease the focused knob by two steps
- `Home`: set the focused knob to its minimum value
- `End`: set the focused knob to its maximum value
- `Enter`: commit currently typed BPM values in tempo inputs

Guidelines:

- Global shortcuts only fire when focus is not inside an input, textarea, select, button, link, or editable field.
- Live mode shortcuts only work when `Live mode` is enabled.
- Drum pad trigger keys only work while audio is running and the Drum Pads tool is active.
- Some keys are reused by context. For example, `R` controls looper recording globally and also triggers drum pad `HHo` while the drum pad keyboard handler is active.
- Keyboard bindings are not currently user-remappable.
- See [HOTKEYS.md](./HOTKEYS.md) for the full shortcut and control-input table.

## Persistence Model

WAMP currently stores data in browser-local storage and IndexedDB:

- User presets
- Preset preferences such as favorites and recent presets
- Scene / song mode setlists
- Performance settings such as live mode, spillover strategy, rack order, and minimized rack slots
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
- Looper trim editing and practice markers are optimized for quick practice workflows rather than full DAW-style waveform editing.
- Cabinet IR libraries are local to the current browser profile.
- Preset favorites, categories, tags, notes, descriptions, and recent recall are stored locally in the current browser profile.
- Preset export bundles include rack and metadata references, but do not embed portable cabinet IR binary payloads.
- Scene / song mode setlists are stored locally and do not sync across devices.
- MIDI mapping depends on Web MIDI support and granted device access.
- MIDI mapping currently covers selected rig and transport targets, not every pedal/rack parameter and not live scene stepping.
- Computer keyboard shortcuts are fixed and do not currently have a remapping UI.
- Output recording depends on browser `MediaRecorder` support and supported audio container formats.
- Output recorder currently keeps one active exported take rather than a multi-take shelf.
- The input monitor and output safety monitor are implemented as one combined rack slot, so they cannot be independently reordered or minimized.
- Drum pad sessions export kit buffers, lane assignments, and pattern data locally, but they are not part of the main preset bundle.
- Drum sequencer patterns and imported drum sessions are not automatically restored from persistent app storage unless exported and imported as a drum session.
- Backing tracks are loaded from local files for the current session and are not stored in presets or browser storage.
- Theme selection is local to the current browser profile.
- The current spillover strategy is a tail-safe wait before preset replacement rather than a fully seamless dual-engine crossfade.
- The CPU monitor is an in-app estimate based on app-side timing and graph size, not a hardware CPU reading.
- Output device selection depends on browser support for `AudioContext.setSinkId`.

## Roadmap Status

Completed roadmap items already represented in the app include:

- Tool registry for rack modules
- Expanded preset schema with rack state
- Saved rack tool state
- Feature-flag style config
- Better persistence separation
- Theme preset registry
- Saved rack layout controls
- Duplicate pedal
- Copy / paste pedal settings
- Preset A/B compare
- Global mute / panic button
- Separate mic mute and global output mute
- Input trim control
- Manual audio connection scan
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
- Input monitor / gain staging meter
- Output safety / limiter monitor
- Expanded looper editing and backing-track practice tool
- Drum pads, mic capture, drum session import/export, and drum machine sequencer
- CPU / latency monitor
- Noise Gate, Boost / Pre, Phaser, Flanger, Graphic EQ, Limiter
- Octaver, Auto-Wah, Cab Sim, Pitch Shifter, Harmonizer, Freeze
- Preset categories, tags, favorites, rename, notes, import/export, and recent recall
- Live mode, scene/song mode, cue display, mute-on-preset-load, and spillover strategy
- Preset export bundles with metadata
- Premium visual skins and rack faces

Still planned or not yet implemented:

- Shareable rig links
- Preset spotlight / featured rigs
- One-click demo mode
- Public preset packs
- Browser poly synth rack tool
- MIDI keyboard instrument mode
- Virtual keyboard / fretboard input
- Bass mode / bass amp voicing
- Sample instrument rack
- Chord generator / strum engine
- MIDI learn for every continuous control
- MIDI clock sync
- MIDI note-to-pitch tools
- MIDI macro scenes
- Expression pedal mapping
- MIDI clip / phrase recorder
- Spectrum analyzer / EQ view
- Noise / hum detector
- Auto-level / gain advisor
- Stereo field viewer
- Match-EQ / tone reference tool
- Stereo delay and stereo reverb variants
- Parallel routing / blend mixer
- Multi-band compressor pedal
- Granular texture pedal
- Ring mod / bit crusher pair
- Dual amp mode
- Scale-aware harmonizer
- Tempo trainer
- Pitch accuracy history
- Chord / scale trainer overlay
- Practice streaks / session stats
- Comment-ready preset summaries
- Embedded share player
- Collaborative rig editing
- Signature rig collections
- Account-based cloud sync
- Marketplace-style preset exchange

Recorder/export improvements still planned:

- Pre-roll and auto-stop capture modes
- Multi-take shelf with instant audition
- Trim, fade, and tail-safe export region editing
- Dual-lane recorder view
- Take naming, notes, and quick tags
- Loudness prep and share-ready export options

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
- `MediaRecorder` for wet-output export
- Audio sink selection support if you want output device routing

## Project Note

In this Codex workspace environment, Vite commands may fail inside the sandbox with `spawn EPERM` even when the project itself is valid.

PS: Current improvement areas worth tracking: WAMP now has a strong local-browser workflow, but several advanced flows still stop at local storage rather than portable sharing or account sync; keyboard shortcuts are documented but not remappable; MIDI mapping does not yet reach live scene stepping or every pedal/rack parameter; preset exports do not carry full IR binary payloads; recorder export is still one-take-at-a-time; and drum sessions, backing tracks, and theme choice are useful locally but not yet unified into one portable session format.

![WAMP_logo](https://github.com/user-attachments/assets/5dec99b4-ed9e-4a9e-a74f-f9cbbb29ee12)
