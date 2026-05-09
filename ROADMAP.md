# WAMP Roadmap

This roadmap is organized so features can be kept, deferred, or removed cleanly.

How to use this file:
- Change `[ ]` to `[x]` when a feature is completed.
- Add `KEEP`, `MAYBE`, or `REMOVE` next to any item as you refine scope.
- Remove any item without affecting the structure of the rest of the roadmap.
- Keep all UI changes clean feeling and user friendly. Any further arrangement changes should resemble to a rack-style stereo system. 

Suggested labels:
- `P1`: highest value / best next work
- `P2`: strong follow-up
- `P3`: optional or experimental

## Core Product Direction

These items shape the long-term structure of the app and make future features easier to add.

- [x] `P1` Tool registry for rack modules
  Purpose: New tools automatically render in their own stacked amp-rack section.
- [x] `P1` Preset schema expansion
  Purpose: Allow presets to save more than pedal state, including rack settings and IR data.
- [x] `P1` Saved rack tool state
  Purpose: Restore tuner, looper-related preferences, IR settings, and future rack tools consistently.
- [x] `P1` Feature-flag style config
  Purpose: Make optional features easy to hide or remove later.
- [x] `P2` Better persistence model
  Purpose: Separate pedal chain, rack state, and user libraries more cleanly in storage.
- [x] `P2` Theme preset registry
  Purpose: Let the app switch between four stylized UI presets: The Stack, Cyberpunk, Ghetto Blaster, and Polar Signal.
- [x] `P2` Saved rack layout controls
  Purpose: Allow rack tools to be reordered, minimized, and restored as part of local performance settings.

## Phase 1: High-Impact Usability

These are the fastest wins for making the app easier to use every day.

- [x] `P1` Duplicate pedal
  Purpose: Speed up experimentation with stacked tones.
- [x] `P1` Copy / paste pedal settings
  Purpose: Reuse pedal setups without rebuilding them by hand.
- [x] `P1` Preset A/B compare
  Purpose: Compare two sounds quickly while dialing in tone.
- [x] `P1` Global mute / panic button
  Purpose: Immediately silence output during feedback, clipping, or live mistakes.
- [x] `P1` Input trim control
  Purpose: Improve gain staging before the pedal chain.
- [x] `P1` Transport and tap-tempo hotkeys
  Purpose: Faster keyboard-based performance control.
- [x] `P2` Signal-chain mini map
  Purpose: Improve navigation when the pedalboard becomes large.
- [x] `P2` Lock pedal position
  Purpose: Prevent accidental drag reordering during editing.
- [x] `P2` Better empty states and contextual tips
  Purpose: Help new users discover workflows faster.
- [x] `P2` Drag handles / reorder affordances refinement
  Purpose: Make chain editing feel more obvious and more reliable.

## Phase 2: Rack Tool Expansion

These features belong in the simulated amp rack and should each live in their own rack slot.

- [x] `P1` Tuner
  Purpose: Essential utility tool for a guitar-focused rig.
- [x] `P1` IR library manager
  Purpose: Save, browse, relabel, and reuse imported cabinet IRs.
- [x] `P1` Global noise gate rack tool
  Purpose: Clean noisy input before or after the chain depending on design.
- [x] `P2` Amp channel selector
  Purpose: Give the rack a clearer clean / crunch / lead amp identity.
- [x] `P2` Recorder / export tool
  Purpose: Capture wet output directly from the app.
- [x] `P2` Input monitor / gain staging meter
  Purpose: Help users set healthy levels before effects with dB readouts, headroom, target-zone metering, input history, trim controls, and mic mute.
- [x] `P2` Output safety / limiter monitor
  Purpose: Prevent accidental clipping and harsh output spikes with peak hold, warning zones, output history, quick trim actions, panic mute, and reset hold.
- [x] `P3` MIDI / external controller mapping
  Purpose: Support foot controllers, knobs, and preset switching from hardware.
- [x] `P3` CPU / latency monitor
  Purpose: Surface performance cost as the app grows.

## Phase 3: Essential Pedal Additions

These are the best next pedals to add for practical tone building.

- [x] `P1` Noise Gate pedal
  Purpose: Reduce hiss and hum in high-gain setups.
