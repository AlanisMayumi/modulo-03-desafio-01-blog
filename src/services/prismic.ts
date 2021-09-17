import Prismic from '@prismicio/client';
import { DefaultClient } from '@prismicio/client/types/client';

export const PrismicClient = Prismic.client(process.env.PRISMIC_API_ENDPOINT, {
  accessToken: process.env.PRISMIC_ACCESS_TOKEN,
});

export function getPrismicClient(req?: unknown): DefaultClient {
  const prismic = Prismic.client(process.env.PRISMIC_API_ENDPOINT, {
    req,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });
  return prismic;
}
