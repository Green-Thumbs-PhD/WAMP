# WAMP Hotkeys And Control Inputs

This document lists the currently available shortcut-style controls in WAMP, what input device they come from, and whether they can be customized.

## Quick Summary

| Control | Source Input Device | Customizable |
| --- | --- | --- |
| Global keyboard shortcuts | Computer keyboard | No |
| Live mode keyboard shortcuts | Computer keyboard | No |
| Drum pad trigger keys | Computer keyboard | No |
| Focused control keyboard support | Computer keyboard | No |
| MIDI mappings | External MIDI controller input | Yes |

## Global Keyboard Shortcuts

These shortcuts come from the computer keyboard and are handled by the app directly.

They only fire when focus is not inside an input, textarea, select, button, link, or editable field.

| Key | Action | Source Input Device | Customizable |
| --- | --- | --- | --- |
| `Space` | Start or stop audio | Computer keyboard | No |
| `M` | Toggle metronome on/off | Computer keyboard | No |
| `T` | Tap tempo | Computer keyboard | No |
| `R` | Start looper recording, or stop recording if already recording | Computer keyboard | No |
| `P` | Play or stop the looper | Computer keyboard | No |

## Live Mode Keyboard Shortcuts

These shortcuts come from the computer keyboard and are only active while `Live mode` is enabled in the Preset Manager.

Like the global shortcuts, they do not fire while focus is inside an input, textarea, select, button, or editable field.

| Key | Action | Source Input Device | Customizable |
| --- | --- | --- | --- |
| `[` | Recall previous scene in the current setlist | Computer keyboard | No |
| `]` | Recall next scene in the current setlist | Computer keyboard | No |
| `\` | Toggle main output mute / panic mute | Computer keyboard | No |

## Drum Pad Keyboard Triggers

These also come from the computer keyboard, but they are specific to the Drum Pads rack tool.

They trigger the built-in drum pads while audio is running. Like the global shortcuts, they do not fire while the user is typing in text inputs or editable fields.

| Key | Drum Pad | Source Input Device | Customizable |
| --- | --- | --- | --- |
| `Q` | `K1` | Computer keyboard | No |
| `W` | `Sn` | Computer keyboard | No |
| `E` | `HHc` | Computer keyboard | No |
| `R` | `HHo` | Computer keyboard | No |
| `A` | `T1` | Computer keyboard | No |
| `S` | `T2` | Computer keyboard | No |
| `D` | `T3` | Computer keyboard | No |
| `F` | `Cl` | Computer keyboard | No |
| `Z` | `K2` | Computer keyboard | No |
| `X` | `Sn2` | Computer keyboard | No |
| `C` | `HH` | Computer keyboard | No |
| `V` | `Cym` | Computer keyboard | No |
| `U` | `T4` | Computer keyboard | No |
| `I` | `T5` | Computer keyboard | No |
| `O` | `T6` | Computer keyboard | No |
| `P` | `Cl2` | Computer keyboard | No |

## Focused Control Keyboard Support

These controls are not global hotkeys. They work when a compatible UI control already has focus.

At the moment, this applies to WAMP knob controls such as `Input Trim` and `Master`.

| Key | Action | Source Input Device | Customizable |
| --- | --- | --- | --- |
| `ArrowUp` | Increase the focused knob by one step | Computer keyboard | No |
| `ArrowRight` | Increase the focused knob by one step | Computer keyboard | No |
| `ArrowDown` | Decrease the focused knob by one step | Computer keyboard | No |
| `ArrowLeft` | Decrease the focused knob by one step | Computer keyboard | No |
| `PageUp` | Increase the focused knob by two steps | Computer keyboard | No |
| `PageDown` | Decrease the focused knob by two steps | Computer keyboard | No |
| `Home` | Set the focused knob to its minimum value | Computer keyboard | No |
| `End` | Set the focused knob to its maximum value | Computer keyboard | No |
| `Enter` | Commit the currently typed BPM value in tempo inputs | Computer keyboard | No |

## MIDI Mappings

These controls come from an external MIDI input device selected in the MIDI mapper.

Unlike the computer keyboard shortcuts, these are customizable. The user can choose a MIDI input, press `Learn`, and assign a MIDI Note or CC message to each supported target.

| MIDI Target | Action | Source Input Device | Customizable |
| --- | --- | --- | --- |
| `Start / Stop` | Start or stop audio | External MIDI controller | Yes |
| `Mute` | Toggle main output mute | External MIDI controller | Yes |
| `Master` | Control master output level | External MIDI controller | Yes |
| `Input Trim` | Control input trim | External MIDI controller | Yes |
| `Metronome` | Toggle metronome on/off | External MIDI controller | Yes |
| `Tap Tempo` | Tap tempo | External MIDI controller | Yes |
| `Looper Rec` | Toggle looper record / stop record | External MIDI controller | Yes |
| `Looper Play` | Toggle looper play / stop | External MIDI controller | Yes |
| `Recall A` | Recall compare snapshot A | External MIDI controller | Yes |
| `Recall B` | Recall compare snapshot B | External MIDI controller | Yes |

### MIDI Notes

- MIDI mappings support both `Note` and `CC` messages.
- Continuous control is most useful for `Master` and `Input Trim`.
- Learned mappings are stored in the browser and persist locally for that browser profile.
- Discrete `CC` mappings use a threshold-style press behavior. Values `64` and above count as pressed, and values below `64` count as released.

## Not Currently Customizable

The following input sources are fixed in the current UI:

- Computer keyboard global shortcuts
- Computer keyboard live mode shortcuts
- Computer keyboard drum pad trigger layout
- Focused keyboard support for knobs and tempo entry

## Notes

- Some keyboard keys are reused in different contexts. For example, `R` is a global looper shortcut, while `R` also triggers a drum pad when the Drum Pads keyboard handler is active.
- `P` is also reused in different contexts. It is a global looper playback shortcut, and it also triggers drum pad `Cl2` when the Drum Pads keyboard handler is active.
- Live mode shortcuts only work when `Live mode` is enabled.
- Drum pad keyboard triggers only work while audio is running and the Drum Pads tool is active in the current session.
- Focused control keyboard support is context-sensitive. Those keys do nothing until a compatible control already has focus.
- MIDI mappings are separate from computer keyboard shortcuts. MIDI customization does not change keyboard bindings.
- This document reflects the current implementation in the app as of May 3, 2026.

PS: Current limitations and improvement areas worth tracking: there is no user-facing remapping UI for computer keyboard shortcuts, live-mode scene stepping is keyboard-only and not yet exposed as MIDI targets, reused keys like `R` and `P` can create context ambiguity for new users, and the documentable keyboard control surface is still split across global shortcuts, live mode, and focused controls rather than being managed from one unified keybinding system.
