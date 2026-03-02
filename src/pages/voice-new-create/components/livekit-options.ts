export type AudioClipOption = {
  value: string;
  label: string;
  description: string;
};

export const NOISE_CANCELLATION_TYPES: {
  value: "none" | "auto" | "standard" | "telephony";
  label: string;
  description: string;
}[] = [
  {
    value: "none",
    label: "None (default)",
    description: "Disable suppression completely",
  },
  {
    value: "auto",
    label: "Auto",
    description: "Optimized background filtering",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Optimized background filtering",
  },
  {
    value: "telephony",
    label: "Telephony",
    description: "Optimized background filtering",
  },
];

export const AVATAR_OPTIONS: {
  value: string;
  label: string;
}[] = [
  { value: "6dbc1e47-7768-403e-878a-94d7fcc3677b", label: "Sophie" },
  { value: "edf6fdcb-acab-44b8-b974-ded72665ee26", label: "Mia" },
  { value: "071b0286-4cce-4808-bee2-e642f1062de3", label: "Avatar 2" },
  { value: "6cc28442-cccd-42a8-b6e4-24b7210a09c5", label: "Gabriel" },
  { value: "dc9aa3e1-32f2-499e-9921-ecabac1076fc", label: "Bella" },
  { value: "8a339c9f-0666-46bd-ab27-e90acd0409dc", label: "Finn" },
];

// Mirrored from `frontend-livekit/components/config-panel/constants.ts`.
// IMPORTANT: values must match the Python agent's background-audio mapping.
export const BACKGROUND_AMBIENCE_CLIPS: AudioClipOption[] = [
  {
    value: "OFFICE_AMBIENCE",
    label: "Office ambience",
    description: "Busy office chatter and room tone",
  },
  {
    value: "PEOPLE_IN_LOUNGE_1",
    label: "People in lounge",
    description: "Soft lounge chatter / room tone",
  },
];
export const THINKING_SFX_CLIPS: AudioClipOption[] = [
  {
    value: "KEYBOARD_TYPING",
    label: "Keyboard typing",
    description: "Long typing loop",
  },
  {
    value: "KEYBOARD_TYPING2",
    label: "Keyboard typing (short)",
    description: "Short typing burst",
  },
  {
    value: "KEYBOARD_TYPING_TRUNC",
    label: "Keyboard typing (truncated)",
    description: "Short typing burst (bundled clip)",
  },
];