- [x] `P1` Boost / Preamp pedal
  Purpose: Add gain staging, solo lift, and front-end shaping.
- [x] `P1` Phaser pedal
  Purpose: Fill a classic modulation gap.
- [x] `P2` Flanger pedal
  Purpose: Complete the core modulation family.
- [x] `P2` Graphic EQ pedal
  Purpose: Offer more visual, guitarist-friendly tonal control.
- [x] `P2` Limiter pedal
  Purpose: Smooth peaks at the end of chain.

## Phase 4: Creative and Expressive Pedals

These expand the sound design range and make the app feel more complete.

- [x] `P2` Octaver pedal
  Purpose: Add bass-like weight and synth-adjacent textures.
- [x] `P2` Auto-wah / envelope filter pedal
  Purpose: Add expressive funk and dynamic filter motion.
- [x] `P2` Cab sim pedal
  Purpose: Provide in-chain cabinet shaping separate from rack IR loading.
- [x] `P3` Pitch shifter pedal
  Purpose: Add detune, harmony, and interval-based sounds.
- [x] `P3` Harmonizer pedal
  Purpose: Create premium lead and dual-note textures.
- [x] `P3` Freeze / sustain pedal
  Purpose: Support ambient and cinematic sound design.

## Phase 5: Presets and Workflow

These features improve how users store, organize, and revisit sounds.

- [x] `P1` Move presets beyond chain-only behavior
  Purpose: Save pedalboard, rack state, IR choice, and amp settings together.
- [x] `P1` Preset categories / tags
  Purpose: Filter by clean, lead, ambient, heavy, live set, and more.
- [x] `P1` Favorite presets
  Purpose: Make frequently used sounds easier to reach.
- [x] `P2` Preset rename from UI
  Purpose: Improve preset maintenance without deleting and recreating.
- [x] `P2` Preset notes / description
  Purpose: Store context like guitar type, tuning, or intended song.
- [x] `P2` Import / export presets
  Purpose: Share tones or back them up.
- [x] `P2` Recent presets / quick recall
  Purpose: Speed up back-and-forth comparison while building sounds.

## Phase 6: Live Performance Improvements

These features make the app more dependable in rehearsal and performance settings.

- [x] `P1` Clear live mode
  Purpose: Larger controls, simplified UI, fewer accidental edits.
- [x] `P1` Footswitch-oriented actions
  Purpose: Map common tasks to simple external or keyboard triggers.
- [x] `P2` Scene / song mode
  Purpose: Organize presets into a performance setlist.
- [x] `P2` Spillover strategy for delay / reverb
  Purpose: Keep tails natural when changing sounds.
- [x] `P2` Output mute on preset load option
  Purpose: Avoid clicks or jumps during patch changes.
- [x] `P3` Per-song notes and cue display
  Purpose: Support practical performance workflow.

## Phase Duex: Expansion, Attraction, And Hybrid Instruments

This phase builds on the current rack-and-pedal foundation and pushes WAMP toward a more complete browser music workstation, practice space, and creator tool.

#### Recorder / Export Tool Discoveries

- [ ] `P1` Pre-roll and auto-stop capture modes
  Purpose: Let users arm a take, get a visual count-in, and stop cleanly at a target duration without rushed clicks.
- [ ] `P1` Multi-take shelf with instant audition
  Purpose: Keep the last few recorder passes available for quick compare, export, or delete instead of replacing each take immediately.
- [ ] `P2` Trim, fade, and tail-safe export region editing
  Purpose: Let users clean the start and end of a take before export without leaving the rack workflow.
- [ ] `P2` Dual-lane recorder view
  Purpose: Show dry input versus wet output activity together so clipping, latency feel, and dynamics are easier to understand while recording.
- [ ] `P2` Take naming, notes, and quick tags
  Purpose: Help users organize riffs, idea captures, and song-version exports without relying on timestamp-only filenames.
- [ ] `P3` Loudness prep and share-ready export options
  Purpose: Add normalize, limiter, and format presets so quick bounce exports feel more polished and reusable.

### Phase Duex A: Magnetic User Features

