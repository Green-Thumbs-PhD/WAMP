# WAMP Hotkeys And Control Inputs

This document lists the currently available shortcut-style controls in WAMP, what input device they come from, and whether they can be customized.

## Quick Summary

| Control | Source Input Device | Customizable |
| --- | --- | --- |
| Global keyboard shortcuts | Computer keyboard | No |
| Drum pad trigger keys | Computer keyboard | No |
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

## Not Currently Customizable

The following input sources are fixed in the current UI:

- Computer keyboard global shortcuts
- Computer keyboard drum pad trigger layout

## Notes

- Some keyboard keys are reused in different contexts. For example, `R` is a global looper shortcut, while `R` also triggers a drum pad when the Drum Pads keyboard handler is active.
- MIDI mappings are separate from computer keyboard shortcuts. MIDI customization does not change keyboard bindings.
- This document reflects the current implementation in the app as of April 13, 2026.
