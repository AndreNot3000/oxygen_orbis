/**
 * 🏨 OXYGEN ORBIS AMBIENT SOUNDSCAPE SERVICE
 * Authentic Nigerian & Yoruba chill instrumental soundscape.
 * High-fidelity royalty-free tracks, audio metadata, and stream fallbacks.
 */

export const TRACKS_PLAYLIST = [
  {
    id: 'yoruba-cool',
    title: 'Oxygen Orbis • Yoruba Highlife Chill',
    subtitle: 'Cool & Elegant Nigerian Instrumental',
    src: '/audio/oxygen-yoruba-lounge.mp3',
    fallbackSrc: 'https://archive.org/download/AfrobeatInstrumentalByFreezyBeatzViaInstrumentals.com.ng/Afrobeat%20Instrumental%20By%20Freezy%20Beatz%20via%20instrumentals.com.ng.mp3',
    genre: 'Yoruba Highlife / Neo-Soul Chillout',
    bpm: 98,
    description: 'Breezy Nigerian rhythms, elegant guitar tones, and refreshing chillout percussion.',
  },
  {
    id: 'sunset-lounge',
    title: 'Oxygen Orbis • Sunset Balafon Lounge',
    subtitle: 'Gentle Afro-Lounge Instrumental',
    src: '/audio/oxygen-afro-lounge.mp3',
    fallbackSrc: 'https://archive.org/download/jamendo-553713/01-2142368-Loksii-Chill%20Recreation.mp3',
    genre: 'Afro-Chillout / Balafon Lounge',
    bpm: 96,
    description: 'Warm nylon guitars, gentle balafon rhythms, Rhodes electric piano, and relaxing poolside sub-bass.',
  },
];

export const TRACK_INFO = TRACKS_PLAYLIST[0];