These features make the app more shareable, easier to come back to, and more immediately impressive to new users.

- [ ] `P1` Shareable rig links
  Purpose: Let users open a preset, rack state, and pedal chain from a URL for quick sharing and discovery.
- [ ] `P1` Preset spotlight / featured rigs
  Purpose: Surface curated rigs on startup so new users hear something great quickly.
- [ ] `P1` One-click demo mode
  Purpose: Let users explore the interface and hear sample content without wiring live input first.
- [ ] `P2` Public preset packs
  Purpose: Bundle themed collections like ambient, shoegaze, funk, doom, synth-guitar, and live utility.
- [ ] `P2` Session thumbnails / rig cards
  Purpose: Make saved presets and recent sessions more visual and easier to browse.
- [ ] `P3` Creator showcase page
  Purpose: Highlight community rigs, featured boards, and signature artist setups inside the app.

### Phase Duex B: Instruments And Sound Sources

These ideas expand WAMP beyond guitar input into a broader playable instrument environment.

- [ ] `P1` Browser poly synth rack tool
  Purpose: Add a playable synth voice so pedals and rack tools can be used without guitar input.
- [ ] `P1` MIDI keyboard instrument mode
  Purpose: Let external MIDI keyboards trigger synth engines directly through the rack and pedalboard.
- [ ] `P1` Virtual keyboard / fretboard input
  Purpose: Give users an on-screen way to audition sounds on laptops and touch devices.
- [ ] `P2` Bass mode / bass amp voicing
  Purpose: Tune the rack and effects defaults toward low-frequency instruments.
- [ ] `P2` Sample instrument rack
  Purpose: Turn imported one-shots or loops into playable keyboard zones.
- [x] `P2` Drum pad kit / session import and export
  Purpose: Save and reload drum kit choice, custom pad buffers, lane assignments, and sequencer patterns as JSON.
- [x] `P2` Mic capture to drum pads
  Purpose: Capture one second of current input into a selected pad for quick custom one-shots.
- [x] `P3` Drum machine sequencer
  Purpose: Move from trigger pads to an 8-lane, 16-step sequencer where each lane can target any of the 16 pads.
- [ ] `P3` Chord generator / strum engine
  Purpose: Create playable accompaniment and songwriting sketches from a keyboard or pad input.

### Phase Duex C: MIDI Synth And Controller Growth

These features deepen the MIDI side beyond simple control mapping.

- [ ] `P1` MIDI learn for every continuous control
  Purpose: Map pedals, rack knobs, and utility controls more completely from hardware.
- [ ] `P1` MIDI clock sync
  Purpose: Sync metronome, delay timing, looper workflows, and future sequencers with external gear.
- [ ] `P2` MIDI note-to-pitch tools
  Purpose: Let MIDI notes drive harmonizer intervals, synth pitch, and future pitch-aware modules.
- [ ] `P2` MIDI macro scenes
  Purpose: Trigger multiple control changes at once from one hardware button or pedal press.
- [ ] `P2` Expression pedal mapping
  Purpose: Support live sweeps for wah, delay mix, volume, filter motion, and synth macros.
- [ ] `P3` MIDI clip / phrase recorder
  Purpose: Capture and replay performance gestures for synths and mapped controls.

### Phase Duex D: New Rack Intelligence Tools

These tools build on the existing rack identity and make the app smarter and more studio-like.

- [x] `P1` Dedicated input monitor / gain staging meter
  Purpose: Implemented as the input side of the combined INPUT MONITOR / OUTPUT SAFETY rack slot, with clear headroom targets and status guidance.
- [x] `P1` Output safety / limiter monitor
  Purpose: Implemented as the output side of the combined INPUT MONITOR / OUTPUT SAFETY rack slot, with visible peak warnings and safety options.
- [ ] `P1` Spectrum analyzer / EQ view
  Purpose: Show live tonal balance for guitar, synth, drums, and recorded output.
- [ ] `P2` Noise / hum detector
  Purpose: Help users diagnose input buzz, clipping, or room-noise problems automatically.
- [ ] `P2` Auto-level / gain advisor
  Purpose: Suggest better input trim, amp level, or output level settings from live signal conditions.
