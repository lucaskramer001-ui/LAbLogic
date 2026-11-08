# Dancing plague Short - production notes

- ElevenLabs flow `BJEd4sPPos699UWhhLRG` ("Hollow Hour - Dancing Plague Short"): TTS node 8qE15gxcWoJE21Waz58H
  (Jack, eleven_v4, 1,200 credits, 81.6 s), Scribe node qDkQOi1GRP89Itv8ACCn (0 credits), 6 sfx (17 credits each).
- Voice: `python3 video/images/dance/scripts/voice.py 0.38 1.1` -> 67.8 s.
- Script: `script.txt` (captions/reading) and `tts.txt` (years spelled out for the voice).
- SFX loop builder (run from video/public/dance): raw mp3s in sfx_raw/, normalised wavs in sfx/; drone looped to
  75 s with 1 s crossfades, fiddle and stomp to 30 s with 80 ms crossfades, one-shots trimmed to onset with a
  50 ms tail fade. (Code: see the session; same idea as lab-logic scripts/sfx.py with a `loop(x, L, xf)` helper.)
- Fonts: Cinzel 700/900 and IM Fell English from @fontsource (npm pack), copied to video/public/fonts.
