import { XMLParser } from 'fast-xml-parser';
import { htmlToText } from 'html-to-text';
import { array, number, object, optional, parse, string } from 'valibot';

import { optimizeImage } from './optimize-episode-image';
import { dasherize } from '../utils/dasherize';
import { truncate } from '../utils/truncate';
import starpodConfig from '../../starpod.config';

export interface Show {
  title: string;
  description: string;
  image: string;
  link: string;
}

export interface Episode {
  id: string;
  title: string;
  published: number;
  description: string;
  duration: number;
  content: string;
  episodeImage?: string;
  episodeNumber?: string;
  episodeSlug: string;
  episodeThumbnail?: string;
  audio: {
    src: string;
    type: string;
  };
}

const parser = new XMLParser({
  attributeNamePrefix: '',
  textNodeName: '$text',
  ignoreAttributes: false,
  entityExpansionThreshold: 10000
} as any);

async function parseFeed(url: string) {
  const res = await fetch(url);
  const xml = await res.text();
  const doc = parser.parse(xml);
  let channel = doc.rss?.channel ?? doc.feed;
  if (Array.isArray(channel)) channel = channel[0];

  const rawItems: Array<any> = channel.item ?? channel.entry ?? [];
  const items = (Array.isArray(rawItems) ? rawItems : [rawItems]).map((item: any) => {
    const enclosureRaw = item.enclosure ?? [];
    const enclosures = (Array.isArray(enclosureRaw) ? enclosureRaw : [enclosureRaw]).map(
      (e: any) => ({ url: e.url ?? e.$text, type: e.type })
    );

    const durationRaw = item['itunes:duration'];
    let itunes_duration = 0;
    if (typeof durationRaw === 'number') {
      itunes_duration = durationRaw;
    } else if (typeof durationRaw === 'string') {
      const parts = durationRaw.split(':').map(Number);
      if (parts.length === 3) itunes_duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) itunes_duration = parts[0] * 60 + parts[1];
      else itunes_duration = parts[0] ?? 0;
    }

    const itunesImage = item['itunes:image'];
    const itunes_image = itunesImage
      ? { href: itunesImage.href ?? itunesImage.$text ?? undefined }
      : undefined;

    return {
      id: item.guid?.$text ?? item.guid ?? item.id ?? '',
      title: item.title?.$text ?? item.title ?? '',
      description: item.summary?.$text ?? item.description ?? '',
      published: item.pubDate ? Date.parse(item.pubDate) : Date.now(),
      content_encoded: item['content:encoded'] ?? undefined,
      itunes_duration,
      itunes_episode: item['itunes:episode'] != null ? Number(item['itunes:episode']) : undefined,
      itunes_episodeType: item['itunes:episodeType'] ?? 'full',
      itunes_image,
      enclosures
    };
  });

  return {
    title: channel.title?.$text ?? channel.title ?? '',
    description: channel.description?.$text ?? channel.description ?? '',
    link: channel.link?.href ?? channel.link ?? '',
    image: channel.image?.url ?? channel['itunes:image']?.href ?? '',
    items
  };
}

let showInfoCache: Show | null = null;

export async function getShowInfo() {
  if (showInfoCache) {
    return showInfoCache;
  }

  const feed = await parseFeed(starpodConfig.rssFeed);
  const showInfo: Show = {
    title: feed.title,
    description: feed.description,
    link: feed.link,
    image: (await optimizeImage(feed.image, { height: 640, width: 640 })) as string
  };

  showInfoCache = showInfo;
  return showInfo;
}

let episodesCache: Array<Episode> | null = null;

export async function getAllEpisodes() {
  if (episodesCache) {
    return episodesCache;
  }

  const FeedSchema = object({
    items: array(
      object({
        id: string(),
        title: string(),
        published: number(),
        description: string(),
        content_encoded: optional(string()),
        itunes_duration: number(),
        itunes_episode: optional(number()),
        itunes_episodeType: string(),
        itunes_image: optional(object({ href: optional(string()) })),
        enclosures: array(
          object({
            url: string(),
            type: string()
          })
        )
      })
    )
  });

  const feed = await parseFeed(starpodConfig.rssFeed);
  const items = parse(FeedSchema, feed).items;

  const episodes: Array<Episode> = await Promise.all(
    items
      .filter((item) => item.itunes_episodeType !== 'trailer')
      .map(
        async ({
          description,
          content_encoded,
          id,
          title,
          enclosures,
          published,
          itunes_duration,
          itunes_episode,
          itunes_episodeType,
          itunes_image
        }) => {
          const episodeNumber =
            itunes_episodeType === 'bonus' ? 'Bonus' : `${itunes_episode}`;
          const episodeSlug = dasherize(title);
          const episodeContent = content_encoded || description;

          return {
            id,
            title: `${title}`,
            content: episodeContent,
            description: truncate(htmlToText(description), 260),
            duration: itunes_duration,
            episodeImage: itunes_image?.href,
            episodeNumber,
            episodeSlug,
            episodeThumbnail: await optimizeImage(itunes_image?.href),
            published,
            audio: enclosures.map((enclosure) => ({
              src: enclosure.url,
              type: enclosure.type
            }))[0]
          };
        }
      )
  );

  episodesCache = episodes;
  return episodes;
}