- [ ] `P2` Stereo field viewer
  Purpose: Support future stereo tools, dual paths, and spatial effects with a visual readout.
- [ ] `P3` Match-EQ / tone reference tool
  Purpose: Compare current rig output to a reference file and suggest tonal moves.

### Phase Duex E: Next Pedals And Signal Architecture

These ideas build the board into a deeper modular rig.

- [ ] `P1` Stereo delay and stereo reverb variants
  Purpose: Extend the current ambience tools toward wider modern textures.
- [ ] `P1` Parallel routing / blend mixer
  Purpose: Split dry and effected paths for modern bass, ambient, and studio workflows.
- [ ] `P2` Multi-band compressor pedal
  Purpose: Give users stronger modern tone shaping for synth, bass, and polished output.
- [ ] `P2` Granular texture pedal
  Purpose: Create glitch, smear, shimmer, and cloud-like sound design.
- [ ] `P2` Ring mod / bit crusher pair
  Purpose: Add aggressive experimental tones and synth-adjacent destruction.
- [ ] `P3` Dual amp mode
  Purpose: Blend two amp voices or route paths left and right for richer stereo rigs.
- [ ] `P3` Scale-aware harmonizer
  Purpose: Upgrade the current harmonizer into a musically smarter lead tool.

### Phase Duex F: Practice And Learning Tools

These features improve retention by making WAMP useful even when users are not just building tones.

- [x] `P1` Backing track player
  Purpose: Load songs or loops, play / pause / stop, control volume and speed, seek through the waveform, and practice through the same rig without another app.
- [x] `P1` Section looper / practice markers
  Purpose: Mark section start and end points on a backing track and repeat song passages for targeted practice sessions.
- [x] `P1` Post-FX looper with visual trim
  Purpose: Capture processed loops, choose record length, preview waveform peaks, trim loop start / end, apply trims, and set loop playback level.
- [ ] `P2` Tempo trainer
  Purpose: Gradually increase BPM over time for riff, scale, and timing practice.
- [ ] `P2` Pitch accuracy history
  Purpose: Track tuning stability and note confidence over a short practice session.
- [ ] `P2` Chord / scale trainer overlay
  Purpose: Turn the app into a practice companion instead of only an effects rig.
- [ ] `P3` Practice streaks / session stats
  Purpose: Increase user return rate with lightweight progress tracking.

### Phase Duex G: Social And Collaboration Features

These features make the app more likely to spread between users.

- [x] `P1` Preset export bundles with metadata
  Purpose: Package rigs with categories, tags, descriptions, notes, chain state, rack state, and local cabinet IR identifiers for sharing or backup.
- [ ] `P2` Comment-ready preset summaries
  Purpose: Generate compact descriptions users can post with shared rigs or recordings.
- [ ] `P2` Embedded share player
  Purpose: Let a shared preset page preview a sample tone or exported take in the browser.
- [ ] `P3` Collaborative rig editing
  Purpose: Let multiple users iterate on a rig concept and swap revisions.

### Phase Duex H: Monetizable / Premium-Looking Directions

These are optional paths if the product ever needs a stronger premium identity or platform feel.

- [ ] `P2` Signature rig collections
  Purpose: Group premium-feeling boards and rack setups around named sonic identities.
- [x] `P2` Premium visual skins and rack faces
  Purpose: Add stronger personalization and perceived product depth through The Stack, Cyberpunk, Ghetto Blaster, and Polar Signal theme presets.
- [ ] `P3` Account-based cloud sync
  Purpose: Move presets, favorites, tags, MIDI mappings, and IR references beyond one browser.
- [ ] `P3` Marketplace-style preset exchange
  Purpose: Create a library of downloadable or community-submitted rigs and packs.

## Easy Cuts

These are the cleanest items to remove if you want to keep the app tighter:

- [ ] MIDI / external controller mapping
- [ ] CPU / latency monitor
- [ ] Harmonizer pedal
- [ ] Advanced pitch shifter pedal
- [ ] Dual amp mode
- [ ] Parallel routing / split paths

## Known Limitations / Restrictions

Add new items here whenever a limitation, restriction, or temporary workaround is discovered.

