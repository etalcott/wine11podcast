import { defineStarpodConfig } from ‘src/utils/config’;

export default defineStarpodConfig({
  blurb: ‘The world’s most approachable wine podcast. No snobbery required.’,
  description:
    ‘Wine One One is a podcast for curious wine drinkers hosted by Jennifer, Erin, and Lisa. Each episode blends approachable wine education with honest conversation about life, taste, and what’s in the glass.’,
  hosts: [
    {
      name: ‘Jennifer’,
      bio: ‘Wine lover, storyteller, and the one who always brings the good bottle.’,
      img: ‘jennifer.jpg’
    },
    {
      name: ‘Erin’,
      bio: ‘Certified wine nerd with a talent for making it make sense.’,
      img: ‘erin.jpg’
    },
    {
      name: ‘Lisa’,
      bio: ‘Here for the rosé and the real talk.’,
      img: ‘lisa.jpg’
    }
  ],
  platforms: {},
  rssFeed: ‘https://rss.flightcast.com/w7bqgc792i30fd43a32uawx0.xml’
});
