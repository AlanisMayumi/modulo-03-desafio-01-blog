import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { FiCalendar, FiClock } from 'react-icons/fi';
import { AiOutlineUser } from 'react-icons/ai';
import PrismicDOM from 'prismic-dom';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import Comments from '../../components/Comments';
import Preview from '../../components/Preview';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  nextPost?: {
    uid?: string;
    data?: {
      title?: string;
    };
  };
  prevPost?: {
    uid?: string;
    data?: {
      title?: string;
    };
  };
}

export default function Post({
  post,
  preview,
  nextPost,
  prevPost,
}: PostProps): JSX.Element {
  const router = useRouter();
  const text = post.data.content.reduce((textAmount, paragraph) => {
    const { heading } = paragraph;
    const body = PrismicDOM.RichText.asText(paragraph.body);

    return textAmount + heading + body;
  }, '');
  const readingTime = text.split(/\s+/).length / 200;

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <Header />
      </Head>
      <img src={post.data.banner.url} alt="banner" />
      <main className={commonStyles.main}>
        <article className={styles.article}>
          <h1 className={styles.title}>{post.data.title}</h1>
          <div id="info" className={commonStyles.info}>
            <time>
              <FiCalendar className={commonStyles.icon} />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
            <div className={commonStyles.userInfo}>
              <AiOutlineUser className={commonStyles.icon} />
              {post.data.author}
            </div>
            <div className={commonStyles.userInfo}>
              <FiClock className={commonStyles.icon} />
              <span>{Math.ceil(readingTime)} min</span>
            </div>
          </div>
          {post.last_publication_date &&
            `* editado em ${format(
              new Date(post.last_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }
            )}, às ${format(new Date(post.last_publication_date), 'hh:mm', {
              locale: ptBR,
            })}`}

          <div className={styles.content} />
          {post.data.content.map(content => (
            <div key={content.heading}>
              <h2 className={styles.paragraphTitle}>{content.heading}</h2>
              {content.body.map(paragraph => (
                <p key={paragraph.text} className={styles.paragraph}>
                  {paragraph.text}
                </p>
              ))}
              <br />
            </div>
          ))}

          <div className={styles.footerButtons}>
            <div>
              {prevPost && (
                <Link href={`/post/${prevPost.uid}`}>
                  <a>
                    <p className={styles.footerButtonTitle}>
                      {prevPost.data.title}
                    </p>
                    <p className={styles.footerButtonText}>Post anterior</p>
                  </a>
                </Link>
              )}
            </div>
            <div>
              {nextPost && (
                <Link href={`/post/${nextPost.uid}`}>
                  <a>
                    <p className={styles.footerButtonTitle}>
                      {nextPost.data.title}
                    </p>
                    <p className={styles.footerButtonText}>Próximo post</p>
                  </a>
                </Link>
              )}
            </div>
          </div>
          <Comments />
        </article>
        {preview && <Preview />}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.uid'],
      pageSize: 10,
    }
  );

  const results = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: results,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({
  preview = false,
  previewData = {},
  params,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
    pageSize: 100,
  });

  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
  };

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
    }
  );
  const mainPostindex = posts.results.findIndex(p => p.uid === post.uid);
  const nextPost = posts.results[mainPostindex + 1]
    ? posts.results[mainPostindex + 1]
    : null;
  const prevPost = posts.results[mainPostindex - 1]
    ? posts.results[mainPostindex - 1]
    : null;

  return {
    props: {
      post,
      preview,
      nextPost,
      prevPost,
    },

    revalidate: 60 * 30, // 30 minutes
  };
};