- [ ] The integrated tuner is optimized for single sustained notes and can become unstable with noisy or heavily processed input.
  Impact: Tuning accuracy is best on a clean, isolated note rather than chords or dense signals.
- [ ] Preset A/B compare currently works by capturing two rig snapshots from the current state rather than assigning two named preset slots directly.
  Impact: Users need to store the rig into A and B manually before switching between them.
- [ ] The current noise gate implementation is a lightweight browser-side gate and may behave less smoothly than a dedicated studio-grade gate.
  Impact: Fast transients or very noisy signals may need manual threshold and release adjustment.
- [ ] The Phase 4 creative pedals use lightweight browser-native pitch, freeze, and envelope processing rather than studio-grade tracking algorithms.
  Impact: Octaver, pitch shifting, harmonizer, and freeze effects work best on simpler monophonic or sustained material and may sound grainy on dense chords or very fast playing.
- [ ] The amp channel selector is a lightweight browser-side voicing stage rather than a full modeled amplifier.
  Impact: Clean, crunch, and lead channels give the rack a clearer identity, but they are still broad tonal voicings rather than deep component-level amp emulations.
- [ ] Saved cabinet IRs live in the current browser profile via IndexedDB rather than a cross-device account library.
  Impact: IR libraries persist across refreshes on this machine, but they do not automatically sync to another browser or device.
- [ ] Preset favorites and metadata filters are stored locally in this browser profile rather than in a shared cloud library.
  Impact: Categories, tags, and favorites work across reloads here, but they do not automatically appear in another browser or machine.
- [ ] MIDI mapping depends on the browser Web MIDI API and on user-granted device access.
  Impact: External controller mapping may be unavailable in unsupported browsers or until MIDI permission is granted, and mappings are saved locally in this browser profile.
- [ ] Output recording and export depend on the browser MediaRecorder API and supported audio container formats.
  Impact: Wet-output capture works in modern browsers, but export format and availability may vary by browser.
- [ ] Output recorder currently keeps one active exported take rather than a multi-take shelf.
  Impact: Users can play, export, or clear the current take, but previous takes are replaced instead of being preserved for comparison.
- [ ] Input monitor and output safety are implemented as one combined rack slot even though some roadmap wording refers to dedicated tools.
  Impact: The current experience is compact and functional, but users cannot independently reorder or hide the input and output halves.
- [ ] Drum pad sessions export kit buffers, lane assignments, and pattern data locally, but they are not part of the main preset bundle yet.
  Impact: A full performance rig and a drum session may need to be exported separately.
- [ ] Drum sequencer patterns and imported drum sessions are browser-session UI state, not automatically restored from persistent app storage.
  Impact: Users should export a drum session when they want to preserve a pattern or custom kit across future work.
- [ ] Backing tracks are loaded from local files for the current session and are not stored in presets or browser storage.
  Impact: Users need to reload the backing audio file after a refresh or on another device.
- [ ] Theme selection is local to the current browser profile.
  Impact: UI skin preference persists on this machine, but it does not sync across browsers or devices.
- [ ] The current spillover strategy is a tail-safe wait before preset replacement rather than a fully seamless dual-engine crossfade.
  Impact: Delay and reverb tails are given time to decay more naturally before a preset swap, but they are not preserved under the new rig indefinitely.
- [ ] The top-right CPU monitor is an in-app estimate based on latency, frame timing, and graph size rather than a hardware-level CPU reading.
  Impact: It is useful for relative performance tracking inside the app, but it should not be treated as an exact system CPU measurement.
- [ ] In the current Codex workspace environment, Vite commands may fail inside the sandbox with `spawn EPERM`.
  Impact: `npm run build` and `npm run dev` may require unrestricted execution from the assistant environment even though the project itself is valid.

PS: Current improvement areas worth tracking: keyboard shortcuts are documented but still not user-remappable from the UI, live scene stepping is not exposed as a MIDI mapping target, rack layout persistence covers order and minimized state but not per-tool visibility toggles, preset export includes local cabinet IR identifiers but not portable IR binary payloads, and the app now has several strong local-only workflows that would benefit from a future cloud or share-link layer if WAMP moves beyond single-browser use.
