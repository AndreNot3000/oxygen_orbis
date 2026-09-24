/**
 * 🏨 OXYGEN ORBIS RESORT SOUNDSCAPE SERVICE
 * Curated playlist featuring cool jazz lounge as default primary track,
 * with authentic traditional Yoruba talking drums and highlife tracks.
 */

export const TRACKS_PLAYLIST = [
  {
    id: 'cool-jazz-lounge',
    title: 'Oxygen Orbis • Cool Jazz Lounge',
    subtitle: 'Smooth Tenor Sax & Velvet Rhodes Piano',
    src: '/audio/oxygen-cool-jazz-lounge.mp3',
    fallbackSrc: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/On%20the%20Cool%20Side.mp3',
    genre: 'Cool Jazz / Midnight Luxury Lounge',
    instruments: 'Tenor Saxophone, Rhodes Electric Piano, Muted Trumpet, Upright Bass, Jazz Kit',
    description: 'Sophisticated, calming cool jazz instrumental with warm saxophone and electric piano melodies.',
  },
  {
    id: 'cool-jazz-vibes',
    title: 'Oxygen Orbis • Midnight Cool Vibes',
    subtitle: 'Calming Vibraphone & Acoustic Bass',
    src: '/audio/oxygen-cool-jazz-vibes.mp3',
    fallbackSrc: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cool%20Vibes.mp3',
    genre: 'West Coast Cool Jazz / Noir Lounge',
    instruments: 'Vibraphone, Upright Double Bass, Jazz Brushes',
    description: 'Peaceful and spacious cool jazz vibraphone session evoking tranquil resort evenings.',
  },
  {
    id: 'yoruba-talking-drum-shekere',
    title: 'Oxygen Orbis • Traditional Dundun & Shekere',
    subtitle: 'Authentic Indigenous Yoruba Talking Drums',
    src: '/audio/oxygen-yoruba-talking-drum-shekere.mp3',
    fallbackSrc: 'https://archive.org/download/lp_drums-of-the-yoruba-of-nigeria_yoruba_0/disc1/02.03.%20Dundun%20Drums%20And%20Shekere%20Rattles.mp3',
    genre: 'Traditional Yoruba Indigenous Percussion',
    instruments: 'Dundun (Talking Drums), Shekere (Gourd Rattles), Aro (Iron Chimes)',
    description: 'Authentic master talking drum conversations and shekere rhythms from Western Nigeria.',
  },
  {
    id: 'yoruba-traditional-dundun',
    title: 'Oxygen Orbis • Drums of the Yoruba',
    subtitle: 'Classical Dundun Talking Drum Ensemble',
    src: '/audio/oxygen-yoruba-traditional-dundun.mp3',
    fallbackSrc: 'https://archive.org/download/lp_drums-of-the-yoruba-of-nigeria_yoruba_0/disc1/02.01.%20Dundun%20Drums%20%28Talking%20Drums%29.mp3',
    genre: 'Traditional Yoruba Dundun Ensemble',
    instruments: 'Iya Ilu (Mother Talking Drum), Gudugudu, Kerikeri, Isaaju',
    description: 'Traditional royal Dundun talking drum ensemble evoking the grandeur of Oyo and Ibadan heritage.',
  },
  {
    id: 'yoruba-highlife-chill',
    title: 'Oxygen Orbis • Yoruba Highlife Chill',
    subtitle: 'Cool & Elegant Highlife Instrumental',
    src: '/audio/oxygen-yoruba-lounge.mp3',
    fallbackSrc: 'https://archive.org/download/AfrobeatInstrumentalByFreezyBeatzViaInstrumentals.com.ng/Afrobeat%20Instrumental%20By%20Freezy%20Beatz%20via%20instrumentals.com.ng.mp3',
    genre: 'Yoruba Highlife / Neo-Soul Chillout',
    instruments: 'Acoustic Guitar, Shakers, Congas, Bass',
    description: 'Refreshing Nigerian highlife guitar melodies with subtle chillout groove.',
  },
];

export const TRACK_INFO = TRACKS_PLAYLIST[0];
